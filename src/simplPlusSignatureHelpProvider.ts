import {
    CancellationToken,
    Position,
    ProviderResult,
    TextDocument,
    SignatureHelpProvider,
    SignatureHelp,
    SignatureHelpContext,
    SignatureInformation,
    ParameterInformation,
    Range,
    CompletionItemLabel,
    CompletionItemKind,
} from "vscode";
import { TokenService } from "./services/tokenService";
import { DocumentToken } from "./services/tokenTypes";
import { KeywordService } from "./services/keywordService";
import { SimplPlusKeywordHelpService } from "./services/simplPlusKeywordHelpService";

export class SimplPlusSignatureHelpProvider implements SignatureHelpProvider {
    private _tokenService: TokenService;
    constructor(tokenService: TokenService) {
        this._tokenService = tokenService;
    }
    provideSignatureHelp(
        document: TextDocument,
        position: Position,
        cancellationToken: CancellationToken,
        context: SignatureHelpContext
    ): ProviderResult<SignatureHelp> {
        return new Promise(async resolve => {
            const currentCharacter = position.character;
            let functionToken: DocumentToken | undefined = undefined;
            const textAtPosition = document.lineAt(position.line).text.slice(0, currentCharacter);
            const match = textAtPosition.match(/([\w][\#\$\w]*)\s*\(/);  // Match a keyword followed by an open parenthesis
            if (match === null) {
                return undefined;
            }
            const functionName = match[1];
            const lastCompletionItem = this._tokenService.lastToken;
            if (lastCompletionItem && lastCompletionItem.name === functionName) {
                functionToken = lastCompletionItem;
            }
            if (!functionToken) {
                const keywordService = KeywordService.getInstance();
                const keyword = keywordService.getKeyword(functionName);
                if (keyword === undefined || !keyword.hasHelp || !(keyword.type === "function" || keyword.type === "voidFunction")) {
                    return undefined;
                }
                const helpService = await SimplPlusKeywordHelpService.getInstance();
                const functionHelp = await helpService.GetSimplHelp(functionName);
                functionToken = helpService.GetFunctionInfoFromHelp(functionName, functionHelp);
            }
            const signatureHelp = new SignatureHelp();
            let functionText = `${functionToken.dataType} ${functionToken.name}(`;
            const parameters: ParameterInformation[] = [];
            if (functionToken.parameters.length > 0) {
                functionText += functionToken.parameters.map(p => {
                    parameters.push(new ParameterInformation(p.name));
                    return `${p.dataType} ${p.name}`;
                }).join(", ");
            };
            functionText += ")";
            const signatureInformation = new SignatureInformation(functionText);
            signatureInformation.parameters = parameters;
            signatureHelp.signatures = [signatureInformation];
            signatureHelp.activeSignature = 0;
            const parameterText = textAtPosition.match(/\(([^)]*)/); // Match the text between the open and close parenthesis
            const activeParameter = parameterText ? parameterText[1].split(",").length - 1 : 0;
            signatureHelp.activeParameter = activeParameter;
            resolve(signatureHelp);
        });
    }
}