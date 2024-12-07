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
} from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SimplPlusKeywordHelp } from "./simplPlusKeywordHelp";
const { convert } = require('html-to-text');

export class KeywordCompletionProvider implements CompletionItemProvider {
    private keywordItems: CompletionItem[];
    private helpDefinitions = new SimplPlusKeywordHelp();

    constructor() {
        const extensionPath = extensions.getExtension("sentry07.simpl-plus")?.extensionPath;
        //@ts-ignore
        const dirtyDocumentPath = path.join(extensionPath, "src", "keywords.csv");
        const keywordDocument = fs.readFileSync(dirtyDocumentPath, "utf8").split("\n");
        this.keywordItems = keywordDocument.map((line) => {
            const lineItems = line.split(",");
            const completionItem = new CompletionItem(lineItems[0].trim());
            let kind: CompletionItemKind | undefined = (<any>CompletionItemKind)[lineItems[1].trim()];
            if (kind === undefined) { kind = CompletionItemKind.Text; }
            completionItem.kind = kind;
            return completionItem;
        });
    }

    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        ProviderResult<CompletionItem[]> {
        return this.keywordItems;
    }

    resolveCompletionItem(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return new Promise(async resolve => {
            const itemLabel = item.label.toString();
            const helpContent = await this.helpDefinitions.GetSimplHelp(itemLabel);
            if (helpContent === undefined) { return item; }
            const helpContentValue = helpContent.value;
            item.documentation = helpContent;

            const helpContentString = convert(helpContentValue, { wordwrap: false }) as string;
            const syntaxString = helpContentString.replace(/\n/g,"").match(/Syntax:\s*(.*)\s*Description/i);
            if (syntaxString && syntaxString[1]) {
                const snippetString = new SnippetString();
                snippetString.appendText(itemLabel);
                snippetString.appendText("(");
                const parameterRegex = new RegExp(String.raw`${itemLabel}\s*\(([^)]*)`, "i"); //Gather up to closing param of end of line
                const parameterMatch = syntaxString[1].match(parameterRegex);
                if (parameterMatch && parameterMatch[1]) {
                    const parameters = parameterMatch[1].
                        replace(/\[.*\]/g, "").  //Remove optional parameters
                        split(",");
                    parameters.forEach((parameter, index, parameters) => {
                        const parameterName = parameter.trim().replace(/.*\W(\w+).*/, "$1"); //Grabs las word of the parameter, i.e. parameter name
                        if (parameterName.length === 0) { return; }
                        if (index >0 ) { snippetString.appendText(", "); }
                        snippetString.appendPlaceholder(parameterName);
                    });

                }
                else {
                    snippetString.appendTabstop();
                }
                snippetString.appendText(")");
                item.insertText = snippetString;
            }
            resolve(item);
        });
    }



}