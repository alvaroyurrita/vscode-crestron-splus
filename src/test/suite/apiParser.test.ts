import { ApiParser } from "../../helpers/apiParser";
import * as vscode from 'vscode';
import * as assert from 'assert';
import { SimplPlusObject } from "../../base/simplPlusObject";

suite("With api Parser", function () {
    let apiMembers: SimplPlusObject[];
    const uri = "file:///c%3A/ExtensionDevelopment/SimplPlusExtension/vscode-crestron-splus/testWorkspace/apiParserTestFile.api";
    suiteSetup(async function (){
        const workSpaceDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        const apiFile = workSpaceDir + "\\apiParserTestFile.api";

        apiMembers = await ApiParser(apiFile);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test("test root class", async () => {
        assert.strictEqual(apiMembers.length, 2);
        assert.strictEqual(apiMembers[0].name, "SampleClass");
        assert.strictEqual(apiMembers[0].kind, vscode.CompletionItemKind.Class);
        assert.strictEqual(apiMembers[0].dataType, "class");
        assert.strictEqual(apiMembers[0].uri, uri);
        assert.strictEqual(apiMembers[0].nameRange.start.line, 3);
        assert.strictEqual(apiMembers[0].nameRange.start.character, 11);
        assert.strictEqual(apiMembers[0].nameRange.end.line, 3);
        assert.strictEqual(apiMembers[0].nameRange.end.character, 22);
        assert.strictEqual(apiMembers[0].blockRange.start.line, 4);
        assert.strictEqual(apiMembers[0].blockRange.start.character, 5);
        assert.strictEqual(apiMembers[0].blockRange.end.line, 20);
        assert.strictEqual(apiMembers[0].blockRange.end.character, 4);

        assert.strictEqual(apiMembers[0].children.length, 6);
    });
    test("test class events", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[0].name, "SampleComplexEvent");
        assert.strictEqual(apiMembers[0].children[0].kind, vscode.CompletionItemKind.Event);
        assert.strictEqual(apiMembers[0].children[0].dataType, "void");
        assert.strictEqual(apiMembers[0].children[0].dataTypeModifier, "EventHandler");
        assert.strictEqual(apiMembers[0].children[0].parent, parent);
        assert.strictEqual(apiMembers[0].children[0].uri, uri);
        assert.strictEqual(apiMembers[0].children[0].nameRange.start.line, 9);
        assert.strictEqual(apiMembers[0].children[0].nameRange.start.character, 21);
        assert.strictEqual(apiMembers[0].children[0].nameRange.end.line, 9);
        assert.strictEqual(apiMembers[0].children[0].nameRange.end.character, 39);
        assert.strictEqual(apiMembers[0].children[0].children.length, 2);
        assert.strictEqual(apiMembers[0].children[0].children[0].name, "sender");
        assert.strictEqual(apiMembers[0].children[0].children[0].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[0].children[0].dataType, "SampleClass");
        assert.strictEqual(apiMembers[0].children[0].children[0].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[0].children[0].parent, apiMembers[0].children[0]);
        assert.strictEqual(apiMembers[0].children[0].children[0].uri, uri);
        assert.strictEqual(apiMembers[0].children[0].children[0].nameRange.start.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].nameRange.start.character, 54);
        assert.strictEqual(apiMembers[0].children[0].children[0].nameRange.end.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].nameRange.end.character, 60);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.start.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.start.character, 40);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.end.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.end.character, 77);
        assert.strictEqual(apiMembers[0].children[0].children[1].name, "e");
        assert.strictEqual(apiMembers[0].children[0].children[1].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[0].children[1].dataType, "MyEventArgs");
        assert.strictEqual(apiMembers[0].children[0].children[1].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[0].children[1].parent, apiMembers[0].children[0]);
        assert.strictEqual(apiMembers[0].children[0].children[1].uri, uri);
        assert.strictEqual(apiMembers[0].children[0].children[1].nameRange.start.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[1].nameRange.start.character, 62);
        assert.strictEqual(apiMembers[0].children[0].children[1].nameRange.end.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[1].nameRange.end.character, 73);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.start.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.start.character, 40);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.end.line, 9);
        assert.strictEqual(apiMembers[0].children[0].children[0].blockRange.end.character, 77);
    });
    test("test class delegate", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[1].name, "IntSampleDelegate");
        assert.strictEqual(apiMembers[0].children[1].kind, vscode.CompletionItemKind.Class);
        assert.strictEqual(apiMembers[0].children[1].dataType, "SIGNED_LONG_INTEGER_FUNCTION");
        assert.strictEqual(apiMembers[0].children[1].dataTypeModifier, "delegate");
        assert.strictEqual(apiMembers[0].children[1].parent, parent);
        assert.strictEqual(apiMembers[0].children[1].uri, uri);
        assert.strictEqual(apiMembers[0].children[1].nameRange.start.line, 6);
        assert.strictEqual(apiMembers[0].children[1].nameRange.start.character, 46);
        assert.strictEqual(apiMembers[0].children[1].nameRange.end.line, 6);
        assert.strictEqual(apiMembers[0].children[1].nameRange.end.character, 63);
        assert.strictEqual(apiMembers[0].children[1].children.length, 2);
        assert.strictEqual(apiMembers[0].children[1].children[0].name, "intParameter");
        assert.strictEqual(apiMembers[0].children[1].children[0].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[1].children[0].dataType, "SIGNED_LONG_INTEGER");
        assert.strictEqual(apiMembers[0].children[1].children[0].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[1].children[0].parent, apiMembers[0].children[1]);
        assert.strictEqual(apiMembers[0].children[1].children[0].uri, uri);
        assert.strictEqual(apiMembers[0].children[1].children[0].nameRange.start.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[0].nameRange.start.character, 86);
        assert.strictEqual(apiMembers[0].children[1].children[0].nameRange.end.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[0].nameRange.end.character, 98);
        assert.strictEqual(apiMembers[0].children[1].children[0].blockRange.start.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[0].blockRange.start.character, 64);
        assert.strictEqual(apiMembers[0].children[1].children[0].blockRange.end.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[0].blockRange.end.character, 132);
        assert.strictEqual(apiMembers[0].children[1].children[1].name, "uShortIntegerParameter");
        assert.strictEqual(apiMembers[0].children[1].children[1].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[1].children[1].dataType, "INTEGER");
        assert.strictEqual(apiMembers[0].children[1].children[1].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[1].children[1].parent, apiMembers[0].children[1]);
        assert.strictEqual(apiMembers[0].children[1].children[1].uri, uri);
        assert.strictEqual(apiMembers[0].children[1].children[1].nameRange.start.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[1].nameRange.start.character, 108);
        assert.strictEqual(apiMembers[0].children[1].children[1].nameRange.end.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[1].nameRange.end.character, 130);
        assert.strictEqual(apiMembers[0].children[1].children[1].blockRange.start.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[1].blockRange.start.character, 64);
        assert.strictEqual(apiMembers[0].children[1].children[1].blockRange.end.line, 6);
        assert.strictEqual(apiMembers[0].children[1].children[1].blockRange.end.character, 132);
    });
    test("test class function", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[2].dataType, "INTEGER_FUNCTION");
        assert.strictEqual(apiMembers[0].children[2].name, "SampleUshortMethod");
        assert.strictEqual(apiMembers[0].children[2].kind, vscode.CompletionItemKind.Function);
        assert.strictEqual(apiMembers[0].children[2].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[2].parent, parent);
        assert.strictEqual(apiMembers[0].children[2].uri, uri);
        assert.strictEqual(apiMembers[0].children[2].nameRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].nameRange.start.character, 25);
        assert.strictEqual(apiMembers[0].children[2].nameRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].nameRange.end.character, 43);
        assert.strictEqual(apiMembers[0].children[2].children.length, 3);
        assert.strictEqual(apiMembers[0].children[2].children[0].name, "ushortParameter");
        assert.strictEqual(apiMembers[0].children[2].children[0].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[2].children[0].dataType, "INTEGER");
        assert.strictEqual(apiMembers[0].children[2].children[0].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[2].children[0].parent, apiMembers[0].children[2]);
        assert.strictEqual(apiMembers[0].children[2].children[0].uri, uri);
        assert.strictEqual(apiMembers[0].children[2].children[0].nameRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[0].nameRange.start.character, 54);
        assert.strictEqual(apiMembers[0].children[2].children[0].nameRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[0].nameRange.end.character, 69);
        assert.strictEqual(apiMembers[0].children[2].children[0].blockRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[0].blockRange.start.character, 44);
        assert.strictEqual(apiMembers[0].children[2].children[0].blockRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[0].blockRange.end.character, 144);
        assert.strictEqual(apiMembers[0].children[2].children[1].name, "clientStructureParam");
        assert.strictEqual(apiMembers[0].children[2].children[1].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[2].children[1].dataType, "SampleStructure");
        assert.strictEqual(apiMembers[0].children[2].children[1].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[2].children[1].parent, apiMembers[0].children[2]);
        assert.strictEqual(apiMembers[0].children[2].children[1].uri, uri);
        assert.strictEqual(apiMembers[0].children[2].children[1].nameRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[1].nameRange.start.character, 88);
        assert.strictEqual(apiMembers[0].children[2].children[1].nameRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[1].nameRange.end.character, 108);
        assert.strictEqual(apiMembers[0].children[2].children[1].blockRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[1].blockRange.start.character, 44);
        assert.strictEqual(apiMembers[0].children[2].children[1].blockRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[1].blockRange.end.character, 144);
        assert.strictEqual(apiMembers[0].children[2].children[2].name, "clientClassParam");
        assert.strictEqual(apiMembers[0].children[2].children[2].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(apiMembers[0].children[2].children[2].dataType, "SampleSubClass");
        assert.strictEqual(apiMembers[0].children[2].children[2].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[2].children[2].parent, apiMembers[0].children[2]);
        assert.strictEqual(apiMembers[0].children[2].children[2].uri, uri);
        assert.strictEqual(apiMembers[0].children[2].children[2].nameRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[2].nameRange.start.character, 126);
        assert.strictEqual(apiMembers[0].children[2].children[2].nameRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[2].nameRange.end.character, 142);
        assert.strictEqual(apiMembers[0].children[2].children[2].blockRange.start.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[2].blockRange.start.character, 44);
        assert.strictEqual(apiMembers[0].children[2].children[2].blockRange.end.line, 12);
        assert.strictEqual(apiMembers[0].children[2].children[2].blockRange.end.character, 144);
    });
    test("test class variable", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[3].name, "stringSampleField");
        assert.strictEqual(apiMembers[0].children[3].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(apiMembers[0].children[3].dataType, "STRING");
        assert.strictEqual(apiMembers[0].children[3].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[3].parent, parent);
        assert.strictEqual(apiMembers[0].children[3].uri, uri);
        assert.strictEqual(apiMembers[0].children[3].children.length, 0);
        assert.strictEqual(apiMembers[0].children[3].nameRange.start.line, 15);
        assert.strictEqual(apiMembers[0].children[3].nameRange.start.character, 15);
        assert.strictEqual(apiMembers[0].children[3].nameRange.end.line, 15);
        assert.strictEqual(apiMembers[0].children[3].nameRange.end.character, 32);
    });
    test("test class delegate property", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[4].name, "SampleDelegateProperty");
        assert.strictEqual(apiMembers[0].children[4].kind, vscode.CompletionItemKind.Property);
        assert.strictEqual(apiMembers[0].children[4].dataType, "SampleDelegate");
        assert.strictEqual(apiMembers[0].children[4].nameRange.start.line, 18);
        assert.strictEqual(apiMembers[0].children[4].nameRange.start.character, 40);
        assert.strictEqual(apiMembers[0].children[4].nameRange.end.line, 18);
        assert.strictEqual(apiMembers[0].children[4].nameRange.end.character, 62);
        assert.strictEqual(apiMembers[0].children[4].dataTypeModifier, "DelegateProperty");
        assert.strictEqual(apiMembers[0].children[4].parent, parent);
        assert.strictEqual(apiMembers[0].children[4].uri, uri);
        assert.strictEqual(apiMembers[0].children[4].children.length, 0);
    });
    test("test class property", async () => {
        const parent = apiMembers[0];
        assert.strictEqual(apiMembers[0].children[5].name, "SampleSampleSubClass");
        assert.strictEqual(apiMembers[0].children[5].kind, vscode.CompletionItemKind.Property);
        assert.strictEqual(apiMembers[0].children[5].dataType, "SampleSubClass");
        assert.strictEqual(apiMembers[0].children[5].nameRange.start.line, 19);
        assert.strictEqual(apiMembers[0].children[5].nameRange.start.character, 23);
        assert.strictEqual(apiMembers[0].children[5].nameRange.end.line, 19);
        assert.strictEqual(apiMembers[0].children[5].nameRange.end.character, 43);
        assert.strictEqual(apiMembers[0].children[5].dataTypeModifier, "");
        assert.strictEqual(apiMembers[0].children[5].parent, parent);
        assert.strictEqual(apiMembers[0].children[5].uri, uri);
        assert.strictEqual(apiMembers[0].children[5].children.length, 0);
    });
    test("test enum", async () => {
        assert.strictEqual(apiMembers.length, 2);
        assert.strictEqual(apiMembers[1].name, "SampleEnum");
        assert.strictEqual(apiMembers[1].kind, vscode.CompletionItemKind.Enum);
        assert.strictEqual(apiMembers[1].dataType, "enum");
        assert.strictEqual(apiMembers[1].dataTypeModifier, "");
        assert.strictEqual(apiMembers[1].uri, uri);
        assert.strictEqual(apiMembers[1].nameRange.start.line, 21);
        assert.strictEqual(apiMembers[1].nameRange.start.character, 9);
        assert.strictEqual(apiMembers[1].nameRange.end.line, 21);
        assert.strictEqual(apiMembers[1].nameRange.end.character, 19);
        assert.strictEqual(apiMembers[1].blockRange.start.line, 22);
        assert.strictEqual(apiMembers[1].blockRange.start.character, 5);
        assert.strictEqual(apiMembers[1].blockRange.end.line, 26);
        assert.strictEqual(apiMembers[1].blockRange.end.character, 4);


    });
    test("test enum members", async () => {
        const parent = apiMembers[1];
        assert.strictEqual(apiMembers[1].children[0].name, "SampleEnumValue1");
        assert.strictEqual(apiMembers[1].children[0].kind, vscode.CompletionItemKind.EnumMember);
        assert.strictEqual(apiMembers[1].children[0].dataType, "SampleEnum.SampleEnumValue1");
        assert.strictEqual(apiMembers[1].children[0].nameRange.start.line, 23);
        assert.strictEqual(apiMembers[1].children[0].nameRange.start.character, 8);
        assert.strictEqual(apiMembers[1].children[0].nameRange.end.line, 23);
        assert.strictEqual(apiMembers[1].children[0].nameRange.end.character, 24);
        assert.strictEqual(apiMembers[1].children[0].dataTypeModifier, "");
        assert.strictEqual(apiMembers[1].children[0].parent, parent);
        assert.strictEqual(apiMembers[1].children[0].uri, uri);
        assert.strictEqual(apiMembers[1].children[0].children.length, 0);
    });
});