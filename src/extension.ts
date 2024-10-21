import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
} from "vscode";

import { FormattingProvider, FormatProvider } from './formattingProvider'

import { buildExtensionTasks, clearExtensionTasks }  from './taskProvider';

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
