import {
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemProvider,
    CompletionList,
    DocumentSelector,
    Position,
    ProviderResult,
    TextDocument,
    window,
} from "vscode";
import TextmateLanguageService from "vscode-textmate-languageservice";
import { DocumentTokenService } from "./services/documentTokenService";

export class TextMateCompletionProvider implements CompletionItemProvider {
    constructor(private readonly _tokenService: DocumentTokenService){}
    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        return new Promise(async resolve => {

            const { getScopeInformationAtPosition, 
                getScopeRangeAtPosition, 
                getTokenInformationAtPosition,
                getLanguageConfiguration,
                getGrammarContribution,
                getContributorExtension,
                getLanguageContribution
             } = TextmateLanguageService.api;
             console.log("entering textmate completion provider");
            const ScopeInfo = await getScopeInformationAtPosition(document, position);
            console.log(ScopeInfo);
            if (ScopeInfo === undefined) { return; }
            // const ScopeRange = await getScopeRangeAtPosition(document, position);
            const scopes = ScopeInfo.scopes.join("\n");
             const completionItem: CompletionItem = new CompletionItem("test");
            completionItem.detail = scopes;
            // completionItem.detail = `(${ScopeRange.start.line}, ${ScopeRange.start.character}) to (${ScopeRange.end.line}, ${ScopeRange.end.character})`;
            resolve([completionItem]);
        });
    }

}
