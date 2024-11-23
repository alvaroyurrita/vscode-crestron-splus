import * as vscode from 'vscode';
import * as fs from 'fs';

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function removeWorkspaceCustomSettings() {
    await vscode.commands.executeCommand('workbench.action.closeAllGroups');
    const currentWorkspace = vscode.workspace.workspaceFolders;
    //@ts-ignore
    const dirtyDocumentPath = vscode.Uri.joinPath(currentWorkspace[0].uri, ".vscode");
    if (fs.existsSync(dirtyDocumentPath.fsPath)) {
        fs.rmSync(dirtyDocumentPath.fsPath, { recursive: true, force: true });
    }
}

export async function OpenAndShowSPlusDocument(documentContent: string) {
    const document = await vscode.workspace.openTextDocument({
        language: "simpl-plus-source",
        content: documentContent,
    });
    await vscode.window.showTextDocument(document);
    await delay(100);
}