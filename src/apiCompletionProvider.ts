import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionContext, CompletionItemKind, SnippetString } from "vscode";
import { provideClassTokens } from "./helpers/apiParser";
import { TokenService } from "./services/tokenService";

export class ApiCompletionProvider implements CompletionItemProvider {
    private _tokenService: TokenService;

    constructor(tokenService: TokenService) {
        this._tokenService = tokenService;
    }

    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        Promise<CompletionItem[] | undefined> {
        const uri = document.uri.toString();

        const apiTokens = await provideClassTokens("TT");
        const classes = apiTokens.map(classToken => classToken.name);
        let linePrefix = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = linePrefix.match(/(?:(?:[_\w][_#$\w]*)*\s*\.\s*)*(?:[_\w][_#$\w]*\s*)*\.$/);//grab any group of words followed by a dot (ie: test.test.  or test.)
        if (!wordWithDotMatch) { return []; }
        const tokenTree = wordWithDotMatch[0].match(/[_\w][_#$\w]*/g);
        let currentToken = tokenTree.shift();

        let currentObject = this._tokenService.getGlobalDocumentMemberByName(uri, currentToken);
        if (!currentObject) { return [];};
        if (!classes.includes(currentObject.dataType)) { return undefined; }
        const classMembers = apiTokens.find(classToken => classToken.name === currentObject.dataType);
        if (classMembers === undefined) { return undefined; }
        const completionItems: CompletionItem[] = [];
        const delegateItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalDelegates);
        const eventItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalEvents);
        const functionItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalFunctions);
        const propertyItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalProperties);
        const variableItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalVariables);
        const delegatePropertyItems = this._tokenService.getCompletionItemsFromDocumentTokens(classMembers.internalProperties);
        completionItems.push(...delegateItems, ...eventItems, ...functionItems, ...propertyItems, ...variableItems, ...delegatePropertyItems);
        return completionItems;
    }
}