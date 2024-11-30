import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
    env,
    Uri,
} from "vscode";

import { SimplPlusFormattingProvider } from './simplPlusFormattingProvider';
import { SimplPlusHoverProvider } from "./simplPlusHoverProvider";
import { buildExtensionTasks, clearExtensionTasks, } from './buildExtensionTasks';
import { simplPlusCompileCurrent } from './simplPlusCompileTasks';
import  * as SimplPlusStatusBar from  "./simplPlusStatusBar";


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

    SimplPlusStatusBar.register(context);


    let localHelp_command = commands.registerCommand("simpl-plus.localHelp", () => {
        const helpLocation = `${workspace.getConfiguration("simpl-plus").simplDirectory}\\Simpl+lr.chm`;
        callShellCommand(helpLocation);
    });

    let webHelp_command = commands.registerCommand("simpl-plus.webHelp", () => {
        env.openExternal(Uri.parse('https://help.crestron.com/simpl_plus'));
    });

    let build_command = commands.registerCommand("simpl-plus.build", () => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = SimplPlusStatusBar.GetDocumentBuildTargets(activeEditor.document);
            simplPlusCompileCurrent(currentBuildTargets);
        }
    });

    let thisFormatProvider = new SimplPlusFormattingProvider();
    const formatProvider = languages.registerDocumentFormattingEditProvider({ language: 'simpl-plus' }, thisFormatProvider);

    let thisHoverProvider = new SimplPlusHoverProvider();
    const hoverProvider = languages.registerHoverProvider({ language: 'simpl-plus' }, thisHoverProvider);

    context.subscriptions.push(formatProvider);
    context.subscriptions.push(hoverProvider);
    context.subscriptions.push(localHelp_command);
    context.subscriptions.push(webHelp_command);
    context.subscriptions.push(build_command);


    workspace.onDidChangeConfiguration(buildExtensionTasks);
    workspace.onDidOpenTextDocument(buildExtensionTasks);
    workspace.onDidSaveTextDocument(buildExtensionTasks);


    buildExtensionTasks();

}

// this method is called when your extension is deactivated
export function deactivate(): void {
    clearExtensionTasks();
}




