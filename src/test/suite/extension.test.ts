import * as assert from 'assert';
import * as sinon from "sinon";
import * as fs from 'fs';
import exp = require('constants');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeWorkspaceCustomSettings() {
  await vscode.commands.executeCommand('workbench.action.closeAllGroups');
  const currentWorkspace = vscode.workspace.workspaceFolders;
  const dirtyDocumentPath = vscode.Uri.joinPath(currentWorkspace[0].uri, ".vscode");
  if (fs.existsSync(dirtyDocumentPath.fsPath)) {
    fs.rmSync(dirtyDocumentPath.fsPath, { recursive: true, force: true });
  }
}

async function OpenAndShowSPlusDocument(documentContent: string) {
  const document = await vscode.workspace.openTextDocument({
    language: "splus-source",
    content: documentContent,
  });
  await vscode.window.showTextDocument(document);
}

suite('Commands Test', function () {
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
});

suite('Configuration', function () {
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



suite('Formatting', function () {
  suiteSetup(async function () {
    removeWorkspaceCustomSettings();
  });
  suiteTeardown(async function () {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });
  suite("Formatting File", function () {
    test("Formatting a dirty file should be the same as the pre-existing formatted file", async () => {
      const currentWorkspace = vscode.workspace.workspaceFolders;
      const dirtyDocumentPath = vscode.Uri.joinPath(currentWorkspace[0].uri, "dirtyFile.csp");
      const formattedDocumentPath = vscode.Uri.joinPath(currentWorkspace[0].uri, "formattedFile.csp");
      try {
        const expectedFormattedText = (await vscode.workspace.fs.readFile(formattedDocumentPath)).toLocaleString();

        const dirtyDocument = await vscode.workspace.openTextDocument(dirtyDocumentPath);
        await vscode.window.showTextDocument(dirtyDocument);
        await vscode.commands.executeCommand('editor.action.formatDocument');
        const newFormattedText = dirtyDocument.getText();
        assert.strictEqual(newFormattedText, expectedFormattedText);
      }
      catch (error) {
        console.error("Error during testing", error);
      }
    });
  });
  suite("Formatting commented Text", function () {
    const formattingTests = [{
      unformattedText: "    //code here",
      expectedFormattedText: "//code here",
      name: "Single Line Comment with leading spaces should remove leading spaces"
    }, {
      unformattedText: "    string_input test; //code here",
      expectedFormattedText: "string_input test; //code here",
      name: "Single Line Comment with text before should be remove leading spaces"
    }, {
      unformattedText: "//code here",
      expectedFormattedText: "//code here",
      name: "Single Line Comment with no spaces should be left alone"
    }, {
      unformattedText: "    /*code here\r\ntext\r  text\r\n  */",
      expectedFormattedText: "/*code here\r\ntext\r\n  text\r\n  */",
      name: "Multi Line Comment with spaces should trim first line spaces"
    }];
    formattingTests.forEach(function (textToFormat) {
      test(textToFormat.name, async () => {
        await OpenAndShowSPlusDocument(textToFormat.unformattedText);
        await vscode.commands.executeCommand('editor.action.formatDocument');
        const newFormattedText =   vscode.window.activeTextEditor?.document.getText();
        assert.strictEqual(newFormattedText, textToFormat.expectedFormattedText);
      });
    });
  });
  suite("Formatting Input Output Directives", function () {
    const directiveTests = [{
      directive: "digital_input"
    }, {
      directive: "analog_input"
    }, {
      directive: "string_input"
    }, {
      directive: "buffer_input"
    }, {
      directive: "digital_output"
    }, {
      directive: "analog_output"
    }, {
      directive: "string_output"
    }];
    directiveTests.forEach(function (unformattedText) {
      test(`${unformattedText.directive} one line with start spaces, trims spaces`, async () => {
        await OpenAndShowSPlusDocument(`   ${unformattedText.directive} variable1, variable2;`);
        await vscode.commands.executeCommand('editor.action.formatDocument');
        const newFormattedText = vscode.window.activeTextEditor?.document.getText();
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        assert.strictEqual(newFormattedText, `${unformattedText.directive} variable1, variable2;`);
      });
      test(`${unformattedText.directive} multiple line with start spaces, trims spaces, tabs other lines`, async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "splus-source",
          content: `   ${unformattedText.directive} variable1,\r\n  variable2;`,
        });
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('editor.action.formatDocument');
        const newFormattedText = document.getText();
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        assert.strictEqual(newFormattedText, `${unformattedText.directive} variable1,\r\n\t\t\t\tvariable2;`);
      });
    });
  });
});

