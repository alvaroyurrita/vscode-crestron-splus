import { window, workspace } from "vscode";

export function getCompilerPath(): string {
    return `\"${workspace.getConfiguration("simpl-plus").simplDirectory}\\SPlusCC.exe\"`;
}

export function getFileName(): string | undefined {
    const activeEditor = window.activeTextEditor;
    const activeDocument = activeEditor?.document;
    return  activeDocument?.fileName;
}