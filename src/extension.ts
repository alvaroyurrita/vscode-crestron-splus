import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
    MarkdownString,
    Hover,
} from "vscode";

import { FormattingProvider, FormatProvider } from './formattingProvider'
import axios from 'axios';

import { buildExtensionTasks, clearExtensionTasks } from './taskProvider';

// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
    let term = window.createTerminal('splus', 'c:\\windows\\system32\\cmd.exe');
    term.sendText("\"" + shellCommand + "\"", true);
    term.sendText("exit", true);
}

export function activate(context: ExtensionContext) {

    // if (workspace.workspaceFolders === undefined) {
    //     let fileName = window?.activeTextEditor?.document.uri.path;
    //     let fileFolder = fileName.slice(0, fileName.lastIndexOf("/") + 1);
    //     commands.executeCommand("vscode.openFolder", Uri.parse(fileFolder));
    // }

    let localHelp_command = commands.registerCommand("splus.localHelp", () => {
        callShellCommand(workspace.getConfiguration("splus").helpLocation);
    });

    function openWebHelp(): void {
        commands.executeCommand('simpleBrowser.show', 'http://help.crestron.com/simpl_plus');
    }

    let webHelp_command = commands.registerCommand("splus.webHelp", openWebHelp);

    let thisFormatProvider = new FormattingProvider(FormatProvider);
    languages.registerDocumentFormattingEditProvider({ language: 'splus-source' }, thisFormatProvider);
    const hoverProvider = languages.registerHoverProvider('*', {
        async provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // Assuming command names are prefixed with 'command.'
            let helpUrl = "";
            switch (word) {
                case 'LONG_INTEGER':
                    helpUrl = `https://help.crestron.com/simpl_plus/#Language_Constructs_&_Functions/Declarations/LONG_INTEGER.html`;
                    break;
                case 'SetArray':
                    helpUrl = `https://help.crestron.com/simpl_plus/Content/Language_Constructs_&_Functions/Array_Operations/SetArray.htm?tocpath=Language%20Constructs%20%26%20Functions%20Reference%7CArray%20Operations%7C_____3`;
                    break;
                default:
                    return undefined;
            }

            try {
                const helpContent = await GetSimplHelpText(helpUrl);
                if (helpContent === undefined) { return undefined; }
                return new Hover(helpContent);
            } catch (error) {
                console.error(`Failed to fetch help content for ${word}:`, error);
            }

            return undefined;
        }
    });

    context.subscriptions.push(hoverProvider);


    context.subscriptions.push(localHelp_command);
    context.subscriptions.push(webHelp_command);

    workspace.onDidChangeConfiguration(buildExtensionTasks);
    workspace.onDidOpenTextDocument(buildExtensionTasks);
    workspace.onDidSaveTextDocument(buildExtensionTasks);
    window.onDidChangeActiveTextEditor(buildExtensionTasks);


    buildExtensionTasks();
}

// this method is called when your extension is deactivated
export function deactivate(): void {
    clearExtensionTasks();
}

async function GetSimplHelpText(helpUrl: string): Promise<MarkdownString | undefined> {
    const theUrl = new URL(helpUrl);
    const response = await axios.get(helpUrl);
    if (response.status !== 200) {  return undefined; }
    const markdownContent = response.data;
    const sanitizedContent = replacePartialPathWithFull(theUrl, markdownContent);
    const markdownString = new MarkdownString(sanitizedContent);
    markdownString.isTrusted = true;
    markdownString.supportHtml = true;
    return markdownString;
}

function replacePartialPathWithFull(url: URL, content: string): string {
    const pathRegex = /(?:src|href)="([^"]*)"/gm;
    const baseUrl = `${url.protocol}/${url.host}${url.pathname}`;
    const paths = content.matchAll(pathRegex);
    if (paths === null) { return content; }
    for (const path of paths) {
        const pathFullLink = new URL(`${baseUrl}/../${path[1]}`);
        content = content.replace(path[1], `${pathFullLink.toString()}`);
    }
    return content;
}


