import {
    DocumentSelector,
    ExtensionContext,
    TextDocument,
    window,
    workspace,
    TextDocumentChangeEvent,
    Position,
    Range,
    CompletionItemKind,
    CompletionItem,
    CompletionItemLabel
} from "vscode";
import TextmateLanguageService, { TextmateToken } from "vscode-textmate-languageservice";
import { DocumentToken } from "./tokenTypes";
export class TokenService {
    private _documents = new Map<string, DocumentToken[]>();
    private static _instance: TokenService;
    private selector: DocumentSelector = 'simpl-plus';
    private _textmateService: TextmateLanguageService;
    public static getInstance(ctx: ExtensionContext): TokenService {
        if (!TokenService._instance && ctx) {
            TokenService._instance = new TokenService(ctx);
        }
        return TokenService._instance;
    }

    public getDocumentMembers(uri: string): DocumentToken[] | undefined {
        return this._documents.get(uri);
    }

    public getBlockStatementTokenAtPosition(uri: string, position: Position): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        let documentMember: DocumentToken | undefined;
        documentMember = documentMembers.find(member => member.blockRange?.contains(position) ?? false);
        //if not found in block range, check parameter range
        if (documentMember === undefined) {
            documentMember = documentMembers.find(member => member.parameterRange?.contains(position) ?? false);
        }
        return documentMember;
    }

    public getDocumentMemberAtPosition(uri: string, position: Position): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.nameRange.contains(position));
    }

    public getDocumentMemberByName(uri: string, name: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.name === name);
    }

    public isAtParameterRange(uri: string, position: Position): boolean {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return false; }
        const documentMember = documentMembers.find(member => member.parameterRange?.contains(position) ?? false);
        return documentMember !== undefined;
    }

    public getFunctionInfo(uri: string, tokenLabel: string): DocumentToken | undefined {
        const documentMembers = this.getDocumentMembers(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.name === tokenLabel && member.type === "function");
    }

    public convertTypeToKind(type: string): CompletionItemKind {
        switch (type) {
            case "delegateProperty":
            case "parameter":
            case "variable":
                return CompletionItemKind.Variable;
            case "constant":
                return CompletionItemKind.Constant;
            case "delegate":
            case "function":
            case "method":
                return CompletionItemKind.Function;
            case "struct":
                return CompletionItemKind.Struct;
            case "event":
                return CompletionItemKind.Event;
            case "property":
                return CompletionItemKind.Property;
            case "class":
            case "field":
                return CompletionItemKind.Field;
            case "enum":
                return CompletionItemKind.Enum;
            case "event":
                return CompletionItemKind.Event;
            default:
                return CompletionItemKind.Text;
        }
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
    private async tokenize(document: TextDocument | undefined): Promise<void> {
        if (document === undefined) { return; }
        if (document.languageId !== this.selector.toString()) { return; }
        const textmateTokenService = await this._textmateService.initTokenService();
        const tokens = await textmateTokenService.fetch(document);

        const structures = this.getGlobalStructures(tokens);
        const constants = this.getGlobalConstants(tokens);
        const variables = this.getGlobalVariables(tokens);
        const functions = this.getGlobalFunctions(tokens);
        const events = this.getGlobalEvents(tokens);

        const documentMembers: DocumentToken[] = structures.
            concat(constants).
            concat(variables).
            concat(functions).
            concat(events);

        this._documents.set(document.uri.toString(), documentMembers);
    }

    private getGlobalVariables(tokens: TextmateToken[]): DocumentToken[] {
        return tokens.filter(token => token.scopes.includes("entity.name.variable.usp")
            && !(token.scopes.includes("meta.block.structure.usp")
                || token.scopes.includes("meta.block.usp"))).map(token => {
                    const variableType = this.getType(token, tokens);
                    const variableNameRange = new Range(
                        new Position(token.line, token.startIndex),
                        new Position(token.line, token.startIndex + token.text.length)
                    );
                    const variable: DocumentToken = {
                        name: token.text,
                        type: "variable",
                        nameRange: variableNameRange,
                        dataType: variableType,
                    };
                    return variable;
                });
    }

    private getGlobalConstants(tokens: TextmateToken[]): DocumentToken[] {
        return tokens.filter(token => token.scopes.includes("entity.name.constant.usp")).map(token => {
            const constantNameRange = new Range(
                new Position(token.line, token.startIndex),
                new Position(token.line, token.startIndex + token.text.length)
            );
            const constantIndex = tokens.indexOf(token);
            let dataType = "";
            if (constantIndex + 2 < tokens.length) {
                const constantValueToken = tokens[constantIndex + 2];
                switch (constantValueToken.type) {
                    case "constant.numeric.decimal.usp":
                    case "constant.numeric.hex.usp":
                    case "constant.numeric.character.usp":
                        dataType = "integer";
                        break;
                    case "string.quoted.double.usp":
                        dataType = "string";
                    default:
                        break;
                }
            }
            const constant: DocumentToken = {
                name: token.text,
                type: "constant",
                nameRange: constantNameRange,
                dataType
            };
            return constant;
        });
    }

    private getGlobalFunctions(tokens: TextmateToken[]): DocumentToken[] {
        return tokens.filter(token => token.scopes.includes("entity.name.function.usp")).map(token => {
            const functionType = this.getType(token, tokens);
            const functionNameRange = new Range(
                new Position(token.line, token.startIndex),
                new Position(token.line, token.startIndex + token.text.length)
            );
            //look for function block statement range
            const functionTokens = this.getBlockRangeTokens(tokens, token, "meta.block.usp");
            let functionBlockRange: Range;
            let functionVariables: DocumentToken[] = [];
            if (functionTokens.length !== 0) {
                functionBlockRange = new Range(
                    new Position(functionTokens[0].line, functionTokens[0].startIndex),
                    new Position(functionTokens[functionTokens.length - 1].line,
                        functionTokens[functionTokens.length - 1].startIndex + functionTokens[functionTokens.length - 1].text.length)
                );
                //grab all variables from range
                functionVariables = functionTokens.
                    filter(token => token.scopes.includes("entity.name.variable.usp")).
                    map(token => {
                        const variableType = this.getType(token, tokens);
                        const variableNameRange = new Range(
                            new Position(token.line, token.startIndex),
                            new Position(token.line, token.startIndex + token.text.length)
                        );
                        const variable: DocumentToken = {
                            name: token.text,
                            type: "variable",
                            nameRange: variableNameRange,
                            dataType: variableType,
                        };
                        return variable;
                    });
            }
            //grab all tokens inside the parenthesized parameter list
            const parameterTokens = this.getBlockRangeTokens(tokens, token, "meta.parenthesized.parameter-list.usp");
            let functionParameters: DocumentToken[] = [];
            let parameterBlockRange: Range;
            if (parameterTokens.length !== 0) {
                parameterBlockRange = new Range(
                    new Position(parameterTokens[0].line, parameterTokens[0].startIndex),
                    new Position(parameterTokens[parameterTokens.length - 1].line,
                        parameterTokens[parameterTokens.length - 1].startIndex + parameterTokens[parameterTokens.length - 1].text.length)
                );
                //extract parameter variable names
                functionParameters = parameterTokens.
                    filter(token => token.scopes.includes("entity.name.variable.parameter.usp")).
                    map(token => {
                        const parameterType = this.getType(token, tokens);
                        const parameterNameRange = new Range(
                            new Position(token.line, token.startIndex),
                            new Position(token.line, token.startIndex + token.text.length)
                        );
                        const variable: DocumentToken = {
                            name: token.text,
                            type: "parameter",
                            nameRange: parameterNameRange,
                            dataType: parameterType,
                        };
                        return variable;
                    });
            }
            const fun: DocumentToken = {
                name: token.text,
                type: "function",
                nameRange: functionNameRange,
                dataType: functionType,
                parameters: functionParameters,
                blockRange: functionBlockRange,
                parameterRange: parameterBlockRange,
                internalVariables: functionVariables,
            };
            return fun;
        });
    }

    private getGlobalStructures(tokens: TextmateToken[]): DocumentToken[] {
        return tokens.filter(token => token.scopes.includes("entity.name.type.structure.usp")).map(token => {
            const structureNameRange = new Range(
                new Position(token.line, token.startIndex),
                new Position(token.line, token.startIndex + token.text.length)
            );
            //look for structure block statement range
            const structureTokens = this.getBlockRangeTokens(tokens, token, "meta.block.structure.usp");
            const structureBlockRange = new Range(
                new Position(structureTokens[0].line, structureTokens[0].startIndex),
                new Position(structureTokens[structureTokens.length - 1].line, structureTokens[structureTokens.length - 1].startIndex + structureTokens[structureTokens.length - 1].text.length)
            );
            //grab all variables from range
            const structureVariables = structureTokens.
                filter(token => token.scopes.includes("entity.name.variable.usp")).
                map(token => {
                    const variableType = this.getType(token, tokens);
                    const variableNameRange = new Range(
                        new Position(token.line, token.startIndex),
                        new Position(token.line, token.startIndex + token.text.length)
                    );
                    const variable: DocumentToken = {
                        name: token.text,
                        type: "variable",
                        nameRange: variableNameRange,
                        dataType: variableType,
                    };
                    return variable;
                });
            const struct: DocumentToken = {
                name: token.text,
                type: "struct",
                nameRange: structureNameRange,
                dataType: token.text,
                blockRange: structureBlockRange,
                internalVariables: structureVariables,
            };
            return struct;
        });
    }

    private getGlobalEvents(tokens: TextmateToken[]): DocumentToken[] {
        return tokens.filter(token => token.scopes.includes("entity.name.variable.event.usp")).map(token => {
            const eventType = this.getType(token, tokens);
            const eventNameRange = new Range(
                new Position(token.line, token.startIndex),
                new Position(token.line, token.startIndex + token.text.length)
            );
            //look for event block statement range
            const eventTokens = this.getBlockRangeTokens(tokens, token, "meta.block.usp");
            const eventBlockRange = new Range(
                new Position(eventTokens[0].line, eventTokens[0].startIndex),
                new Position(eventTokens[eventTokens.length - 1].line, eventTokens[eventTokens.length - 1].startIndex + eventTokens[eventTokens.length - 1].text.length)
            );
            //grab all variables from range
            const eventVariables = eventTokens.
                filter(token => token.scopes.includes("entity.name.variable.usp")).
                map(token => {
                    const variableType = this.getType(token, tokens);
                    const variableNameRange = new Range(
                        new Position(token.line, token.startIndex),
                        new Position(token.line, token.startIndex + token.text.length)
                    );
                    const variable: DocumentToken = {
                        name: token.text,
                        type: "variable",
                        nameRange: variableNameRange,
                        dataType: variableType,
                    };
                    return variable;
                });
            const event: DocumentToken = {
                name: token.text,
                type: "event",
                nameRange: eventNameRange,
                dataType: eventType,
                blockRange: eventBlockRange,
                internalVariables: eventVariables,
            };
            return event;
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

    private getBlockRangeTokens(tokens: TextmateToken[], token: TextmateToken, scopeName: string): TextmateToken[] {
        let functionTokenBegin = tokens.indexOf(token);
        do {
            if (tokens[functionTokenBegin].scopes.includes(scopeName)) { break; }
            ++functionTokenBegin;
        } while (functionTokenBegin < tokens.length);
        if (functionTokenBegin >= tokens.length) { return []; }
        let functionTokenEnd = functionTokenBegin;
        do {
            if (!tokens[functionTokenEnd].scopes.includes(scopeName)) { break; }
            ++functionTokenEnd;
        } while (functionTokenEnd < tokens.length);
        return tokens.slice(functionTokenBegin, functionTokenEnd);
    }
    public getCompletionItemsFromDocumentTokens(tokens: DocumentToken[]): CompletionItem[] {
        const items: CompletionItem[] = tokens.map(t => {
            let itemLabel: CompletionItemLabel = {
                label: t.name,
                description: t.type.toString()
            };
            const type = this.convertTypeToKind(t.type);
            let documentation: string = "";
            const item = new CompletionItem(itemLabel, type);
            if (type === CompletionItemKind.Function) {
                documentation = `${t.dataType} ${t.name}(`;
                if (t.parameters.length > 0) {
                    documentation += t.parameters.map(p => `${p.dataType} ${p.name}`).join(", ");
                }
                documentation += ")";
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