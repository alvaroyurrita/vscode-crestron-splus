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
} from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SimplPlusKeywordHelp } from "./simplPlusKeywordHelp";
import { KeywordService, KeywordType, Keyword } from "./keywordService";
import { TokenService } from "./tokenService";
import { DocumentToken } from "./tokenTypes";
const { convert } = require('html-to-text');

export class KeywordCompletionProvider implements CompletionItemProvider {
    private keywordItems: CompletionItem[];
    private helpDefinitions = new SimplPlusKeywordHelp();
    private _keywordService: KeywordService;
    private _tokenService: TokenService;

    constructor(keywordService: KeywordService, tokenService: TokenService) {
        this._keywordService = keywordService;
        this._tokenService = tokenService;
    }

    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        ProviderResult<CompletionItem[]> {
        const uri = document.uri;
        const currentBlock = this._tokenService.getDocumentMemberAtPosition(uri.toString(), position);
        if (currentBlock === undefined) {
            const completionItems = this.getRootKeywords(uri);
            return completionItems;
        }
        switch (currentBlock.type) {
            case "function":
                if (this._tokenService.isAtParameterRange(uri.toString(), position)) {
                    const parameterKeywords = this.getParameterKeywords(uri);
                    return parameterKeywords;
                }
                const rootVariables = this.getRootVariables(uri);
                let functionKeywords = this.getFunctionKeywords();
                const functionVariables = this.getFunctionVariables(currentBlock);
                const lineUntilPosition = document.lineAt(position.line).text.slice(0, position.character);
                if (lineUntilPosition.includes("=")) {
                    functionKeywords = this.getExpressionKeywords();
                }
                return functionVariables.concat(rootVariables).concat(functionKeywords);
            case "class":
            // return this.getClassItems(uri);
            case "variable":
            // return this.getVariableItems(uri);
            case "constant":
            // return this.getConstantItems(uri);
            case "method":
            // return this.getMethodItems(uri);
            case "field":
            // return this.getFieldItems(uri);
            case "struct":
            // return this.getStructItems(uri);
            case "enum":
            // return this.getEnumItems(uri);
            case "parameter":
                return this.getParameterKeywords(uri);
            default:
                return this.getRootKeywords(uri);
        }
    }
    private getExpressionKeywords(): CompletionItem[] {
        const functionKeyword: KeywordType[] = [
            "function",
            "variable",
            "constant",
            "statement",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        const functionKeywords: CompletionItem[] = keywordDefinitions.map(kd => {
            const item = new CompletionItem(kd.name, kd.kind);
            item.documentation = "I am in a function";
            return item;
        });
        return functionKeywords;
    }
    private getParameterKeywords(uri: Uri): CompletionItem[]{
        const functionKeyword: KeywordType[] = [
            "parameterModifier",
            "variableType",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        const functionKeywords: CompletionItem[] = keywordDefinitions.map(kd => {
            const item = new CompletionItem(kd.name, kd.kind);
            item.documentation = "I am in a function";
            return item;
        });
        return functionKeywords;
    }
    private getFunctionKeywords(): CompletionItem[]{
        const functionKeyword: KeywordType[] = [
            "variableModifier",
            "variableType",
            "voidFunction",
            "variable",
            "statement",
        ];
        const keywordDefinitions = this._keywordService.getKeywords(functionKeyword);
        const functionKeywords: CompletionItem[] = keywordDefinitions.map(kd => {
            const item = new CompletionItem(kd.name, kd.kind);
            item.documentation = "I am in a function";
            return item;
        });
        return functionKeywords;
    }
    private getFunctionVariables(functionToken: DocumentToken): CompletionItem[]{
        const functionVariables: CompletionItem[] = functionToken.internalVariables?.map(v => {
            const item = new CompletionItem(v.name, CompletionItemKind.Variable);
            item.documentation = "I am a function Variable";
            return item;
        });
        const functionParameters: CompletionItem[] = functionToken.parameters?.map(p => {
            const item = new CompletionItem(p.name, CompletionItemKind.Variable);
            item.documentation = "I am a function Parameter";
            return item;
        });
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
        const rootItems: CompletionItem[] = keywordDefinitions.map(kd => {
            const item = new CompletionItem(kd.name, kd.kind);
            item.documentation = "Its mE";
            return item;
        });
        return rootItems;
    }

    private getRootVariables(uri: Uri): CompletionItem[] {
        const documentItems = this._tokenService.getDocumentMembers(uri.toString());
        if (documentItems === undefined) {
            return [];
        }
        const items: CompletionItem[] =  documentItems.map(d => {
            const item = new CompletionItem(d.name, this._tokenService.convertTypeToKind(d.type));
            item.documentation = "I am a root variable";
            return item;
        });
        return items;
    }

    // resolveCompletionItem(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
    //     return new Promise(async resolve => {
    //         const itemLabel = item.label.toString();
    //         const helpContent = await this.helpDefinitions.GetSimplHelp(itemLabel);
    //         if (helpContent === undefined) { return item; }
    //         const helpContentValue = helpContent.value;
    //         item.documentation = helpContent;

    //         const helpContentString = convert(helpContentValue, { wordwrap: false }) as string;
    //         const syntaxString = helpContentString.replace(/\n/g, "").match(/Syntax:\s*(.*)\s*Description/i);
    //         if (syntaxString && syntaxString[1]) {
    //             const snippetString = new SnippetString();
    //             snippetString.appendText(itemLabel);
    //             snippetString.appendText("(");
    //             const parameterRegex = new RegExp(String.raw`${itemLabel}\s*\(([^)]*)`, "i"); //Gather up to closing param of end of line
    //             const parameterMatch = syntaxString[1].match(parameterRegex);
    //             if (parameterMatch && parameterMatch[1]) {
    //                 const parameters = parameterMatch[1].
    //                     replace(/\[.*\]/g, "").  //Remove optional parameters
    //                     split(",");
    //                 parameters.forEach((parameter, index, parameters) => {
    //                     const parameterName = parameter.trim().replace(/.*\W(\w+).*/, "$1"); //Grabs las word of the parameter, i.e. parameter name
    //                     if (parameterName.length === 0) { return; }
    //                     if (index > 0) { snippetString.appendText(", "); }
    //                     snippetString.appendPlaceholder(parameterName);
    //                 });

    //             }
    //             else {
    //                 snippetString.appendTabstop();
    //             }
    //             snippetString.appendText(")");
    //             item.insertText = snippetString;
    //         }
    //         resolve(item);
    //     });
    // }



}