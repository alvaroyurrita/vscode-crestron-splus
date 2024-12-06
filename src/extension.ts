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
import { SimplPlusTasks, } from './simplPlusTasks';
import { SimplPlusStatusBar } from "./simplPlusStatusBar";
import { insertCategory } from "./simplPlusCategories";
import { ApiCompletionProvider } from "./apiCompletionProvider";


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

    const simplPlusStatusBar = SimplPlusStatusBar.getInstance(context);
    const simplPlusTasks = SimplPlusTasks.getInstance(context);

    let localHelp_command = commands.registerCommand("simpl-plus.localHelp", () => {
        const helpLocation = `${workspace.getConfiguration("simpl-plus").simplDirectory}\\Simpl+lr.chm`;
        callShellCommand(helpLocation);
    });

    let webHelp_command = commands.registerCommand("simpl-plus.webHelp", () => {
        env.openExternal(Uri.parse('https://help.crestron.com/simpl_plus'));
    });

    let showCategories_command = commands.registerCommand("simpl-plus.insertCategory", () => {
        insertCategory();
    });

    let build_command = commands.registerCommand("simpl-plus.build", () => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = simplPlusStatusBar.GetDocumentBuildTargets(activeEditor.document);
            simplPlusTasks.simplPlusCompileCurrent(currentBuildTargets);
        }
    });

    let thisFormatProvider = new SimplPlusFormattingProvider();
    const formatProvider = languages.registerDocumentFormattingEditProvider({ language: 'simpl-plus' }, thisFormatProvider);

    let thisHoverProvider = new SimplPlusHoverProvider();
    const hoverProvider = languages.registerHoverProvider({ language: 'simpl-plus' }, thisHoverProvider);

    let thisApiCompletionProvider = new ApiCompletionProvider();
    const apiCompletionProvider = languages.registerCompletionItemProvider({ language: 'simpl-plus' },thisApiCompletionProvider, '.');

    context.subscriptions.push(
        formatProvider,
        hoverProvider,
        localHelp_command,
        webHelp_command,
        build_command,
        showCategories_command,
        simplPlusTasks,
        apiCompletionProvider
    );
}




