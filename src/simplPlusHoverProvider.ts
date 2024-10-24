import { HoverProvider, Hover, TextDocument, CancellationToken, Position } from 'vscode';
import { SimplPlusKeywordHelp } from './SimplPlusKeywordHelp';

export class SimplPlusHoverProvider implements HoverProvider {
    private helpDefinitions = new SimplPlusKeywordHelp();
    constructor() {

    }
    async provideHover(document: TextDocument, position: Position, Token: CancellationToken) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        try {
            const helpContent = await this.helpDefinitions.GetSimplHelp(word);
            if (helpContent === undefined) { return undefined; }
            return new Hover(helpContent);
        } catch (error) {
            console.error(`Failed to fetch help content for ${word}:`, error);
        }

        return undefined;
    }
}