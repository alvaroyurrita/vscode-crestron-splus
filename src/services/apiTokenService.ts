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
    RelativePattern
} from "vscode";
import { provideClassTokens } from "../helpers/apiParser";
import { DocumentToken } from "./tokenTypes";
import { join } from "path";

//   A specific usp might reference a clz.  Many usp might reference the same cls
//  a clz will generate an api file. The api file will be used to provide completion items.
// This service will store every api document items based on the clz file that generated it via the api file.
//  Document tokens will not be cleared until the service is disposed.
//  The service will listen to the clz for changes, and it will generate the api file and token when it changes



export class ApiTokenService implements Disposable {
    //Stores that watchers for a specific parent folder  where the .CLZ libraries are stored
    private _watchers = new Map<string, FileSystemWatcher>();
    //Stores tokens for a specific .CLZ Library
    private _apis = new Map<string, DocumentToken[]>();
    //stores the documents that need api tokens.
    private _documents = new Map<Uri, string[]>();
    private static _instance: ApiTokenService;
    private selector: DocumentSelector = 'simpl-plus';
    public static getInstance(ctx: ExtensionContext): ApiTokenService {
        if (!ApiTokenService._instance) {
            ApiTokenService._instance = new ApiTokenService(ctx);
        }
        return ApiTokenService._instance;
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
        if (document.languageId === this.selector.toString()) { this.tokenize(document); }

    }
    public dispose() {
        this._apis.clear();
        this._watchers.forEach(u => u.dispose());
        this._watchers.clear();
    }

    public getLibraryTokens(document: TextDocument): DocumentToken[] {
        const documentTokens: DocumentToken[] = [];
        this._documents.get(document.uri)?.forEach((library) => {
            const tokens = this._apis.get(library);
            if (tokens) {
                documentTokens.push(...tokens);
            }
        });
        return documentTokens;
    }

    private async updateOnCloseTextDocument(document: TextDocument): Promise<void> {
        console.log("Document closed");
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
        const libraryRegex = /#USER_SIMPLSHARP_LIBRARY "(.*)"/g;
        const libraries = document.getText().matchAll(libraryRegex);
        const libraryMatches = Array.from(libraries);
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
        const clzDocuments: string[]=[];
        for (const library of libraryMatches) {
            const CLZFullPath = join(documentParentFolder, library[1] + ".clz");
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
                const apiFile = join(documentParentFolder, "SPLsWork", library[1] + ".api");
                const apiTokens = await provideClassTokens(apiFile);
                this._apis.set(CLZFullPath, apiTokens);
            }
        };
        this._documents.set(document.uri, clzDocuments);
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
        const CLZPathToCheck = e.fsPath.slice(0, e.fsPath.lastIndexOf(".")) + ".clz";
        const documentParentFolder = e.fsPath.slice(0, e.fsPath.lastIndexOf("\\"));
        if (!this._apis.has(CLZPathToCheck)) { return; }
        //if it has, generate API Tokens
        // Generate API File from CLZ
        try {
            await this.runApiGenerator(CLZPathToCheck);
        }
        catch (error) {
            console.error(error);
        }
        // and store them
        const apiFile = join(documentParentFolder, "SPLsWork", library + ".api");
        const apiTokens = await provideClassTokens(apiFile);
        this._apis.set(CLZPathToCheck, apiTokens);
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
            window.onDidChangeTerminalShellIntegration(async ({ terminal, shellIntegration }) => {
                if (terminal === apiTerminal) {
                    const execution = shellIntegration.executeCommand(buildCommand);
                    window.onDidEndTerminalShellExecution(event => {
                        if (event.execution === execution) {
                            if (event.exitCode === 0) {
                                resolve();
                            } else {
                                reject(new Error(`Build failed with exit code ${event.exitCode}`));
                            }
                        }
                        apiTerminal.hide();
                        apiTerminal.dispose();
                    });
                }
            });
            // // Fallback to sendText if there is no shell integration within 3 seconds of launching
            // setTimeout(() => {
            //     if (!apiTerminal.shellIntegration) {
            //         apiTerminal.sendText('echo "Hello world"');
            //         // Without shell integration, we can't know when the command has finished or what the
            //         // exit code was.
            //     }
            // }, 3000);
            // apiTerminal.hide();
            // apiTerminal.dispose();
        });
    }
}