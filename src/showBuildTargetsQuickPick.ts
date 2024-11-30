import { QuickPickItem,  window, workspace, QuickPickOptions } from 'vscode';
import { BuildType } from './build-type';
export async function  showBuildTargetsQuickPick(currentTypes: BuildType) : Promise<BuildType | undefined> {
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
        buildType |=  selection.some((item) => item.label === "2-Series") ? BuildType.Series2 : BuildType.None;
        buildType |=  selection.some((item) => item.label === "3-Series") ? BuildType.Series3 : BuildType.None;
        buildType |=  selection.some((item) => item.label === "4-Series") ? BuildType.Series4 : BuildType.None;
        return buildType;
    }
    return undefined;
}

