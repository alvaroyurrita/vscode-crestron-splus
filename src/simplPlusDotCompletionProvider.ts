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
        const uri = document.uri;
        const completionItems: CompletionItem[] = [];
        const currentObject = this._tokenService.getDocumentMemberAtPosition(document, position);
        if (currentObject === undefined) { return completionItems; }
        switch (currentObject.kind) {
            case CompletionItemKind.Struct:
                return this._tokenService.getCompletionItemsFromDocumentTokens(currentObject.internalVariables);
            case CompletionItemKind.Variable:
                const builtInMembers = this._keywordService.getCompletionItemsFromBuiltInTypes(currentObject.dataType);
                return (builtInMembers.length > 0) ? builtInMembers : [];
            case CompletionItemKind.Class:
                const classMembers = currentObject.internalDelegateProperties.
                    concat(currentObject.internalDelegates).
                    concat(currentObject.internalEvents).
                    concat(currentObject.internalFunctions).
                    concat(currentObject.internalProperties).
                    concat(currentObject.internalVariables);
                return this._tokenService.getCompletionItemsFromDocumentTokens(classMembers);
            case CompletionItemKind.Enum:
                return this._tokenService.getCompletionItemsFromDocumentTokens(currentObject.internalVariables);
            default:
                return [];
        }
    }

};