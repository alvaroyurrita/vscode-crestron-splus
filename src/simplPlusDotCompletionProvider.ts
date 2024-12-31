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
        let linePrefix = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = linePrefix.match(/(?:(?:[_\w][_#$\w]*)*\s*\.\s*)*(?:[_\w][_#$\w]*\s*)*\.$/);//grab any group of words followed by a dot (ie: test.test.  or test.)
        if (!wordWithDotMatch) { return []; }
        const tokenTree = wordWithDotMatch[0].match(/[_\w][_#$\w]*/g);
        let currentToken = tokenTree.shift();
        //Look for global variables first
        let currentObject = this._tokenService.getLocalDocumentMemberByName(uri, currentToken, position);
        if (!currentObject) {
            currentObject = this._tokenService.getGlobalDocumentMemberByName(uri, currentToken);
            //then local variables
            if (!currentObject) { return completionItems; }
        }
        if (currentObject.kind === CompletionItemKind.Variable) {
            // test if object is something other than a variable (ie: a class or enum)
            let testObject = this._tokenService.getDocumentMemberByDataType(uri, currentObject.dataType);
            currentObject = testObject ? testObject : currentObject;
        }
        switch (currentObject.kind) {
            case CompletionItemKind.Struct:
            case CompletionItemKind.Variable:
                currentToken = tokenTree.shift();
                while (currentToken) {
                    const property = currentObject.internalVariables.find(v => v.name === currentToken);
                    currentObject = this._tokenService.getGlobalDocumentMemberByName(uri, property.dataType);
                    currentToken = tokenTree.shift();
                }
                return this._tokenService.getCompletionItemsFromDocumentTokens(currentObject.internalVariables);
            case CompletionItemKind.Variable:
                const builtInMembers = this._keywordService.getCompletionItemsFromBuiltInTypes(currentObject.dataType);
                if (builtInMembers.length > 0) {
                    return builtInMembers;
                };
                return [];
            case CompletionItemKind.Class:
                currentToken = tokenTree.shift();
                while (currentToken) {
                    const property = currentObject.internalVariables.find(v => v.name === currentToken);
                    currentObject = this._tokenService.getGlobalDocumentMemberByName(uri, property.dataType);
                    currentToken = tokenTree.shift();
                }
                const classMembers = currentObject.internalDelegateProperties.
                    concat(currentObject.internalDelegates).
                    concat(currentObject.internalEvents).
                    concat(currentObject.internalFunctions).
                    concat(currentObject.internalProperties).
                    concat(currentObject.internalVariables);
                return this._tokenService.getCompletionItemsFromDocumentTokens(classMembers);
            
            default:
                return [];
        }
    }

};