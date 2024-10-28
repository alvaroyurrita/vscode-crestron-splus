
import {
    Range,
    TextDocument,
    TextEdit,
    FormattingOptions,
    CancellationToken,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
} from "vscode";

export interface RangeFormattingOptions {
    rangeStart: number;
    rangeEnd: number;
}

export class SimplPlusFormattingProvider
    implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {

    constructor() { }

    public async provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        _options: FormattingOptions,
        _token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document, {
            rangeEnd: document.offsetAt(range.end),
            rangeStart: document.offsetAt(range.start),
        });
    }

    public async provideDocumentFormattingEdits(
        document: TextDocument,
        _options: FormattingOptions,
        _token: CancellationToken
    ): Promise<TextEdit[]> {
        return this.provideEdits(document);
    }

    async provideEdits(document: TextDocument, _options?: RangeFormattingOptions): Promise<TextEdit[]> {
        let outputText = this.formatText(document.getText());
        return [new TextEdit(
            this.fullDocumentRange(document),
            outputText)];
    }

    fullDocumentRange(document: TextDocument): Range {
        const lastLineId = document.lineCount - 1;
        return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
    }

    formatText(docText: string): string {
        // Set up variables for grabbing and replacing the text
        let outputText = "";
        let indentLevel = 0;                                        // Current line indent level (number of tabs)
        let inComment = 0;                                          // If we're in a comment and what level
        let inSignalList = 0;                                       // If we're in a list of signals
        let startingComment = 0;                                    // Check if this line starts a comment
        let endingComment = 0;                                      // Check if this line ends a comment
        let startingSignalList = 0;
        let docLines = docText.split(/\r?\n/);                      // Split into lines

        let lineSuffix = '\r';                                      // whether to add the suffix or not

        // Comment weeders
        let reDeCom1 = /(\/\/.*)/gm;                                // Single line comment
        let reDeCom2 = /((?:\(\*|\/\*).*(?:\*\)|\*\/))/gm;          // Fully enclosed multiline comment
        let reDeCom3 = /(.*(?:\*\)|\*\/))/gm;                       // Closing multiline comment
        let reDeCom4 = /((?:\(\*|\/\*).*)/gm;                       // Opening multiline comment
        let reString = /'[^']*'/gm;

        for (var line = 0; line < docLines.length; line++) {
            startingComment = 0;
            endingComment = 0;
            let thisLine = docLines[line];
            let thisLineTrimmed = docLines[line].trimLeft();
            let thisLineClean = docLines[line].trimLeft().replace(reDeCom1, "").replace(reDeCom2, "");      // Remove any single line comments and fully enclosed multiline comments

            if (reDeCom3.test(thisLineClean) && inComment > 0) {        // If a multiline comment closes on this line, decrease our comment level
                inComment = inComment - 1;
                if (inComment === 0) {
                    endingComment = 1;
                }
            }
            if (reDeCom4.test(thisLineClean)) {                         // If a multiline comment opens on this line, increase our comment level
                if (inComment === 0) {
                    startingComment = 1;                                // If this line starts a multiline comment, it still needs to be checked
                }
                inComment = inComment + 1;
            }

            thisLineClean = thisLineClean.replace(reDeCom3, "").replace(reDeCom4, "");            // Remove any code that we think is inside multiline comments
            thisLineClean = thisLineClean.replace(reString, "");                                  // Remove any string literals from the line so we don't get false positives
            let brOpen = this.countChars(thisLineClean, '{') - this.countChars(thisLineClean, '}');         // Check the delta for squiggly brackets
            let sqOpen = this.countChars(thisLineClean, '[') - this.countChars(thisLineClean, ']');         // Check the delta for square brackets
            let parOpen = this.countChars(thisLineClean, '(') - this.countChars(thisLineClean, ')');        // Check the delta for parenthesis
            let indentDelta = brOpen + sqOpen + parOpen;                                          // Calculate total delta

            if ((
                thisLineClean.toLowerCase().includes("digital_input") ||
                thisLineClean.toLowerCase().includes("analog_input") ||
                thisLineClean.toLowerCase().includes("string_input") ||
                thisLineClean.toLowerCase().includes("buffer_input") ||
                thisLineClean.toLowerCase().includes("digital_output") ||
                thisLineClean.toLowerCase().includes("analog_output") ||
                thisLineClean.toLowerCase().includes("string_output")
            ) && !thisLineClean.includes(";")) {
                inSignalList = 1;
                startingSignalList = 1;
            }

            if (line === docLines.length - 1) {
                lineSuffix = '';
            }

            // Indent Increase Rules
            if (inSignalList === 1) {
                if (startingSignalList === 1) {
                    outputText = outputText + thisLineTrimmed + lineSuffix;
                    startingSignalList = 0;
                }
                else {
                    outputText = outputText + ('\t'.repeat(4)) + thisLineTrimmed + lineSuffix;
                    if (thisLineTrimmed.includes(";")) {
                        inSignalList = 0;
                    }
                }
            }
            // If we're in a multiline comment, just leave the line alone unless it's the start of a ML comment
            else if ((inComment > 0 && !startingComment) || (!inComment && endingComment)) {
                outputText = outputText + thisLine + lineSuffix;
            }
            // If we're increasing indent delta because of this line, the add it, then increase indent
            else if (indentDelta > 0) {
                outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + lineSuffix;
                indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
            }
            // If we're decreasing delta, and the line starts with the character that is decreasing it, then decrease first, and then add this line
            else if (indentDelta < 0 && (thisLineClean[0] === '}' || thisLineClean[0] === ']' || thisLineClean[0] === ')')) {
                indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
                outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + lineSuffix;
            }
            // If we're decreasing delta but the first character isn't the cause, then we're still inside the block
            else if (indentDelta < 0) {
                outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + lineSuffix;
                indentLevel = (indentLevel + indentDelta >= 0) ? (indentLevel + indentDelta) : 0;
            }
            // indentDelta === 0; do nothing except add the line with the indent
            else {
                outputText = outputText + ('\t'.repeat(indentLevel)) + thisLineTrimmed + lineSuffix;
            }
        };

        return outputText;
    }

    countChars(haystack: string, needle: string): number {
        let count = 0;
        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle) {
                count++;
            }
        }
        return count;
    }
}
