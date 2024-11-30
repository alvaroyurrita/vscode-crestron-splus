import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
    env,
    Uri,
    // StatusBarAlignment
} from "vscode";

import { SimplPlusFormattingProvider } from './simplPlusFormattingProvider';
import { SimplPlusHoverProvider } from "./simplPlusHoverProvider";
import { buildExtensionTasks, clearExtensionTasks, } from './buildExtensionTasks';
import { SimplPlusActiveDocuments } from "./simplPlusActiveDocuments";
import { showBuildTargetsQuickPick as showBuildTargetsQuickPick } from "./showBuildTargetsQuickPick";
import { updateBuildTargetsStatusBar as updateBuildTargetsStatusBar } from './updateBuildTargetsStatusBar';
import { simplPlusCompileCurrent } from './simplPlusCompileTasks';
import { BuildType } from "./build-type";



// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
    let term = window.createTerminal('simpl-plus', 'c:\\windows\\system32\\cmd.exe');
    term.sendText(`\"${shellCommand}\"`, true);
    term.sendText("exit", true);
}

const simplPlusDocuments = new SimplPlusActiveDocuments();

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

    let webHelp_command = commands.registerCommand("simpl-plus.webHelp", () => {
        env.openExternal(Uri.parse('https://help.crestron.com/simpl_plus'));
    });

    let showQuickPick_command = commands.registerCommand("simpl-plus.showQuickPick", async () => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
            const newBuildTargets = await showBuildTargetsQuickPick(currentBuildTargets);
            if (newBuildTargets === undefined) { return; }
            const updatedBuildTargets = simplPlusDocuments.UpdateSimpPlusDocumentBuildTargets(activeEditor.document, newBuildTargets);
            if (updatedBuildTargets === undefined) { return; }
            updateBuildTargetsStatusBar(updatedBuildTargets);
        }
    });

    let build_command = commands.registerCommand("simpl-plus.build", () => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
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
    context.subscriptions.push(showQuickPick_command);
    context.subscriptions.push(build_command);


    workspace.onDidChangeConfiguration(buildExtensionTasks);
    workspace.onDidOpenTextDocument(buildExtensionTasks);
    workspace.onDidOpenTextDocument((document) => {
        if (document.languageId !== "simpl-plus") {
            updateBuildTargetsStatusBar(BuildType.None);
            return;
        }
        const currentBuildTargets = simplPlusDocuments.GetSimplPlusDocumentBuildTargets(document);
        updateBuildTargetsStatusBar(currentBuildTargets);
    });
    workspace.onDidSaveTextDocument(buildExtensionTasks);
    window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined || editor.document.languageId !== "simpl-plus") {
            updateBuildTargetsStatusBar(BuildType.None);
            return;
        }
        const currentBuildTargets = simplPlusDocuments.GetSimplPlusDocumentBuildTargets(editor.document);
        updateBuildTargetsStatusBar(currentBuildTargets);
    });
    workspace.onDidCloseTextDocument((document) => {
        if (document.languageId !== "simpl-plus") {
            return;
        }
        simplPlusDocuments.RemoveSimpPlusDocument(document);
    });

    buildExtensionTasks();
    const activeEditor = window.activeTextEditor;
    if (activeEditor === undefined || activeEditor.document.languageId !== "simpl-plus") {
        updateBuildTargetsStatusBar(BuildType.None);
        return;
    }
    console.log("-----starting Document",activeEditor.document.fileName);

    const currentBuildTargets = simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
    updateBuildTargetsStatusBar(currentBuildTargets);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
    simplPlusDocuments.RemoveAllSimpPlusDocuments();
    clearExtensionTasks();
}