suite("AutoDiscovered Tasks", function () {
  suiteTeardown(async function () {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });
  suite("With No Saved File", function () {
    test("It should return 0 tasks", async () => {
      const document = await vscode.workspace.openTextDocument({
        language: "splus-source",
        content: "\/\/Nothing To See",
      });
      await vscode.window.showTextDocument(document);
      const splusTasks = await vscode.tasks.fetchTasks();
      assert.strictEqual(splusTasks.length, 0);
    });
  });
  suite("With Faked Saved File", function () {
    suiteSetup(function () {
      sinon.stub(vscode.workspace, "getWorkspaceFolder").callsFake(() => {
        const fakeUri = vscode.Uri.parse("file:///some/folder");
        const fakeWorkspaceFolder = { uri: fakeUri, index: 0, name: "fakeFolder" } as vscode.WorkspaceFolder;
        return fakeWorkspaceFolder;
      });
    });
    suite("With Default Settings", function () {
      test("it should have Compile 3 Series Task only", async () => {
        await OpenAndShowSPlusDocument("\/\/Nothing To See");
        const splusTasks = await vscode.tasks.fetchTasks();
        assert.strictEqual(splusTasks.length, 1);
        assert.strictEqual(splusTasks[0].name, "Compile 3 Series");
      });
      const libraries = ["USER", "CRESTRON"];
      const fsExistSyncStub = sinon.stub(fs, "existsSync").returns(true);
      libraries.forEach(function (library) {
        test(`And file with ${library} Library, it should have Compile 3 Series Task only and Generate API`, async () => {
          await OpenAndShowSPlusDocument(`#${library}_SIMPLSHARP_LIBRARY \"My.Test-Library\";`);
          const splusTasks = await vscode.tasks.fetchTasks();
          assert.ok(splusTasks.length > 0, "Should have at least one task");
          assert.ok(fsExistSyncStub.args.find(a => a[0].toString().includes("My.Test-Library.dll")));
          assert.strictEqual(splusTasks[0].name, "Generate API file for My.Test-Library");
          assert.strictEqual(splusTasks[1].name, "Compile 3 Series");
        });
      });
    });
    suite("With Modified Settings", function () {
      suiteSetup(async function () {
        await removeWorkspaceCustomSettings();
        await OpenAndShowSPlusDocument("\/\/Nothing To See");
      });
      suiteTeardown(async function () {
        await removeWorkspaceCustomSettings();
      });
      const settingsToTest = [{
        enable2series: false,
        enable3series: false,
        enable4series: false,
        responses: []
      },
      {
        enable2series: true,
        enable3series: false,
        enable4series: false,
        responses: ["Compile 2 Series"]
      },
      {
        enable2series: false,
        enable3series: true,
        enable4series: false,
        responses: ["Compile 3 Series"]
      },
      {
        enable2series: true,
        enable3series: true,
        enable4series: false,
        responses: ["Compile 2 Series", "Compile 2 & 3 Series", "Compile 3 Series"]
      },
      {
        enable2series: false,
        enable3series: false,
        enable4series: true,
        responses: ["Compile 4 Series"]
      },
      {
        enable2series: true,
        enable3series: false,
        enable4series: true,
        responses: ["Compile 2 Series", "Compile 4 Series"]
      },
      {
        enable2series: false,
        enable3series: true,
        enable4series: true,
        responses: ["Compile 3 Series", "Compile 3 & 4 Series", "Compile 4 Series"]
      },
      {
        enable2series: true,
        enable3series: true,
        enable4series: true,
        responses: ["Compile 2 Series", "Compile 2 & 3 Series", "Compile 3 Series", "Compile 3 & 4 Series", "Compile 4 Series", "Compile 2 & 3 & 4 Series"]
      }];
      settingsToTest.forEach(function (setting) {
        test(`Series 2: ${setting.enable2series}, Series 3: ${setting.enable3series}, Series 4: ${setting.enable4series} it should have ${setting.responses.length} tasks`, async () => {
          const configurationSplus = vscode.workspace.getConfiguration('splus');
          await configurationSplus.update('enable2series', setting.enable2series);
          await configurationSplus.update('enable3series', setting.enable3series);
          await configurationSplus.update('enable4series', setting.enable4series);
          const splusTasks = await vscode.tasks.fetchTasks();
          assert.ok(splusTasks.length === setting.responses.length);
          let index = 0;
          setting.responses.forEach((response) => {
            assert.strictEqual(splusTasks[index].name, response);
            index++;
          });
        });
      });
    });
  });
});




