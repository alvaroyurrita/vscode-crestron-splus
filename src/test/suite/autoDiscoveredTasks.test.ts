import * as assert from 'assert';
import * as sinon from "sinon";
import * as fsWrapper from '../../fsExistsSyncWrapper';
import { removeWorkspaceCustomSettings, OpenAndShowSPlusDocument, delay } from '../testFunctions';
import * as vscode from 'vscode';

suiteTeardown(async function () {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
});
suite("With No Saved File", function () {
    test("It should return 0 tasks", async () => {
        await OpenAndShowSPlusDocument("\/\/Nothing To See");
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
        test("It should have Compile 3 Series and 4 Task", async () => {
            await OpenAndShowSPlusDocument("\/\/Nothing To See");
            const splusTasks = await vscode.tasks.fetchTasks();
            console.log("--------->",splusTasks[0].name);
            assert.strictEqual(splusTasks.length, 3);
            assert.strictEqual(splusTasks[0].name, "Compile 3 & 4 Series");
            assert.strictEqual(splusTasks[1].name, "Compile 3 Series");
            assert.strictEqual(splusTasks[2].name, "Compile 4 Series");
        });
        const libraries = ["USER", "CRESTRON"];
        libraries.forEach(function (library) {
            test(`And file with ${library} Library, it should have Compile 3 Series and 4 and Generate API`, async () => {
                const fsExistSyncStub = sinon.stub(fsWrapper, "existsSyncWrapper").returns(true);
                await OpenAndShowSPlusDocument(`#${library}_SIMPLSHARP_LIBRARY \"My.Test-Library\";`);
                const splusTasks = await vscode.tasks.fetchTasks();
                assert.ok(splusTasks.length > 0, "Should have at least one task");
                assert.ok(fsExistSyncStub.args.find(a => a[0].toString().includes("My.Test-Library.clz")));
                assert.strictEqual(splusTasks[0].name, "Generate API file for My.Test-Library");
                assert.strictEqual(splusTasks[1].name, "Compile 3 & 4 Series");
                assert.strictEqual(splusTasks[2].name, "Compile 3 Series");
                assert.strictEqual(splusTasks[3].name, "Compile 4 Series");
                fsExistSyncStub.restore();
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
            responses: [{
                label: "Compile 2 Series",
                parameter: "series2"
            }],
        },
        {
            enable2series: false,
            enable3series: true,
            enable4series: false,
            responses: [{
                label: "Compile 3 Series",
                parameter: "series3"
            }]
        },
        {
            enable2series: true,
            enable3series: true,
            enable4series: false,
            responses: [{
                label: "Compile 2 & 3 Series",
                parameter: "series2 series3"
            },
            {
                label: "Compile 2 Series",
                parameter: "series2"
            },
            {
                label: "Compile 3 Series",
                parameter: "series3"
            }]
        },
        {
            enable2series: false,
            enable3series: false,
            enable4series: true,
            responses: [{
                label: "Compile 4 Series",
                parameter: "series4"
            }]
        },
        {
            enable2series: true,
            enable3series: false,
            enable4series: true,
            responses: [{
                label: "Compile 2 & 4 Series",
                parameter: "series2 series4"
            },
            {
                label: "Compile 2 Series",
                parameter: "series2"
            },
            {
                label: "Compile 4 Series",
                parameter: "series4"
            }],
        },
        {
            enable2series: false,
            enable3series: true,
            enable4series: true,
            responses: [{
                label: "Compile 3 & 4 Series",
                parameter: "series3 series4"
            },
            {
                label: "Compile 3 Series",
                parameter: "series3"
            },
            {
                label: "Compile 4 Series",
                parameter: "series4"
            }]
        },
        {
            enable2series: true,
            enable3series: true,
            enable4series: true,
            responses: [{
                label: "Compile 2 & 3 & 4 Series",
                parameter: "series2 series3 series4"
            },
            {
                label: "Compile 2 Series",
                parameter: "series2"
            },
            {
                label: "Compile 3 Series",
                parameter: "series3"
            },
            {
                label: "Compile 4 Series",
                parameter: "series4"
            }]
        }];
        settingsToTest.forEach(function (setting) {
            test(`Series 2: ${setting.enable2series}, Series 3: ${setting.enable3series}, Series 4: ${setting.enable4series} it should have ${setting.responses.length} tasks`, async () => {
                let label: string[] = [];
                let parameter: string[] = [];

                const configurationSplus = vscode.workspace.getConfiguration('simpl-plus');
                await configurationSplus.update('enable2series', setting.enable2series);
                await configurationSplus.update('enable3series', setting.enable3series);
                await configurationSplus.update('enable4series', setting.enable4series);
                const splusTasks = await vscode.tasks.fetchTasks();
                assert.ok(splusTasks.length === setting.responses.length);
                let index = 0;
                setting.responses.forEach((response) => {
                    assert.strictEqual(splusTasks[index].name, response.label);
                    const compileCommand = `\"C:\\Program Files (x86)\\Crestron\\Simpl\\SPlusCC.exe\" \\rebuild Untitled-1 \\target ${response.parameter}`;
                    assert.ok(splusTasks[index].definition?.id?.includes(compileCommand));
                    index++;
                });
            });
        });
    });
});