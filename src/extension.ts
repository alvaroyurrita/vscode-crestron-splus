import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
    env,
    Uri
} from "vscode";

import { SimplPlusFormattingProvider } from './SimplPlusFormattingProvider';
import { SimplPlusHoverProvider } from "./simplPlusHoverProvider";


import { buildExtensionTasks, clearExtensionTasks } from './buildExtensionTasks';

// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
    let term = window.createTerminal('simpl-plus', 'c:\\windows\\system32\\cmd.exe');
    term.sendText(`\"${shellCommand}\"`, true);
    term.sendText("exit", true);
}


export async function activate(context: ExtensionContext) {

    // if (workspace.workspaceFolders === undefined) {
    //     let fileName = window?.activeTextEditor?.document.uri.path;
    //     let fileFolder = fileName.slice(0, fileName.lastIndexOf("/") + 1);
    //     commands.executeCommand("vscode.openFolder", Uri.parse(fileFolder));
    // }


    let localHelp_command = commands.registerCommand("simpl-plus.localHelp", () => {
        const helpLocation = `${workspace.getConfiguration("simpl-plus").simplDirectory}\\Simpl+lr.chm`;
        callShellCommand(helpLocation);
    });

    let webHelp_command = commands.registerCommand("simpl-plus.webHelp", ()=>{
        env.openExternal(Uri.parse('https://help.crestron.com/simpl_plus'));
    });

    let thisFormatProvider = new SimplPlusFormattingProvider();
    const formatProvider = languages.registerDocumentFormattingEditProvider({ language: 'simpl-plus-source' }, thisFormatProvider);

    let thisHoverProvider = new SimplPlusHoverProvider();
    const hoverProvider = languages.registerHoverProvider({ language: 'simpl-plus-source' }, thisHoverProvider);

    context.subscriptions.push(formatProvider);
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




