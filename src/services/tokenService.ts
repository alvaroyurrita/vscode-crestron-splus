import { ExtensionContext, Disposable, Uri, Position, CompletionItemKind, CompletionItem, SnippetString, CompletionItemLabel, TextDocument, Range } from "vscode";
import { DocumentToken } from "./tokenTypes";
import { DocumentTokenService } from "./documentTokenService";
import { ApiTokenService } from "./apiTokenService";
import { cpuUsage } from "process";

export class TokenService implements Disposable {

    private static _instance: TokenService;
    private _documentTokenService: DocumentTokenService;
    private _apiTokenService: ApiTokenService;

    public static getInstance(ctx: ExtensionContext): TokenService {
        if (!TokenService._instance && ctx) {
            TokenService._instance = new TokenService(ctx);
        }
        return TokenService._instance;
    }
    private constructor(ctx: ExtensionContext) {
        this._documentTokenService = DocumentTokenService.getInstance(ctx);
        this._apiTokenService = ApiTokenService.getInstance(ctx);
    }
    public dispose() {
        this._documentTokenService.dispose();
        this._apiTokenService.dispose();
    }
    public getDocumentMembers(uri: Uri): DocumentToken[] | undefined {
        const tokens: DocumentToken[] = [];
        const documentToken = this._documentTokenService.getTokens(uri);
        const apiTokens = this._apiTokenService.getTokens(uri);
        if (documentToken !== undefined) { tokens.push(documentToken); }
        if (apiTokens !== undefined && apiTokens.length > 0) { tokens.push(...apiTokens); }
        return tokens;
    }

