import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemProvider,
    Position,
    ProviderResult,
    TextDocument,
    CompletionItemKind,
} from "vscode";
import { KeywordService } from "./services/keywordService";
import { TokenService } from "./services/tokenService";

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
        const uri = document.uri.toString();
        const completionItems: CompletionItem[] = [];
        let linePrefix = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = linePrefix.match(/(?:(?:[_\w][_#$\w]*)*\s*\.\s*)*(?:[_\w][_#$\w]*\s*)*\.$/);//grab any group of words followed by a dot (ie: test.test.  or test.)
        if (!wordWithDotMatch) { return []; }
        console.log("wordWithDotMatch: ", wordWithDotMatch[0]);
        const tokenTree = wordWithDotMatch[0].match(/[_\w][_#$\w]*/g);
        let currentToken = tokenTree.shift();
        let currentObject = this._tokenService.getDocumentMemberByName(uri, currentToken);
        if (!currentObject) {
            return completionItems;
        }
        switch (currentObject.kind) {
            case CompletionItemKind.Struct:
                currentToken = tokenTree.shift();
                while (currentToken) {
                    const property = currentObject.internalVariables.find(v => v.name === currentToken);
                    currentObject = this._tokenService.getDocumentMemberByName(uri, property.dataType);
                    currentToken = tokenTree.shift();
                }
                return this._tokenService.getCompletionItemsFromDocumentTokens(currentObject.internalVariables);
            default:
                return [];
        }

        return completionItems;

    }

};