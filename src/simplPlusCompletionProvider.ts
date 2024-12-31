import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemProvider,
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
import { KeywordService, KeywordType } from "./services/keywordService";
import { TokenService } from "./services/tokenService";
import { DocumentToken } from "./services/tokenTypes";

export class SimplPlusCompletionProvider implements CompletionItemProvider {
    private _keywordService: KeywordService;
    private _tokenService: TokenService;

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
        const uri = document.uri;
        const currentBlock = this._tokenService.getBlockStatementTokenAtPosition(uri, position);
        if (currentBlock === undefined) {
            const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
            if (lineUntilPosition.toLowerCase().match(/(push|release|change|event)/)) {
                const inputVariables = this.getInternalInputVariables(uri);
                return inputVariables;
            }
            if (lineUntilPosition.toLowerCase().match(/(socketconnect|socketdisconnect|socketstatus|socketreceive)/)) {
                const socketVariables = this.getInternalSocketVariables(uri);
                return socketVariables;
            }
            const completionItems = this.getRootKeywords(uri);
            const rootVariables = this.getExternalVariable(uri);
            return completionItems.concat(rootVariables);
        }
        switch (currentBlock.kind) {
            case CompletionItemKind.Event:
            case CompletionItemKind.Function:
                if (this._tokenService.isAtParameterRange(uri, position)) {
                    const parameterKeywords = this.getParameterKeywords(uri);
                    return parameterKeywords;
                }
                const externalVariables = this.getExternalVariable(uri);
                let functionKeywords = this.getFunctionKeywords();
                const internalRootVariables = this.getInternalRootVariables(uri);
                const functionVariables = this.getFunctionVariables(currentBlock);
                const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
                if (lineUntilPosition.match(/[\=\(\[]/)) {
                    functionKeywords = this.getExpressionKeywords();
                }
                return functionVariables.concat(externalVariables).concat(functionKeywords).concat(internalRootVariables);
            case CompletionItemKind.Struct:
                const structureKeywords = this.getStructureKeywords();
                //structures can have other nested structures or classes as structure members;
                const structureVariables = this.getInternalStructureVariables(uri);
                return structureVariables.concat(structureKeywords);
            default:
                return this.getRootKeywords(uri);
        }
    }
    public resolveCompletionItem(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return new Promise(async resolve => {
            const uri = window.activeTextEditor?.document.uri;
            const itemLabel = typeof item.label === "string" ? item.label : item.label.label;
            let functionInfo = this._tokenService.getFunctionInfo(uri, itemLabel);
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
            resolve(item);
        });
    }
    private getInternalInputVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri);
        if (documentItems === undefined) {
            return [];
        }
        const thisDocument = documentItems.find(di => di.uri === uri.toString());
        const items = thisDocument.internalVariables.filter(di => di.dataType.toLowerCase().match(/input/));
        return this._tokenService.getCompletionItemsFromDocumentTokens(items);
    }
    private getInternalSocketVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri);
        if (documentItems === undefined) {
            return [];
        }
        const thisDocument = documentItems.find(di => di.uri === uri.toString());
        const items = thisDocument.internalVariables.filter(di => di.dataType.toLowerCase().match(/(tcp_client|tcp_server|udp_socket)/));
        return this._tokenService.getCompletionItemsFromDocumentTokens(items);
    }
    private getInternalStructureVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri);
        if (documentItems === undefined) {
            return [];
        }
        const thisDocument = documentItems.find(di => di.uri === uri.toString());
        const structureVariables = thisDocument.internalStructures;
        return this._tokenService.getCompletionItemsFromDocumentTokens(structureVariables);
    }
    private getExpressionKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "function",
            "variable",
            "constant",
            "statement",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getParameterKeywords(uri: Uri): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "parameterModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
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
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getStructureKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "variableModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getFunctionVariables(functionToken: DocumentToken): CompletionItem[] {
        const functionVariables = this._tokenService.getCompletionItemsFromDocumentTokens(functionToken.internalVariables);
        const functionParameters = this._tokenService.getCompletionItemsFromDocumentTokens(functionToken.parameters);
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
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getExternalVariable(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri);
        if (documentItems === undefined) {
            return [];
        }
        //get all other documents that are not current one
        const externalDocuments = documentItems.filter(di => di.uri !== uri.toString());

        const items = this._tokenService.getCompletionItemsFromDocumentTokens(externalDocuments);
        return items;
    }

    private getInternalRootVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri);
        if (documentItems === undefined) {
            return [];
        }
        const internalDocument = documentItems.find(di => di.uri === uri.toString());
        let rootVariables: DocumentToken[] = [];
        rootVariables.push(...internalDocument.internalVariables);
        rootVariables.push(...internalDocument.internalConstants);
        rootVariables.push(...internalDocument.internalFunctions);
        rootVariables.push(...internalDocument.internalStructures);

        const items = this._tokenService.getCompletionItemsFromDocumentTokens(rootVariables);
        return items;
    }


}