    //returns the object (structure, event or function, or parameter range) that a position is inside of.
    // used to figure out what members to display during autocomplete
    public getObjectAtPosition(uri: Uri, position: Position): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        let documentToken: DocumentToken | undefined;
        //get the block statement from document members from only the original file
        const document = documentMembers.find(member => member.uri === uri.toString());
        if (document === undefined) { return undefined; }
        documentToken = document.internalEvents?.find(member => member.blockRange?.contains(position) ?? false);
        if (documentToken === undefined) {
            documentToken = document.internalFunctions?.find(member => member.blockRange?.contains(position) ?? false);
        }
        if (documentToken === undefined) {
            documentToken = document.internalStructures?.find(member => member.blockRange?.contains(position) ?? false);
        }
        //if not found in block range, check parameter range
        if (documentToken === undefined) {
            documentToken = document.internalFunctions?.
                find(member => member.parameterRange?.contains(position) ?? false);
        }
        return documentToken;
    }
    //Returns the member of object tree.  Matches as long as it is a full member (ends in . or ( or [))
    //Use for function param auto complete ( ( ) or for next class member autocompletion (.)
    public getDocumentMemberAtPosition(document: TextDocument, position: Position): DocumentToken | undefined {
        const uri = document.uri;
        const offsetPosition = document.offsetAt(position);
        let textUntilPosition = document.getText().slice(0, offsetPosition);
        // let textUntilPosition = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = textUntilPosition.match(/((?:(?:[_\w][_#$\w]*)\s*\.\s*)*(?:[_\w][_#$\w]*)\s*)[\.\(\[]$/);//grab any group of words followed by a dot or a Opening Param at the end of the string (ie: test.test.  or test.test(  )
        if (!wordWithDotMatch) { undefined; }
        const tokenTree = wordWithDotMatch[1].match(/[_\w][_#$\w]*/gm);
        let currentToken = tokenTree.shift();
        //Look for global variables first
        let currentObject: DocumentToken;
        currentObject = this.getLocalDocumentMemberByName(uri, currentToken, position);
        if (!currentObject) {
            currentObject = this.getGlobalDocumentMemberByName(uri, currentToken);
            //then local variables
            if (!currentObject) { return undefined; }
        }
        if (currentObject.kind === CompletionItemKind.Variable) {
            // test if object is something other than a variable (ie: a class or enum)
            let testObject = this.getDocumentMemberByDataType(uri, currentObject.dataType);
            currentObject = testObject ? testObject : currentObject;
        }
        console.log("Object at base tree: ", currentObject);
        switch (currentObject.kind) {
            case CompletionItemKind.Struct:
            case CompletionItemKind.Class:
                {
                    currentToken = tokenTree.shift();
                    while (currentToken) {
                        const allClassObjects = this.getObjectInternalMembers(currentObject);
                        if (allClassObjects === undefined) { return undefined; };
                        currentObject = allClassObjects.find(v => v.name === currentToken);
                        if (currentObject === undefined) { return undefined; };
                        const nextObject = this.getDocumentMemberByDataType(uri, currentObject.dataType);
                        if (nextObject === undefined) { return currentObject; }
                        else { currentObject === nextObject };
                        currentToken = tokenTree.shift();
                    }
                    console.log("Class member at end of base tree : ", currentObject);
                    return currentObject;
                }
            default:
                console.log("Other member at end of base tree (should be same as base tree) : ", currentObject);
                return currentObject;
        }
    }

    public getGlobalDocumentMemberByName(uri: Uri, name: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        const currentDocument = documentMembers.find(member => member.uri === uri.toString());
        const externalDocuments = documentMembers.filter(member => member.uri !== uri.toString());
        const documentsToSearch = currentDocument.internalVariables.
            concat(currentDocument.internalStructures).
            concat(externalDocuments);
        const temp = documentsToSearch.find(member => member.name === name);
        return temp;
    }
    public getLocalDocumentMemberByName(uri: Uri, name: string, position: Position): DocumentToken | undefined {
        const blockMember = this.getObjectAtPosition(uri, position);
        if (blockMember === undefined) { return undefined; }
        return blockMember.internalVariables.find(member => member.name === name);
    }

    //asserts that a particular position is inside the parameter range of an object that has a function inside
    public isAtParameterRange(uri: Uri, position: Position): boolean {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return false; }
        const document = documentMembers.find(member => member.uri === uri.toString());
        const documentMember = document.internalFunctions?.find(member => member.parameterRange?.contains(position) ?? false);
        return documentMember !== undefined;
    }
    public getFunctionInfo(uri: Uri, tokenLabel: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.name === tokenLabel && member.kind === CompletionItemKind.Function);
    }
    public getDocumentMemberByDataType(uri: Uri, dataType: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        const currentDocument = documentMembers.find(member => member.uri === uri.toString());
        const externalDocuments = documentMembers.filter(member => member.uri !== uri.toString());
        const documentsToSearch = currentDocument.internalVariables.
            concat(currentDocument.internalStructures).
            concat(externalDocuments);
        return documentsToSearch.find(member => member.name === dataType);
    }

    private getObjectInternalMembers(token: DocumentToken): DocumentToken[] {
        let internalMembers: DocumentToken[] = [];
        if (token === undefined) { return internalMembers; };
        if (token.internalConstants !== undefined) { internalMembers.push(...token.internalConstants); }
        if (token.internalDelegateProperties !== undefined) { internalMembers.push(...token.internalDelegateProperties); }
        if (token.internalDelegates !== undefined) { internalMembers.push(...token.internalDelegates); }
        if (token.internalEvents !== undefined) { internalMembers.push(...token.internalEvents); }
        if (token.internalFunctions !== undefined) { internalMembers.push(...token.internalFunctions); }
        if (token.internalProperties !== undefined) { internalMembers.push(...token.internalProperties); }
        if (token.internalStructures !== undefined) { internalMembers.push(...token.internalStructures); }
        if (token.internalVariables !== undefined) { internalMembers.push(...token.internalVariables); }
        return internalMembers;
    }

    public getCompletionItemsFromDocumentTokens(tokens: DocumentToken[]): CompletionItem[] {
        if (tokens === undefined) { return []; }
        const items: CompletionItem[] = tokens.map(t => {
            let itemLabel: CompletionItemLabel = {
                label: t.name,
                description: t.dataType.toString()
            };
            let documentation: string = "";
            const item = new CompletionItem(itemLabel, t.kind);
            if (t.kind === CompletionItemKind.Function) {
                documentation = `${t.dataType} ${t.name}(`;
                if (t.parameters.length > 0) {
                    documentation += t.parameters.map(p => `${p.dataType} ${p.name}`).join(", ");
                }
                documentation += ")";
                const snippetString = new SnippetString();
                snippetString.appendText(t.name);
                snippetString.appendText("(");
                if (t.parameters.length > 0) {
                    t.parameters.forEach((parameter, index, parameters) => {
                        if (index > 0) { snippetString.appendText(", "); }
                        snippetString.appendPlaceholder(parameter.name);
                    });
                }
                else {
                    snippetString.appendTabstop();
                }
                snippetString.appendText(")");
                item.insertText = snippetString;
                item.command = {
                    command: "editor.action.triggerParameterHints",
                    title: "triggerSignatureHelp",
                };
            }
            item.documentation = documentation;
            return item;
        });
        return items;
    }
}