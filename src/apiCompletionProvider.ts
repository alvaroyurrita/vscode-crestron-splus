import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionContext, CompletionItemKind, SnippetString } from "vscode";
import { provideClassTokens } from "./apiParser";

export class ApiCompletionProvider implements CompletionItemProvider {
     public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext):
        Promise<CompletionItem[] | undefined> {

        const apiTokens = await provideClassTokens();
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
        const delegateItems = classMembers.internalDelegates.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
            completionItem.documentation = `${member.kind} ${member.name}(${member.parameters})`;
            // completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const eventItems = classMembers.internalEvents.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
            completionItem.documentation = `${member.name}(${member.parameters})`;
            // completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const functionItems = classMembers.internalFunctions.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
            completionItem.documentation = `${member.dataType} ${member.name}(${member.parameters})`;
            // completionItem.insertText = this.createSnippetString(member.name, member.parameters);
            return completionItem;
        });
        const propertyItems = classMembers.internalProperties.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
            completionItem.documentation = `${member.dataType} ${member.name}`;
            return completionItem;
        });
        const variableItems = classMembers.internalVariables.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
            completionItem.documentation = `${member.dataType} ${member.name}`;
            return completionItem;
        });
        const delegatePropertyItems = classMembers.internalProperties.map(member => {
            const completionItem = new CompletionItem(member.name);
            completionItem.kind = member.kind;
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
                const parameterName = parameter.trim().replace(/.*\W(\w+).*/, "$1"); //Grabs las word of the parameter, i.e. parameter name
                snippetString.appendPlaceholder(parameterName);
                if (index < parameters.length - 1) {snippetString.appendText(", ");}
            });
        }
        snippetString.appendText(")");
        return snippetString;
    }

    
}