import { DocumentSelector, ExtensionContext, TextDocument,  window, workspace, TextDocumentChangeEvent } from "vscode";
import TextmateLanguageService, { TextmateToken } from "vscode-textmate-languageservice";
import { DocumentMembers, Token, FunctionMembers, StructureMembers } from "./tokenTypes";
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

    public getDocumentMembers(uri: string): DocumentMembers | undefined {
        return this._documents.get(uri);
    }

    private constructor(ctx: ExtensionContext) {
        this._textmateService = new TextmateLanguageService(this.selector.toString(), ctx);
        const onOpenTextDocument_event = workspace.onDidOpenTextDocument((document) => this.updateOnOpenTextDocument(document));
        const onDidChangeTextDocument_event = workspace.onDidChangeTextDocument((editor) => this.updateOnDidChangeTextDocument(editor));
        const onCloseTextDocument_event = workspace.onDidCloseTextDocument((document) => this.updateOnCloseTextDocument(document));

        const document = window.activeTextEditor?.document;
        if (document.languageId === this.selector.toString()) { this.tokenize(document); }


        ctx.subscriptions.push(
            onOpenTextDocument_event,
            onDidChangeTextDocument_event,
            onCloseTextDocument_event,
        );
    }
    async updateOnCloseTextDocument(document: TextDocument): Promise<void> {
        console.log("Document closed");
    }
    async updateOnDidChangeTextDocument(editor: TextDocumentChangeEvent | undefined): Promise<void> {
        if (editor === undefined) { return; }
        const document = editor.document;
        if (document.languageId !== this.selector.toString()) { return; }
        await this.tokenize(document);
    }
    async updateOnOpenTextDocument(document: TextDocument): Promise<void> {
        if (document.languageId !== this.selector.toString()) { return; }
        await this.tokenize(document);
    }
    async tokenize(document: TextDocument | undefined): Promise<void> {
        if (document === undefined) { return; }
        if (document.languageId !== this.selector.toString()) { return; }
        const textmateTokenService = await this._textmateService.initTokenService();
        const tokens = await textmateTokenService.fetch(document);
        console.log(tokens);

        const structures = this.getGlobalStructures(tokens);
        const constants = this.getGlobalConstants(tokens);
        const variables = this.getGlobalVariables(tokens);
        const functions = this.getGlobalFunctions(tokens);

        const documentMembers: DocumentMembers = {
            structures: structures,
            functions: functions,
            variables: variables,
            constants: constants,
        };

        this._documents.set(document.uri.toString(), documentMembers);

    }

    private getGlobalVariables(tokens: TextmateToken[]): Token[] {
        return tokens.filter(token => token.scopes.includes("entity.name.variable.usp")
            && !(token.scopes.includes("meta.block.structure.usp")
                || token.scopes.includes("meta.block.usp"))).map(token => {
                    const variableType = this.getType(token, tokens);
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

    private getGlobalConstants(tokens: TextmateToken[]): Token[] {
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

    private getGlobalFunctions(tokens: TextmateToken[]): FunctionMembers[] {
        return tokens.filter(token => token.scopes.includes("entity.name.function.usp")).map(token => {
            const functionBeginLine = token.line;
            let functionEndLine = functionBeginLine;
            let functionEnd = false;
            do {
                ++functionEndLine;
                const nextLineTokens = tokens.find(token => token.line === functionEndLine && token.scopes.includes("meta.block.usp"));
                if (nextLineTokens === undefined) { functionEnd = true; break; }

            } while (!functionEnd);
            const functionVariables = tokens.
                filter(token => (token.line >= functionBeginLine && token.line <= functionEndLine) && token.scopes.includes("entity.name.variable.usp")).
                map(token => {
                    const variableType = this.getType(token, tokens);
                    const variable: Token = {
                        name: token.text,
                        type: "variable",
                        column: token.startIndex,
                        line: token.line,
                        dataType: variableType,
                    };
                    return variable;
                });

            const functionParameterBeginLine = token.line;
            let functionParameterEndLine = functionParameterBeginLine;
            let functionParameterEnd = false;
            do {
                const nextLineTokens = tokens.find(token => token.line === functionParameterEndLine && token.scopes.includes("meta.parenthesized.parameter-list.usp"));
                if (nextLineTokens === undefined) { functionParameterEnd = true; break; }
                ++functionParameterEndLine;
            } while (!functionEnd);

            const functionParameters = tokens.
                filter(token => (token.line >= functionParameterBeginLine && token.line <= functionParameterEndLine) && token.scopes.includes("entity.name.variable.parameter.usp")).
                map(token => {
                    const variableType = this.getType(token, tokens);
                    const variable: Token = {
                        name: token.text,
                        type: "variable",
                        column: token.startIndex,
                        line: token.line,
                        dataType: variableType,
                    };
                    return variable;
                });
            const functionType = this.getType(token, tokens);
            const fun: FunctionMembers = {
                name: token.text,
                type: "function",
                column: token.startIndex,
                line: token.line,
                variables: functionVariables,
                returnType: functionType,
                parameters: functionParameters,
            };
            return fun;
        });
    }

    private getGlobalStructures(tokens: TextmateToken[]): StructureMembers[] {
        return tokens.filter(token => token.scopes.includes("entity.name.type.structure.usp")).map(token => {
            const functionBeginLine = token.line;
            let functionEndLine = functionBeginLine;
            let functionEnd = false;
            do {
                ++functionEndLine;
                const nextLineTokens = tokens.find(token => token.line === functionEndLine && token.scopes.includes("meta.block.structure.usp"));
                if (nextLineTokens === undefined) { functionEnd = true; break; }

            } while (!functionEnd);
            const functionVariables = tokens.
                filter(token => (token.line >= functionBeginLine && token.line <= functionEndLine) && token.scopes.includes("entity.name.variable.usp")).
                map(token => {
                    const variableType = this.getType(token, tokens);
                    const variable: Token = {
                        name: token.text,
                        type: "variable",
                        column: token.startIndex,
                        line: token.line,
                        dataType: variableType,
                    };
                    return variable;
                });
            const struct: StructureMembers = {
                name: token.text,
                type: "struct",
                column: token.startIndex,
                line: token.line,
                variables: functionVariables,
            };
            return struct;
        });
    }

    private getType(token: TextmateToken, tokens: TextmateToken[]): string {
        let tokenIndex = tokens.indexOf(token);
        if (tokenIndex < 0) { return ""; }
        do {
            --tokenIndex;
        } while (tokenIndex >= 0 && !(tokens[tokenIndex].type.includes("keyword.type") || tokens[tokenIndex].type.includes("entity.name.type")));
        return tokens[tokenIndex].text;
    }


}