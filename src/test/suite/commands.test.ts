import * as assert from 'assert';
import { delay } from './testFunctions';
import * as vscode from 'vscode';

suiteSetup(async function () {
    const currentWorkspace = vscode.workspace.workspaceFolders;
    const dirtyDocumentPath = vscode.Uri.joinPath(currentWorkspace[0].uri, "dirtyFile.csp");
    const dirtyDocument = await vscode.workspace.openTextDocument(dirtyDocumentPath);
    await vscode.window.showTextDocument(dirtyDocument);
    await delay(100);
});
suiteTeardown(async function () {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
});
suite('Registration', function () {
    const commandsToTest = [{
        command: 'splus.localHelp',
        title: 'Local Help'
    }, {
        command: 'splus.webHelp',
        title: 'Web Help'
    }];
    commandsToTest.forEach(function (command) {
        test(`${command.title} has been registered`, async function () {
            var commands = await vscode.commands.getCommands();
            console.log(`commands count: ${commands.length}`);
            console.log(`commands with splus ${commands.filter((c) => c.includes('splus'))}`);
            assert.ok(commands.includes(command.command));
        });
    });
});