import { QuickPickItem,  window, workspace, QuickPickOptions } from 'vscode';
import { updateBuildOptionStatusBar } from './updateBuildOptionsStatusBar';
export async function  showBuildOptionsQuickPick() : Promise<void> {
    const simplConfig = workspace.getConfiguration("simpl-plus");
    const quickPickItems: QuickPickItem[] = [
        { label: "2-Series", description: "Control System Target", picked: simplConfig.get("enable2series") },
        { label: "3-Series", description: "Control System Target", picked: simplConfig.get("enable3series") },
        { label: "4-Series", description: "Control System Target", picked: simplConfig.get("enable4series") }
    ];
    const quickPickOptions: QuickPickOptions = {
        canPickMany: true,
        placeHolder: "Select Compile Target Option"
    };
    const selection = await window.showQuickPick<any>(quickPickItems, quickPickOptions) as QuickPickItem[];
    if (selection) {
        // simplConfig.update("enable2series", selection.some((item) => item.label === "2-Series"));
        // simplConfig.update("enable3series", selection.some((item) => item.label === "3-Series"));
        // simplConfig.update("enable4series", selection.some((item) => item.label === "4-Series"));
        updateBuildOptionStatusBar();
    }
}

