import {
    Disposable,
    TextDocument,
    Uri,
    DocumentSelector,
    ExtensionContext,
    workspace,
    window,
    TextDocumentChangeEvent,
    FileSystemWatcher,
    extensions,
    RelativePattern,
} from "vscode";
import { ApiParser } from "../helpers/apiParser";
import { SimplPlusObject } from "../base/simplPlusObject";
import { join } from "path";
import * as fs from "fs";

//  A specific usp might reference a clz.  Many usp might reference the same clz
//  a clz will generate an api file. The api file will be used to provide completion items.
//  This service will automatically generate an api on every clz change and generate its document tokens
//  Document tokens will not be cleared until the service is disposed.
//  The service will also stored the dlls that each usp uses.
//  The service will provide all tokens from all reference clz per usp document uri.
//  Token will be generated using the apiParser library that needs an API path to generate document tokens.

export class simplPlusApiObjectService implements Disposable {
    //Stores that watchers for a specific parent folder  where the .CLZ libraries are stored
    private _watchers = new Map<string, FileSystemWatcher>();
    //Stores tokens for a specific .CLZ Library
    private _apis = new Map<string, SimplPlusObject[]>();
    //stores the documents that need api tokens.
    private _documents = new Map<string, string[]>();
    private static _instance: simplPlusApiObjectService;
    private selector: DocumentSelector = 'simpl-plus';
    public static getInstance(ctx: ExtensionContext): simplPlusApiObjectService {
        if (!simplPlusApiObjectService._instance) {
            simplPlusApiObjectService._instance = new simplPlusApiObjectService(ctx);
        }
        return simplPlusApiObjectService._instance;
    }

    private constructor(ctx: ExtensionContext) {
        const onOpenTextDocument_event = workspace.onDidOpenTextDocument((document) => this.updateOnOpenTextDocument(document));
        const onDidChangeTextDocument_event = workspace.onDidChangeTextDocument((editor) => this.updateOnDidChangeTextDocument(editor));
        const onCloseTextDocument_event = workspace.onDidCloseTextDocument((document) => this.updateOnCloseTextDocument(document));
        ctx.subscriptions.push(
            onOpenTextDocument_event,
            onDidChangeTextDocument_event,
            onCloseTextDocument_event,
        );
        const document = window.activeTextEditor?.document;
        if (document !== undefined && document.languageId === this.selector.toString()) { this.tokenize(document); }

    }
    public dispose() {
        this._apis.clear();
        this._watchers.forEach(u => u.dispose());
        this._watchers.clear();
    }

    public getObjects(uri: Uri): SimplPlusObject[] {
        const documentTokens: SimplPlusObject[] = [];
        this._documents.get(uri.toString())?.forEach((library) => {
            const tokens = this._apis.get(library);
            if (tokens) {
                documentTokens.push(...tokens);
            }
        });
        return documentTokens;
    }

    private async updateOnCloseTextDocument(document: TextDocument): Promise<void> {
        if (document.languageId !== this.selector.toString()) { return; }
        this._documents.delete(document.uri.toString());
        console.log("API Document closed");
    }
    private async updateOnDidChangeTextDocument(editor: TextDocumentChangeEvent | undefined): Promise<void> {
        if (editor === undefined) { return; }
        const document = editor.document;
        if (document.languageId !== this.selector.toString()) { return; }
        await this.tokenize(document);
    }
    private async updateOnOpenTextDocument(document: TextDocument): Promise<void> {
        if (document.languageId !== this.selector.toString()) { return; }
        await this.tokenize(document);
    }

