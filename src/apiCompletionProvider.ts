import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionContext, CompletionItemKind, SnippetString } from "vscode";
import { provideClassTokens } from "./apiParser";

export class ApiCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        CompletionItem[] | undefined {

        const apiTokens = provideClassTokens();
        const classes = apiTokens.map(classToken => classToken.name);
        let linePrefix = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = linePrefix.match(/(\w+)\.$/);
        if (!wordWithDotMatch) {
            return undefined;
        }
        linePrefix = linePrefix.replace(/.*\W(\w+)\./, '$1');
        if (!classes.includes(linePrefix)) { return undefined; }
        const classMembers = apiTokens.find(classToken => classToken.name === linePrefix);
        if (classMembers === undefined) { return undefined; }
        const completionItems: CompletionItem[] = [];
        const delegateItems = classMembers.delegates.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.type} ${member.name}(${member.parameters})`;
            completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const eventItems = classMembers.events.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.name}(${member.parameters})`;
            completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const functionItems = classMembers.functions.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.returnType} ${member.name}(${member.parameters})`;
            completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const propertyItems = classMembers.properties.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.dataType} ${member.name}`;
            return completionItem;
        });
        const variableItems = classMembers.variables.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.dataType} ${member.name}`;
            return completionItem;
        });
        const delegatePropertyItems = classMembers.delegateProperties.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = this.getItemKindFromApiToken(member.type);
            completionItem.documentation = `${member.dataType} ${member.name}`;
            return completionItem;
        });
        completionItems.push(...delegateItems, ...eventItems, ...functionItems, ...propertyItems, ...variableItems, ...delegatePropertyItems);
        return completionItems;
    }

    private createSnippetString(tokenName: string, tokenParameters: string) : SnippetString{
        const snippetString = new SnippetString();
        snippetString.appendText(tokenName);
        snippetString.appendText("(");
        if (tokenParameters.trim().length !== 0) {
            const parameters = tokenParameters.split(",");
            parameters.forEach((parameter, index, parameters) => {
                const parameterName = parameter.trim().split(" ")[1].trim();
                snippetString.appendPlaceholder(parameterName);
                if (index < parameters.length - 1) {snippetString.appendText(", ");}
            });
        }
        snippetString.appendText(")");
        return snippetString;
    }

    private getItemKindFromApiToken(tokenType: string): CompletionItemKind {
        switch (tokenType) {
            case "delegate":
                return CompletionItemKind.Class;
            case "event":
                return CompletionItemKind.Event;
            case "function":
                return CompletionItemKind.Method;
            case "property":
                return CompletionItemKind.Property;
            case "variable":
                return CompletionItemKind.Variable;
            case "delegateProperty":
                return CompletionItemKind.Property;
            case "class":
                return CompletionItemKind.Class;
            default:
                return CompletionItemKind.Text;
        }
    }
}