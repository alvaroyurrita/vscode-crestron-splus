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

export class SimplPlusStatusBar {
    private _statusBar: StatusBarItem;
    public static instance: SimplPlusStatusBar;
    private _simplPlusDocuments;

    public static getInstance(ctx?: ExtensionContext): SimplPlusStatusBar {
        if (!SimplPlusStatusBar.instance && ctx) {
            SimplPlusStatusBar.instance = new SimplPlusStatusBar(ctx);
        }
        return SimplPlusStatusBar.instance;
    }

    private constructor(ctx?: ExtensionContext) {
        this._statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        this._statusBar.text = "SIMPL+";
        this._statusBar.tooltip = "Click to select SIMPL+ compilation targets";
        this._statusBar.command = "simpl-plus.showQuickPick";
        this._simplPlusDocuments = new SimplPlusActiveDocuments();


        let showQuickPick_command = commands.registerCommand("simpl-plus.showQuickPick", async () => this.showQuickPick());

        let onOpenTextDocument_event = workspace.onDidOpenTextDocument((document) => this.updateOnOpenTextDocument(document));
        let onChangeActiveTextEditor_event = window.onDidChangeActiveTextEditor((editor) => this.updateOnChangeActiveTextEditor(editor));
        let onCloseTextDocument_event = workspace.onDidCloseTextDocument((document) => this.updateOnCloseTextDocument(document));

        ctx?.subscriptions.push(
            showQuickPick_command,
            onOpenTextDocument_event,
            onChangeActiveTextEditor_event,
            onCloseTextDocument_event,
            this._statusBar,
            this._simplPlusDocuments
        );


        const activeEditor = window.activeTextEditor;
        if (activeEditor === undefined || activeEditor.document.languageId !== "simpl-plus") {
            this.updateBuildTargetsStatusBar(BuildType.None);
            return;
        }

        const currentBuildTargets = this._simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
        this.updateBuildTargetsStatusBar(currentBuildTargets);
    }

    private async showQuickPick() {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = this._simplPlusDocuments.GetSimplPlusDocumentBuildTargets(activeEditor.document);
            const newBuildTargets = await this.showBuildTargetsQuickPick(currentBuildTargets);
            if (newBuildTargets === undefined) { return; }
            const updatedBuildTargets = this._simplPlusDocuments.UpdateSimpPlusDocumentBuildTargets(activeEditor.document, newBuildTargets);
            if (updatedBuildTargets === undefined) { return; }
            this.updateBuildTargetsStatusBar(updatedBuildTargets);
        }
    }

    private updateOnCloseTextDocument(document: TextDocument) {
        if (document.languageId !== "simpl-plus") {
            return;
        }
        this._simplPlusDocuments.RemoveSimpPlusDocument(document);
    }
    private updateOnChangeActiveTextEditor(editor: TextEditor | undefined) {
        if (editor === undefined || editor.document.languageId !== "simpl-plus") {
            this.updateBuildTargetsStatusBar(BuildType.None);
            return;
        }
        const currentBuildTargets = this._simplPlusDocuments.GetSimplPlusDocumentBuildTargets(editor.document);
        this.updateBuildTargetsStatusBar(currentBuildTargets);
    };
    private updateOnOpenTextDocument(document: TextDocument) {
        if (document.languageId !== "simpl-plus") {
            this.updateBuildTargetsStatusBar(BuildType.None);
            return;
        }
        const currentBuildTargets = this._simplPlusDocuments.GetSimplPlusDocumentBuildTargets(document);
        this.updateBuildTargetsStatusBar(currentBuildTargets);
    }

    private updateBuildTargetsStatusBar(targets: BuildType): void {
        if (targets === BuildType.None) {
            this._statusBar.hide();
            return;
        }
        let buildTasks = "";
        buildTasks = buildTasks.concat((targets & BuildType.Series2) === BuildType.Series2 ? "$(target-two)" : "");
        buildTasks = buildTasks.concat((targets & BuildType.Series3) === BuildType.Series3 ? "$(target-three)" : "");
        buildTasks = buildTasks.concat((targets & BuildType.Series4) === BuildType.Series4 ? "$(target-four)" : "");
        this._statusBar.text = `Targets: ${buildTasks}`;
        this._statusBar.show();
    }

    private async showBuildTargetsQuickPick(currentTypes: BuildType): Promise<BuildType | undefined> {
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

    public GetDocumentBuildTargets(document: TextDocument | undefined): BuildType {
        return this._simplPlusDocuments.GetSimplPlusDocumentBuildTargets(document);
    }
}