import * as assert from 'assert';
import * as sinon from "sinon";
import * as fsWrapper from '../../helpers/fsExistsSyncWrapper';
import { removeWorkspaceCustomSettings, OpenAndShowSPlusDocument, delay } from '../testFunctions';
import * as vscode from 'vscode';
import { DocumentTokenService } from '../../services/documentTokenService';


suite("testing document tokenization", function () {
    suiteSetup(async function () {
        await removeWorkspaceCustomSettings();
    });

    suiteTeardown(async function () {
        await removeWorkspaceCustomSettings();

    });
    test("It should have a constant", async () => {
        await OpenAndShowSPlusDocument("#DEFINE_CONSTANT MYCONSTANT 32");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalConstants.length, 1);
        assert.strictEqual(documentMembers.internalConstants[0].name, "MYCONSTANT");
        assert.strictEqual(documentMembers.internalConstants[0].kind, vscode.CompletionItemKind.Constant);
        assert.strictEqual(documentMembers.internalConstants[0].dataType, "integer");
        assert.strictEqual(documentMembers.internalConstants[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalConstants[0].nameRange.start.character, 17);
        assert.strictEqual(documentMembers.internalConstants[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalConstants[0].nameRange.end.character, 27);
    });
    test("It should have a global variable with a built in type", async () => {
        await OpenAndShowSPlusDocument("BUFFER_INPUT BufferInput1[20];");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalVariables.length, 1);
        assert.strictEqual(documentMembers.internalVariables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers.internalVariables[0].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(documentMembers.internalVariables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.start.character, 13);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.end.character, 25);
    });
    test("It should have a global variable with a custom type", async () => {
        await OpenAndShowSPlusDocument("myType myVariableOfType;");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalVariables.length, 1);
        assert.strictEqual(documentMembers.internalVariables[0].name, "myVariableOfType");
        assert.strictEqual(documentMembers.internalVariables[0].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(documentMembers.internalVariables[0].dataType, "myType");
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.start.character, 7);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalVariables[0].nameRange.end.character, 23);
    });
    test("It should have a structure with an inside variable", async () => {
        await OpenAndShowSPlusDocument("STRUCTURE testStructure\n{\nBUFFER_INPUT BufferInput1[20];\n};");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalStructures.length, 1);
        assert.strictEqual(documentMembers.internalStructures[0].name, "testStructure");
        assert.strictEqual(documentMembers.internalStructures[0].kind, vscode.CompletionItemKind.Struct);
        assert.strictEqual(documentMembers.internalStructures[0].dataType, "testStructure");
        assert.strictEqual(documentMembers.internalStructures[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalStructures[0].nameRange.start.character, 10);
        assert.strictEqual(documentMembers.internalStructures[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalStructures[0].nameRange.end.character, 23);
        assert.strictEqual(documentMembers.internalStructures[0].blockRange.start.line, 1);
        assert.strictEqual(documentMembers.internalStructures[0].blockRange.start.character, 0);
        assert.strictEqual(documentMembers.internalStructures[0].blockRange.end.line, 3);
        assert.strictEqual(documentMembers.internalStructures[0].blockRange.end.character, 1);

        assert.strictEqual(documentMembers.internalStructures[0].internalVariables.length, 1);
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].nameRange.start.line, 2);
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].nameRange.start.character, 13);
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].nameRange.end.line, 2);
        assert.strictEqual(documentMembers.internalStructures[0].internalVariables[0].nameRange.end.character, 25);
    });
    test("It should have a function with an inside variable and one parameter", async () => {
        await OpenAndShowSPlusDocument("INTEGER_FUNCTION testFunction(integer testParam)\n{\nBUFFER_INPUT BufferInput1[20];\n};");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalFunctions.length, 1);
        assert.strictEqual(documentMembers.internalFunctions[0].name, "testFunction");
        assert.strictEqual(documentMembers.internalFunctions[0].kind, vscode.CompletionItemKind.Function);
        assert.strictEqual(documentMembers.internalFunctions[0].dataType, "INTEGER_FUNCTION");
        assert.strictEqual(documentMembers.internalFunctions[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].nameRange.start.character, 17);
        assert.strictEqual(documentMembers.internalFunctions[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].nameRange.end.character, 29);
        assert.strictEqual(documentMembers.internalFunctions[0].blockRange.start.line, 1);
        assert.strictEqual(documentMembers.internalFunctions[0].blockRange.start.character, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].blockRange.end.line, 3);
        assert.strictEqual(documentMembers.internalFunctions[0].blockRange.end.character, 1);
        assert.strictEqual(documentMembers.internalFunctions[0].parameterRange.start.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].parameterRange.start.character, 29);
        assert.strictEqual(documentMembers.internalFunctions[0].parameterRange.end.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].parameterRange.end.character, 48);

        assert.strictEqual(documentMembers.internalFunctions[0].parameters.length, 1);
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].name, "testParam");
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].kind, vscode.CompletionItemKind.TypeParameter);
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].dataType, "integer");
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].nameRange.start.character, 38);
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalFunctions[0].parameters[0].nameRange.end.character, 47);

        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables.length, 1);
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].nameRange.start.line, 2);
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].nameRange.start.character, 13);
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].nameRange.end.line, 2);
        assert.strictEqual(documentMembers.internalFunctions[0].internalVariables[0].nameRange.end.character, 25);
    });

    // test("test that position is inside parameters", async () => {
    //     await OpenAndShowSPlusDocument("INTEGER_FUNCTION testFunction(integer testParam)\n{\nBUFFER_INPUT BufferInput1[20];\n};");
    //     await delay(500);
    //     const mockExtensionContext = (global as any).testExtensionContext;
    //     const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
    //     const position = new vscode.Position(0, 32);
    //     const isInsideParameter = documentTokenService.isAtParameterRange(vscode.window.activeTextEditor?.document.uri, position);
    //     assert.ok(isInsideParameter);
    // });

    // test("test that position is not inside parameters", async () => {
    //     await OpenAndShowSPlusDocument("INTEGER_FUNCTION testFunction(integer testParam)\n{\nBUFFER_INPUT BufferInput1[20];\n};");
    //     await delay(500);
    //     const mockExtensionContext = (global as any).testExtensionContext;
    //     const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
    //     const position = new vscode.Position(2, 2);
    //     const isInsideParameter = documentTokenService.isAtParameterRange(vscode.window.activeTextEditor?.document.uri, position);
    //     assert.ok(!isInsideParameter);
    // });

    
    test("It should have an event with an inside variable", async () => {
        await OpenAndShowSPlusDocument("push DigitalInput1\n{\nBUFFER_INPUT BufferInput1[20];\n};");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
        const documentMembers = documentTokenService.getTokens(vscode.window.activeTextEditor?.document.uri);
        assert.strictEqual(documentMembers.internalEvents.length, 1);
        assert.strictEqual(documentMembers.internalEvents[0].name, "DigitalInput1");
        assert.strictEqual(documentMembers.internalEvents[0].kind, vscode.CompletionItemKind.Event);
        assert.strictEqual(documentMembers.internalEvents[0].dataType, "push");
        assert.strictEqual(documentMembers.internalEvents[0].nameRange.start.line, 0);
        assert.strictEqual(documentMembers.internalEvents[0].nameRange.start.character, 5);
        assert.strictEqual(documentMembers.internalEvents[0].nameRange.end.line, 0);
        assert.strictEqual(documentMembers.internalEvents[0].nameRange.end.character, 18);
        assert.strictEqual(documentMembers.internalEvents[0].blockRange.start.line, 1);
        assert.strictEqual(documentMembers.internalEvents[0].blockRange.start.character, 0);
        assert.strictEqual(documentMembers.internalEvents[0].blockRange.end.line, 3);
        assert.strictEqual(documentMembers.internalEvents[0].blockRange.end.character, 1);

        assert.strictEqual(documentMembers.internalEvents[0].internalVariables.length, 1);
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].kind, vscode.CompletionItemKind.Variable);
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].nameRange.start.line, 2);
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].nameRange.start.character, 13);
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].nameRange.end.line, 2);
        assert.strictEqual(documentMembers.internalEvents[0].internalVariables[0].nameRange.end.character, 25);
    });
});

// suite("with a position", function () {
//     test("not inside a block, it should return undefined", async () => {
//         await OpenAndShowSPlusDocument("push DigitalInput1\n{\nBUFFER_INPUT BufferInput1[20];\n};");
//         await delay(500);
//         const mockExtensionContext = (global as any).testExtensionContext;
//         const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
//         const uri = vscode.window.activeTextEditor?.document.uri;
//         const position = new vscode.Position(0, 0);
//         const token = documentTokenService.getBlockStatementTokenAtPosition(uri, position);
//         assert.strictEqual(token, undefined);
//     });
//     test("inside a block, should return top most token", async () => {
//         await OpenAndShowSPlusDocument("push DigitalInput1\n{\nBUFFER_INPUT BufferInput1[20];\n};");
//         await delay(500);
//         const mockExtensionContext = (global as any).testExtensionContext;
//         const documentTokenService = DocumentTokenService.getInstance(mockExtensionContext);
//         const uri = vscode.window.activeTextEditor?.document.uri;
//         const position = new vscode.Position(2, 5);
//         const token = documentTokenService.getBlockStatementTokenAtPosition(uri, position);
//         assert.strictEqual(token.name, "DigitalInput1");
//     });
// });