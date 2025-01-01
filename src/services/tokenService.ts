import { ExtensionContext, Disposable, Uri, Position, CompletionItemKind, CompletionItem, SnippetString, CompletionItemLabel, TextDocument } from "vscode";
import { DocumentToken } from "./tokenTypes";
import { DocumentTokenService } from "./documentTokenService";
import { ApiTokenService } from "./apiTokenService";

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
        tokens.push(documentToken);
        tokens.push(...apiTokens);
        return tokens;
    }
    public getBlockStatementTokenAtPosition(uri: Uri, position: Position): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        let documentToken: DocumentToken | undefined;
        //get the block statement from document members from only the original file
        const document = documentMembers.find(member => member.uri === uri.toString());
        if (document === undefined) { return undefined; }
        documentToken = document.internalEvents.find(member => member.blockRange?.contains(position) ?? false);
        if (documentToken === undefined) {
            documentToken = document.internalFunctions.find(member => member.blockRange?.contains(position) ?? false);
        }
        if (documentToken === undefined) {
            documentToken = document.internalStructures.find(member => member.blockRange?.contains(position) ?? false);
        }
        //if not found in block range, check parameter range
        if (documentToken === undefined) {
            documentToken = document.internalFunctions.
                find(member => member.parameterRange?.contains(position) ?? false);
        }
        return documentToken;
    }
    public getDocumentMemberAtPosition(uri: Uri, position: Position): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.nameRange.contains(position));
    }
    public getGlobalDocumentMemberByName(uri: Uri, name: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        const currentDocument = documentMembers.find(member => member.uri === uri.toString());
        const externalDocuments = documentMembers.filter(member => member.uri !== uri.toString());
        const documentsToSearch = currentDocument.internalVariables.
            concat(currentDocument.internalStructures).
            concat(externalDocuments);
        const temp  = documentsToSearch.find(member => member.name === name);
        return temp;
    }
    public getLocalDocumentMemberByName(uri: Uri, name: string, position: Position): DocumentToken | undefined {
        const blockMember = this.getBlockStatementTokenAtPosition(uri, position);
        if (blockMember === undefined) { return undefined; }
        return blockMember.internalVariables.find(member => member.name === name);
    }
    public isAtParameterRange(uri: Uri, position: Position): boolean {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return false; }
        const document = documentMembers.find(member => member.uri === uri.toString());
        const documentMember = document.internalFunctions.find(member => member.parameterRange?.contains(position) ?? false);
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
        return documentMembers.find(member => member.name === dataType);
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