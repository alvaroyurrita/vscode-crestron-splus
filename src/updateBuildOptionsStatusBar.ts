import { window, workspace, StatusBarAlignment } from 'vscode';
import { getFileName } from "./helperFunctions";
import * as fsExistsWrapper from './fsExistsSyncWrapper';
import * as fs from 'fs';
import * as path from 'path';

const test = window.createStatusBarItem(StatusBarAlignment.Right, 100);
test.tooltip = "Click to select SIMPL+ compilation targets";
test.command = "simpl-plus.showQuickPick";
export function updateBuildOptionStatusBar(): void 
{
    test.text = `Targets: ${getBuildTargets()}`;
    test.show();
}

function getBuildTargets(): string {
    const fileName = getFileName();
    if (fileName === undefined) {
        return (getBuildTaskFromGlobal());
    }
    const fileNamePath = path.parse(fileName);
    if (isUshFileExists(fileNamePath)) {
        return (getBuildTaskFromCurrentFile(fileNamePath));
    }
    return (getBuildTaskFromGlobal());
}

function isUshFileExists(filePath: path.ParsedPath): boolean {
    const ushFilePath = path.join(filePath.dir, filePath.name + ".ush");
    return fsExistsWrapper.existsSyncWrapper(ushFilePath);
}

function getBuildTaskFromCurrentFile(filePath: path.ParsedPath): string {
    const ushFilePath = path.join(filePath.dir, filePath.name + ".ush");
    const ushContent = fs.readFileSync(ushFilePath, 'utf8');
    const regex = /(?:Inclusions_CDS=)(.*)/;
    const match = ushContent.match(regex);
    if (match && match[1]) {
        let buildTasks = "";
        buildTasks = buildTasks.concat(match[1].includes("5") ? "$(target-two)" : "");
        buildTasks = buildTasks.concat(match[1].includes("6") ? "$(target-three)" : "");
        buildTasks = buildTasks.concat(match[1].includes("7") ? "$(target-four)" : "");
        return buildTasks;
    }
    return getBuildTaskFromGlobal();
}

function getBuildTaskFromGlobal(): string {
    let buildTasks = "";
    const simplConfig = workspace.getConfiguration("simpl-plus");
    buildTasks = buildTasks.concat(simplConfig.enable2series ? "$(target-two)" : "");
    buildTasks = buildTasks.concat(simplConfig.enable3series ? "$(target-three)" : "");
    buildTasks = buildTasks.concat(simplConfig.enable4series ? "$(target-four)" : "");
    return buildTasks;
}