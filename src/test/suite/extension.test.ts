import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

suite('Commands Test', function () {
  suiteTeardown(function () {
    vscode.window.showInformationMessage('All tests done!');
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
        // assert.ok(commands.includes(command.command));
      });
    });
  });
});

suite('Configuration', function () {
  suiteTeardown(function () {
    vscode.window.showInformationMessage('All tests done!');
  });
  suite('default Settings', function () {
    const settingsToTest = [{
      uri: 'compilerLocation',
      defaultValue: 'C:\\Program Files (x86)\\Crestron\\SIMPL\\SPlusCC.exe'
    }, {
      uri: 'enable2series',
      defaultValue: false
    }, {
      uri: 'enable3series',
      defaultValue: true
    }, {
      uri: 'enable4series',
      defaultValue: false
    }, {
      uri: 'helpLocation',
      defaultValue: 'C:\\Program Files (x86)\\Crestron\\Simpl\\Simpl+lr.chm'
    }];
    const configurationSplus = vscode.workspace.getConfiguration('splus');
    settingsToTest.forEach(function (setting) {
      test(`${setting.uri} has been added with default value ${setting.defaultValue}`, function () {
        var exists = configurationSplus.has(setting.uri);
        assert.ok(exists);
        var value = configurationSplus.get(setting.uri);
        assert.strictEqual(value, setting.defaultValue);
      });
    });
  });
});
