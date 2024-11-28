import { window, StatusBarAlignment, TextDocument } from 'vscode';
import { SimplPlusActiveDocuments } from "./simplPlusActiveDocuments";
import { BuildType } from './build-type';

const statusBarSimplPlusText = window.createStatusBarItem(StatusBarAlignment.Right, 100);
statusBarSimplPlusText.tooltip = "Click to select SIMPL+ compilation targets";
statusBarSimplPlusText.command = "simpl-plus.showQuickPick";
export function updateBuildOptionStatusBar(document: TextDocument, activeSimplPlusDocuments: SimplPlusActiveDocuments): void 
{
    const targets = activeSimplPlusDocuments.GetDocumentBuiltType(document);
    if (targets === BuildType.None) {
        statusBarSimplPlusText.hide();
        return;
    }
    let buildTasks = "";
    buildTasks = buildTasks.concat((targets & BuildType.Series2) === BuildType.Series2 ? "$(target-two)" : "");
    buildTasks = buildTasks.concat((targets & BuildType.Series3) === BuildType.Series3 ? "$(target-three)" : "");
    buildTasks = buildTasks.concat((targets & BuildType.Series4) === BuildType.Series4 ? "$(target-four)" : "");
    statusBarSimplPlusText.text = `Targets: ${buildTasks}`;
    statusBarSimplPlusText.show();
}