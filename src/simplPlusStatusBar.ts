import {
    window,
    StatusBarAlignment,
    StatusBarItem,
    ExtensionContext,
    commands, workspace,
    QuickPickItem,
    QuickPickOptions,
    TextDocument,
    TextEditor
} from 'vscode';
import { SimplPlusActiveDocuments } from "./simplPlusActiveDocuments";
import { BuildType } from './build-type';

let _simplPlusDocuments: SimplPlusActiveDocuments;
let _statusBar: StatusBarItem;

export function register(ctx?: ExtensionContext) {

    _statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    _statusBar.text = "SIMPL+";
    _statusBar.tooltip = "Click to select SIMPL+ compilation targets";
    _statusBar.command = "simpl-plus.showQuickPick";
    _simplPlusDocuments = new SimplPlusActiveDocuments();


    let showQuickPick_command = commands.registerCommand("simpl-plus.showQuickPick", showQuickPick);

    let onOpenTextDocument_event = workspace.onDidOpenTextDocument(updateOnOpenTextDocument);
    let onChangeActiveTextEditor_event = window.onDidChangeActiveTextEditor(updateOnChangeActiveTextEditor);
    let onCloseTextDocument_event = workspace.onDidCloseTextDocument(updateOnCloseTextDocument);

    ctx?.subscriptions.push(
        showQuickPick_command,
        onOpenTextDocument_event,
        onChangeActiveTextEditor_event,
        onCloseTextDocument_event,
        _statusBar,
        _simplPlusDocuments
    );


    const activeEditor = window.activeTextEditor;
    if (activeEditor === undefined || activeEditor.document.languageId !== "simpl-plus") {
        updateBuildTargetsStatusBar(BuildType.None);
        return;
    }

    const currentBuildTargets = _simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
    updateBuildTargetsStatusBar(currentBuildTargets);
}

async function showQuickPick() {
    const activeEditor = window.activeTextEditor;
    if (activeEditor !== undefined) {
        const currentBuildTargets = _simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
        const newBuildTargets = await showBuildTargetsQuickPick(currentBuildTargets);
        if (newBuildTargets === undefined) { return; }
        const updatedBuildTargets = _simplPlusDocuments.UpdateSimpPlusDocumentBuildTargets(activeEditor.document, newBuildTargets);
        if (updatedBuildTargets === undefined) { return; }
        updateBuildTargetsStatusBar(updatedBuildTargets);
    }
}

function updateOnCloseTextDocument(document: TextDocument) {
    if (document.languageId !== "simpl-plus") {
        return;
    }
    _simplPlusDocuments.RemoveSimpPlusDocument(document);
}
function updateOnChangeActiveTextEditor(editor: TextEditor | undefined) {
    if (editor === undefined || editor.document.languageId !== "simpl-plus") {
        updateBuildTargetsStatusBar(BuildType.None);
        return;
    }
    const currentBuildTargets = _simplPlusDocuments.GetSimplPlusDocumentBuildTargets(editor.document);
    updateBuildTargetsStatusBar(currentBuildTargets);
};
function updateOnOpenTextDocument(document: TextDocument) {
    if (document.languageId !== "simpl-plus") {
        updateBuildTargetsStatusBar(BuildType.None);
        return;
    }
    const currentBuildTargets = _simplPlusDocuments.GetSimplPlusDocumentBuildTargets(document);
    updateBuildTargetsStatusBar(currentBuildTargets);
}

function updateBuildTargetsStatusBar(targets: BuildType): void {
    if (targets === BuildType.None) {
        _statusBar.hide();
        return;
    }
    let buildTasks = "";
    buildTasks = buildTasks.concat((targets & BuildType.Series2) === BuildType.Series2 ? "$(target-two)" : "");
    buildTasks = buildTasks.concat((targets & BuildType.Series3) === BuildType.Series3 ? "$(target-three)" : "");
    buildTasks = buildTasks.concat((targets & BuildType.Series4) === BuildType.Series4 ? "$(target-four)" : "");
    _statusBar.text = `Targets: ${buildTasks}`;
    _statusBar.show();
}

async function showBuildTargetsQuickPick(currentTypes: BuildType): Promise<BuildType | undefined> {
    const simplConfig = workspace.getConfiguration("simpl-plus");
    const quickPickItems: QuickPickItem[] = [
        { label: "2-Series", description: "Control System Target", picked: (currentTypes & BuildType.Series2) === BuildType.Series2 },
        { label: "3-Series", description: "Control System Target", picked: (currentTypes & BuildType.Series3) === BuildType.Series3 },
        { label: "4-Series", description: "Control System Target", picked: (currentTypes & BuildType.Series4) === BuildType.Series4 }
    ];
    const quickPickOptions: QuickPickOptions = {
        canPickMany: true,
        placeHolder: "Select Compile Target Option"
    };
    const selection = await window.showQuickPick<any>(quickPickItems, quickPickOptions) as QuickPickItem[];
    let buildType = BuildType.None;
    if (selection) {
        buildType |= selection.some((item) => item.label === "2-Series") ? BuildType.Series2 : BuildType.None;
        buildType |= selection.some((item) => item.label === "3-Series") ? BuildType.Series3 : BuildType.None;
        buildType |= selection.some((item) => item.label === "4-Series") ? BuildType.Series4 : BuildType.None;
        return buildType;
    }
    return undefined;
}

export function GetDocumentBuildTargets(document: TextDocument | undefined): BuildType {
    return _simplPlusDocuments.GetSimplPlusDocumentBuildTargets(document);
}