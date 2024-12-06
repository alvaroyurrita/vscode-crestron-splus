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
    Uri
} from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SimplPlusKeywordHelp } from "./simplPlusKeywordHelp";
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
        return new Promise(async () => {
            const helpContent = await this.helpDefinitions.GetSimplHelp(item.label.toString());
            if (helpContent === undefined) { return item; }
            const helpContentString = helpContent.value;
            item.documentation = helpContent;
            return item;
        });
    }



}