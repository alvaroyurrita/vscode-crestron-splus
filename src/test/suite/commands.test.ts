import * as assert from 'assert';
import { delay, OpenAndShowSPlusDocument } from '../testFunctions';
import * as sinon from "sinon";
import * as vscode from 'vscode';
import { resolve } from 'path';

suiteSetup(async function () {
    OpenAndShowSPlusDocument("\/\/Nothing To See");
    await delay(500);
});
suiteTeardown(async function () {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
});
suite('Registration', function () {
    const commandsToTest = [{
        command: 'simpl-plus.localHelp',
        title: 'Local Help'
    },
    {
        command: 'simpl-plus.webHelp',
        title: 'Web Help'
    },
    {
        command: 'simpl-plus.build',
        title: 'SIMPL+: Build SIMPL+ Project'
    }
    ];
    commandsToTest.forEach(function (command) {
        test(`${command.title} has been registered`, async function () {
            var commands = await vscode.commands.getCommands();
            assert.ok(commands.includes(command.command));
        });
    });
});
suite('Execution', function () {
    test('Local Help should open the help file', async function () {
        const fakeTerminal = sinon.spy({ sendText: function (text: string, addNewLine?: boolean) { } } as vscode.Terminal);
        const fakeTerminalCreator = sinon.stub(vscode.window, 'createTerminal').callsFake(() => {
            return fakeTerminal;
        });
        await vscode.commands.executeCommand('simpl-plus.localHelp');
        await delay(500);
        assert.ok(fakeTerminalCreator.args[0][0].toString().includes("simpl-plus"));
        console.log(fakeTerminalCreator.args[0].length);
        assert.ok(typeof fakeTerminalCreator.args !== undefined &&
            fakeTerminalCreator.args[0] !== undefined &&
            fakeTerminalCreator.args[0].length > 1 &&
            //@ts-ignore
            fakeTerminalCreator.args[0][1].includes('c:\\windows\\system32\\cmd.exe'
            ));
        assert.ok(fakeTerminal.sendText.calledTwice);
        assert.ok(fakeTerminal.sendText.args[0].includes('"C:\\Program Files (x86)\\Crestron\\Simpl\\Simpl+lr.chm"'));
        assert.ok(fakeTerminal.sendText.args[1].includes('exit'));

    });
    test('Web Help should open open a browser link', async function () {
        const fakeShowBrowserCommand = sinon.stub(vscode.env, 'openExternal')
            .returns(Promise.resolve(true));
        await vscode.commands.executeCommand('simpl-plus.webHelp');
        await delay(500);
        assert.ok(fakeShowBrowserCommand.calledOnce);
        assert.ok(fakeShowBrowserCommand.args[0][0].toString() === 'https://help.crestron.com/simpl_plus');
    });
    test('Build should execute to compile 3 and 4 series', async function () 
    {
        const fakeTaskCreator = sinon.stub(vscode.tasks, 'executeTask').resolves();
        await OpenAndShowSPlusDocument("Nothing To See");
        await vscode.commands.executeCommand('simpl-plus.build');
        await delay(500);
        assert.ok(fakeTaskCreator.calledOnce);
        assert.strictEqual(fakeTaskCreator.args[0][0].name, 'Compile 3 & 4 Series');
    }
});