    private async tokenize(document: TextDocument): Promise<void> {
        let libraryMatches: string[] = [];
        let inComment = false;
        //searches through documents for instances of simplsharp libraries while ignoring commented lines
        for (let line = 0; line < document.lineCount; line++) {
            const lineText = document.lineAt(line).text;
            if (lineText.includes("//")) { continue; }
            if (lineText.includes("/*")) { inComment = true; }
            if (lineText.includes("*/")) { inComment = false; }
            if (inComment) { continue; }
            const libraryMatch = lineText.match(/#USER_SIMPLSHARP_LIBRARY "(.*)"/);
            if (libraryMatch) {
                libraryMatches.push(libraryMatch[1]);
            }
        }
        if (libraryMatches.length === 0) {
            return;
        }
        const documentParentFolder = document.uri.fsPath.slice(0, document.uri.fsPath.lastIndexOf("\\"));
        //if the there are no watchers for the document's parent folder, create a new watcher and set listeners
        if (!this._watchers.has(documentParentFolder)) {
            const clzWatcherPath = new RelativePattern(documentParentFolder, '*.clz');
            const fsWatcher = workspace.createFileSystemWatcher(clzWatcherPath);
            fsWatcher.onDidChange((e) => { this.updateLibrary(e); });
            fsWatcher.onDidCreate((e) => { this.updateLibrary(e); });
            fsWatcher.onDidDelete((e) => { this.deleteLibrary(e); });
            this._watchers.set(documentParentFolder, fsWatcher);
        }
        //store tokens for each CLZ Library
        const clzDocuments: string[] = [];
        for (const library of libraryMatches) {
            const CLZFullPath = join(documentParentFolder, library + ".clz");
            if (!fs.existsSync(CLZFullPath)) { continue; }
            clzDocuments.push(CLZFullPath);
            if (!this._apis.has(CLZFullPath)) {
                // Generate API File from CLZ
                try {
                    await this.runApiGenerator(CLZFullPath);
                }
                catch (error) {
                    console.error(error);
                }
                //generate API Tokens
                const apiFile = join(documentParentFolder, "SPlsWork", library + ".api");
                const apiTokens = await ApiParser(apiFile);
                this._apis.set(CLZFullPath, apiTokens);
            }
        };
        this._documents.set(document.uri.toString(), clzDocuments);
    }
    private deleteLibrary(e: Uri) {
        //check if one of the stored CLZ libraries has been deleted
        const CLZPathToCheck = e.fsPath.slice(0, e.fsPath.lastIndexOf(".")) + ".clz";
        if (!this._apis.has(CLZPathToCheck)) { return; }
        //if it has, remove tokens
        this._apis.delete(CLZPathToCheck);
    }
    private async updateLibrary(e: Uri) {
        //check if one of the stored CLZ libraries has been updated or created
        const library = e.fsPath.slice(e.fsPath.lastIndexOf("\\") + 1, e.fsPath.lastIndexOf("."));
        const CLZPath = e.fsPath.slice(0, e.fsPath.lastIndexOf(".")) + ".clz";
        const documentParentFolder = e.fsPath.slice(0, e.fsPath.lastIndexOf("\\"));
        if (!this._apis.has(CLZPath)) { return; }
        //if it has, generate API Tokens
        // Generate API File from CLZ
        try {
            await this.runApiGenerator(CLZPath);
        }
        catch (error) {
            console.error("Error during API Generation", error);
        }
        // and store them
        const apiFile = join(documentParentFolder, "SPlsWork", library + ".api");
        const apiTokens = await ApiParser(apiFile);
        this._apis.set(CLZPath, apiTokens);
    }

    private async runApiGenerator(CLZLibraryPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const simplDirectory = workspace.getConfiguration("simpl-plus").simplDirectory;
            const extensionPath = extensions.getExtension("sentry07.simpl-plus")?.extensionPath;
            if (extensionPath === undefined) { resolve(); }
            const simpPlusApiGeneratorPath = join(extensionPath, "ApiGenerator", "SimplPlusApiGenerator.exe");

            let buildCommand = `.\"${simpPlusApiGeneratorPath}\" \"${CLZLibraryPath}\" \"${simplDirectory}\"`;

            // Execute a command in a terminal immediately after being created
            const apiTerminal = window.createTerminal();
            let isBuilding = false;
            window.onDidChangeTerminalShellIntegration(async ({ terminal, shellIntegration }) => {
                if (terminal === apiTerminal && !isBuilding) {
                    //prevents from executing the command for every change on the terminal
                    isBuilding = true;
                    const execution = shellIntegration.executeCommand(buildCommand);
                    window.onDidEndTerminalShellExecution(event => {
                        if (event.terminal === apiTerminal) {
                            if (event.execution === execution) {
                                if (event.exitCode === 0) {
                                    resolve();
                                } else {
                                    reject(new Error(`Build failed with exit code ${event.exitCode}`));
                                }
                            }
                            apiTerminal.hide();
                            apiTerminal.dispose();
                            isBuilding = false;
                        }
                    });
                }
            });
        });
    }
}