import { DocumentSelector, ExtensionContext, TextDocument, TextEditor, window, workspace } from "vscode";
import TextmateLanguageService, { TextmateToken } from "vscode-textmate-languageservice";
import { DocumentMembers, Token } from "./tokenTypes";
import { all, get } from "axios";
export class TokenService {
    private _documents = new Map<string, DocumentMembers>();
    private static _instance: TokenService;
    private selector: DocumentSelector = 'simpl-plus';
    private _textmateService: TextmateLanguageService;
    public static getInstance(ctx: ExtensionContext): TokenService {
        if (!TokenService._instance && ctx) {
            TokenService._instance = new TokenService(ctx);
        }
        return TokenService._instance;
    }

    private constructor(ctx: ExtensionContext) {
        this._textmateService = new TextmateLanguageService(this.selector.toString(), ctx);
        const onOpenTextDocument_event = workspace.onDidOpenTextDocument((document) => this.updateOnOpenTextDocument(document));
        const onChangeActiveTextEditor_event = window.onDidChangeActiveTextEditor((editor) => this.updateOnChangeActiveTextEditor(editor));
        const onCloseTextDocument_event = workspace.onDidCloseTextDocument((document) => this.updateOnCloseTextDocument(document));

        ctx.subscriptions.push(
            onOpenTextDocument_event,
            onChangeActiveTextEditor_event,
            onCloseTextDocument_event,
        );
    }
    async updateOnCloseTextDocument(document: TextDocument): Promise<void> {
        console.log("Document closed");
    }
    async updateOnChangeActiveTextEditor(editor: TextEditor | undefined): Promise<void> {
        if (editor === undefined) { return; }
        const document = editor.document;
        await this.tokenize(document);
    }
    async updateOnOpenTextDocument(document: TextDocument): Promise<void> {
        await this.tokenize(document);
    }
    async tokenize(document: TextDocument | undefined): Promise<void> {
        if (document === undefined) { return; }
        const textmateTokenService = await this._textmateService.initTokenService();
        const tokens = await textmateTokenService.fetch(document);
        console.log(tokens);

        const constants = this.getConstants(tokens);
        const variables = this.getVariables(tokens);
        
    }

    private getVariables(tokens: TextmateToken[]): Token[] {
        return tokens.filter(token => token.scopes.includes("entity.name.variable.usp")).map(token => {
            const variableType = this.getType(token.line, tokens);
            const variable: Token = {
                name: token.text,
                type: "variable",
                column: token.startIndex,
                line: token.line,
                dataType: variableType,
            };
            return variable;
        });
    }

    private getConstants(tokens: TextmateToken[]): Token[] {
        return tokens.filter(token => token.scopes.includes("entity.name.constant.usp")).map(token => {
            const constant: Token = {
                name: token.text,
                type: "constant",
                column: token.startIndex,
                line: token.line,
            };
            return constant;
        });
    }

    private getType(line: number, tokens: TextmateToken[]): string {
        const type = this.getKeywordType(line, tokens);
        if (type.length > 0) { return type; }
        return this.getUserType(line, tokens);
    }

    private getKeywordType(line: number, tokens: TextmateToken[]): string {
        if (line < 0) { return ""; }
        const keyword = tokens.find(token => token.line === line && token.type.includes("keyword"))?.text ?? "";
        if (keyword.length === 0) { return this.getKeywordType(line - 1, tokens); }
        return keyword.replace("keyword.type.", "");
    }

    private getUserType(line: number, tokens: TextmateToken[]): string {
        if (line < 0) { return ""; }
        const keyword = tokens.find(token => token.line === line && token.type.includes("entity.name.type"));
        if (keyword === undefined) { return this.getUserType(line - 1, tokens); }
        return keyword.text;
    }

}