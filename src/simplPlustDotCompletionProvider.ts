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
import { KeywordService, KeywordType, Keyword } from "./services/keywordService";
import { TokenService } from "./services/tokenService";
import { DocumentToken, TokenType } from "./services/tokenTypes";

export class SimplPlusDotCompletionProvider implements CompletionItemProvider {
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
        const completionItems: CompletionItem[] = [];
        let linePrefix = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = linePrefix.match(/(\w+)\.$/);
        const dotToken = this._tokenService.getDocumentMemberByName(document.uri.toString(), wordWithDotMatch[1]);
        if (!dotToken) {
            return completionItems;
        }
        switch (dotToken.type) {
            case "struct":
                const structTokens = dotToken.internalVariables;
                return this._tokenService.getCompletionItemsFromDocumentTokens(structTokens);
            case "class":
            case "function":
            case "constant":
            case "delegate":
            case "delegateProperty":
            case "enum":
            case "event":
            case "field":
            case "method":
            case "parameter":
            case "property":
            case "variable":
                return [];
        }

        return completionItems;

    }

};