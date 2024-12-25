import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemProvider,
    extensions,
    Position,
    ProviderResult,
    TextDocument,
    CompletionItemKind,
    SnippetString,
    Uri,
    window,
    CompletionItemLabel,
} from "vscode";
import { SimplPlusKeywordHelpService } from "./services/simplPlusKeywordHelpService";
import { KeywordService, KeywordType, Keyword } from "./services/keywordService";
import { TokenService } from "./services/tokenService";
import { DocumentToken } from "./services/tokenTypes";

export class SimplPlusCompletionProvider implements CompletionItemProvider {
    private _keywordService: KeywordService;
    private _tokenService: TokenService;
    private _uri: Uri;
    private _position: Position;

    constructor(keywordService: KeywordService, tokenService: TokenService) {
        this._keywordService = keywordService;
        this._tokenService = tokenService;
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        ProviderResult<CompletionItem[]> {
        this._uri = document.uri;
        this._position = position;
        const uri = document.uri;
        const currentBlock = this._tokenService.getBlockStatementTokenAtPosition(uri.toString(), position);
        if (currentBlock === undefined) {
            const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
            if (lineUntilPosition.toLowerCase().match(/(push|release|change|event)/)) {
                const inputVariables = this.getInputVariables(uri);
                return inputVariables;
            }
            const completionItems = this.getRootKeywords(uri);
            return completionItems;
        }
        switch (currentBlock.type) {
            case "event":
            case "function":
                if (this._tokenService.isAtParameterRange(uri.toString(), position)) {
                    const parameterKeywords = this.getParameterKeywords(uri);
                    return parameterKeywords;
                }
                const rootVariables = this.getRootVariables(uri);
                let functionKeywords = this.getFunctionKeywords();
                const functionVariables = this.getFunctionVariables(currentBlock);
                const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
                if (lineUntilPosition.match(/[\=\(\[]/)) {
                    functionKeywords = this.getExpressionKeywords();
                }
                return functionVariables.concat(rootVariables).concat(functionKeywords);
            case "struct":
                const structureKeywords = this.getStructureKeywords();
                const structureVariables = this.getStructureVariables(uri);
                return structureVariables.concat(structureKeywords);
            case "class":
            case "variable":
            case "constant":
            case "method":
            case "field":
            case "enum":
            case "parameter":
            default:
                return this.getRootKeywords(uri);
        }
    }
    private getInputVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri.toString());
        if (documentItems === undefined) {
            return [];
        }
        const items: CompletionItem[] = documentItems.filter(di => di.type === "variable" && di.dataType.toLowerCase().match(/input/)).map(d => {
            const item = new CompletionItem(d.name, this._tokenService.convertTypeToKind(d.type));
            return item;
        });
        return items;
    }
    private getStructureVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri.toString());
        if (documentItems === undefined) {
            return [];
        }
        const items: CompletionItem[] = documentItems.filter(di => di.type === "struct" || di.type === "class").map(d => {
            const item = new CompletionItem(d.name, this._tokenService.convertTypeToKind(d.type));
            return item;
        });
        return items;
    }
    private getExpressionKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "function",
            "variable",
            "constant",
            "statement",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this.getKeywordItems(keywordDefinitions);
    }
    private getParameterKeywords(uri: Uri): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "parameterModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this.getKeywordItems(keywordDefinitions);
    }
    private getFunctionKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "variableModifier",
            "variableType",
            "voidFunction",
            "variable",
            "statement",
            "constant"
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this.getKeywordItems(keywordDefinitions);
    }
    private getStructureKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "variableModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this.getKeywordItems(keywordDefinitions);
    }
    private getFunctionVariables(functionToken: DocumentToken): CompletionItem[] {
        const functionVariables: CompletionItem[] = functionToken.internalVariables?.map(v => {
            const item = new CompletionItem(v.name, CompletionItemKind.Variable);
            return item;
        }) ?? [];
        const functionParameters: CompletionItem[] = functionToken.parameters?.map(p => {
            const item = new CompletionItem(p.name, CompletionItemKind.Variable);
            return item;
        }) ?? [];
        return functionVariables.concat(functionParameters);

    }
    private getRootKeywords(uri: Uri): CompletionItem[] {
        const rootKeywords: KeywordType[] = [
            "inputType",
            "outputType",
            "parameterType",
            "functionModifier",
            "variableModifier",
            "variableType",
            "structureBuiltIn",
            "functionType",
            "eventType",
            "event-handler",
            "classBuiltIn",
            "declaration",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(rootKeywords);
        return this.getKeywordItems(keywordDefinitions);
    }
    private getRootVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri.toString());
        if (documentItems === undefined) {
            return [];
        }
        const items: CompletionItem[] = documentItems.map(d => {
            const tokenKind = this._tokenService.convertTypeToKind(d.type);
            let itemLabel: CompletionItemLabel = {
                label: d.name,
                description: d.dataType
            };
            let documentation: string = "";
            const item = new CompletionItem(itemLabel, this._tokenService.convertTypeToKind(d.type));
            if (tokenKind === CompletionItemKind.Function) {
                documentation = `${d.dataType} ${d.name}(`;
                if (d.parameters.length > 0) {
                    documentation += d.parameters.map(p => `${p.dataType} ${p.name}`).join(", ");
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

    private getKeywordItems(keywords: Keyword[]): CompletionItem[] {
        const items: CompletionItem[] = keywords.map(kd => {
            let itemLabel: CompletionItemLabel = {
                label: kd.name,
                description: kd.type.toString()
            };
            const item = new CompletionItem(itemLabel, kd.kind);
            if (kd.kind === CompletionItemKind.Function) {
                item.command = {
                    command: "editor.action.triggerParameterHints",
                    title: "triggerSignatureHelp",
                };
            }
            return item;
        });
        return items;
    }

    public resolveCompletionItem(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return new Promise(async resolve => {
            const uri = window.activeTextEditor?.document.uri;
            const itemLabel = typeof item.label === "string" ? item.label : item.label.label;
            let functionInfo = this._tokenService.getFunctionInfo(uri.toString(), itemLabel);
            if (functionInfo === undefined) {
                const keyword = this._keywordService.getKeyword(itemLabel);
                if (keyword === undefined || !keyword.hasHelp) { resolve(item); return; }
                const helpDefinitions = await SimplPlusKeywordHelpService.getInstance();
                const helpContent = await helpDefinitions.GetSimplHelp(itemLabel);
                if (helpContent !== undefined) {
                    item.documentation = helpContent;
                    if (keyword.type === "function" || keyword.type === "voidFunction") {
                        functionInfo = helpDefinitions.GetFunctionInfoFromHelp(itemLabel, helpContent);
                    }
                }
            }
            else {
                let functionDocs = `${functionInfo.dataType} ${functionInfo.name}(`;
                if (functionInfo.parameters.length > 0) {
                    functionDocs += functionInfo.parameters.map(p => `${p.dataType} ${p.name}`).join(", ");
                }
                functionDocs += ")";
                const functionLabel: CompletionItemLabel = {
                    label: itemLabel,
                    description: functionDocs,
                };
                item.label = functionLabel;
            }
            const snippetString = new SnippetString();
            snippetString.appendText(itemLabel);
            snippetString.appendText("(");
            if (functionInfo !== undefined && functionInfo.parameters.length > 0) {
                functionInfo.parameters.forEach((parameter, index, parameters) => {
                    if (index > 0) { snippetString.appendText(", "); }
                    snippetString.appendPlaceholder(parameter.name);
                });
            }
            snippetString.appendText(")");
            item.insertText = snippetString;
            console.log(item.insertText.toString());
            resolve(item);
        });
    }
}