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
import { KeywordService } from "./services/keywordService";
import { SimplPlusProjectObjectService } from "./services/simplPlusProjectObjectService";
import { SimplPlusObject } from "./base/simplPlusObject";

export class SimplPlusCompletionProvider implements CompletionItemProvider {
    private _keywordService: KeywordService;
    private _projectObjectService: SimplPlusProjectObjectService;

    constructor(keywordService: KeywordService, projectObjectService: SimplPlusProjectObjectService) {
        this._keywordService = keywordService;
        this._projectObjectService = projectObjectService;
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        ProviderResult<CompletionItem[]> {
        const uri = document.uri;
        const currentBlock = this._projectObjectService.getProgramObjectAtPosition(uri, position);
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
            const rootVariables = this.getProjectRootObjects(uri);
            return completionItems.concat(rootVariables);
        }
        switch (currentBlock.kind) {
            case CompletionItemKind.Event:
            case CompletionItemKind.Function:
                if (this._projectObjectService.isPositionAtFunctionParameter(currentBlock, position)) {
                    const parameterKeywords = this.getParameterKeywords(uri);
                    return parameterKeywords;
                }
                let functionKeywords = this.getFunctionKeywords();
                const projectRootObjects = this.getProjectRootObjects(uri);
                const functionVariables = this.getFunctionVariables(currentBlock);
                const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
                if (lineUntilPosition.match(/[\=\(\[]/)) {
                    functionKeywords = this.getExpressionKeywords();
                }
                return functionVariables.concat(functionKeywords).concat(projectRootObjects);
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
            let functionInfo =this._projectObjectService.getFunctionInfo(uri, itemLabel);
            if (functionInfo === undefined) {
                const keyword = this._keywordService.getKeyword(itemLabel);
                if (keyword === undefined || !keyword.hasHelp) { resolve(item); return; }
                const helpDefinitions = await SimplPlusKeywordHelpService.getInstance();
                const helpContent = await helpDefinitions.GetSimplHelp(itemLabel);
                if (helpContent !== undefined) {
                    item.documentation = helpContent;
                    if (keyword.kind === CompletionItemKind.Function) {
                        functionInfo = helpDefinitions.GetFunctionInfoFromHelp(itemLabel, helpContent);
                    }
                }
            }
            else {
                let functionDocs = `${functionInfo.dataType} ${functionInfo.name}(`;
                const functionParams = functionInfo.children.filter(ch=>ch.kind===CompletionItemKind.TypeParameter);
                if (functionParams.length > 0) {
                    functionDocs += functionParams.map(p => `${p.dataType} ${p.name}`).join(", ");
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
        const documentItems = this._projectObjectService.getProjectObjects(uri);
        if (documentItems === undefined) {
            return [];
        }
        const thisDocument = documentItems.filter(di => di.uri === uri.toString() && di.kind===CompletionItemKind.Variable);
        const items = thisDocument.filter(di => di.dataType.toLowerCase().match(/input/));
        return this._projectObjectService.getCompletionItemsFromObjects(items);
    }
    private getInternalSocketVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._projectObjectService.getProjectObjects(uri);
        if (documentItems === undefined) {
            return [];
        }
        const thisDocument = documentItems.filter(di => di.uri === uri.toString() && di.kind===CompletionItemKind.Variable);
        const items = thisDocument.filter(di => di.dataType.toLowerCase().match(/(tcp_client|tcp_server|udp_socket)/));
        return this._projectObjectService.getCompletionItemsFromObjects(items);
    }
    private getInternalStructureVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._projectObjectService.getProjectObjects(uri);
        if (documentItems === undefined) {
            return [];
        }
        const structureVariables = documentItems.filter(di => di.uri === uri.toString() && di.kind===CompletionItemKind.Struct);
        return this._projectObjectService.getCompletionItemsFromObjects(structureVariables);
    }
    private getExpressionKeywords(): CompletionItem[] {
        const functionKeyword: string[] = [
            "variable",
            "constant",
            "statement",
        ];
        const keywordDefinitions = this._keywordService.getKeywordsByType(functionKeyword);
        let functionDefinitions = this._keywordService.getKeywordsByKind(CompletionItemKind.Function);
        functionDefinitions = functionDefinitions.filter(f=>f.type!=="void");
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions.concat(functionDefinitions));
    }
    private getParameterKeywords(uri: Uri): CompletionItem[] {
        const functionKeyword: string[] = [
            "parameterModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywordsByType(functionKeyword);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getFunctionKeywords(): CompletionItem[] {
        const functionKeyword: string[] = [
            "variableModifier",
            "variableType",
            "variable",
            "statement",
            "constant"
        ];
        const keywordDefinitions = this._keywordService.getKeywordsByType(functionKeyword);
        let functionDefinitions = this._keywordService.getKeywordsByKind(CompletionItemKind.Function);
        functionDefinitions = functionDefinitions.filter(f=>f.type==="void");
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions.concat(functionDefinitions));
    }
    private getStructureKeywords(): CompletionItem[] {
        const functionKeyword: string[] = [
            "variableModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywordsByType(functionKeyword);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }

    //provides function variables and parameters
    private getFunctionVariables(functionToken: SimplPlusObject): CompletionItem[] {
        return this._projectObjectService.getCompletionItemsFromObjects(functionToken.children);
    }
    private getRootKeywords(uri: Uri): CompletionItem[] {
        const rootKeywords: string[] = [
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
        const keywordDefinitions = this._keywordService.getKeywordsByType(rootKeywords);
        return this._keywordService.getCompletionItemsFromKeywords(keywordDefinitions);
    }
    private getProjectRootObjects(uri: Uri): CompletionItem[] {
        const documentItems = this._projectObjectService.getProjectObjects(uri);
        if (documentItems === undefined) {
            return [];
        }
        const items = this._projectObjectService.getCompletionItemsFromObjects(documentItems);
        return items;
    }
}