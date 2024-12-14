import * as assert from 'assert';
import * as sinon from "sinon";
import * as fsWrapper from '../../fsExistsSyncWrapper';
import { removeWorkspaceCustomSettings, OpenAndShowSPlusDocument, delay } from '../testFunctions';
import * as vscode from 'vscode';
import { TokenService } from '../../tokenService';


suite("testing tokenization", function () {
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
        const tokenService = TokenService.getInstance(mockExtensionContext);
        const documentMembers = tokenService.getDocumentMembers(vscode.window.activeTextEditor?.document.uri.toString());
        assert.strictEqual(documentMembers?.constants.length, 1);
        assert.strictEqual(documentMembers?.constants[0].name, "MYCONSTANT");
        assert.strictEqual(documentMembers?.constants[0].type, "constant");
        assert.strictEqual(documentMembers?.constants[0].line, 0);
        assert.strictEqual(documentMembers?.constants[0].column,17);
    });
    test("It should have a global variable with a built in type", async () => {
        await OpenAndShowSPlusDocument("BUFFER_INPUT BufferInput1[20];");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const tokenService = TokenService.getInstance(mockExtensionContext);
        const documentMembers = tokenService.getDocumentMembers(vscode.window.activeTextEditor?.document.uri.toString());
        assert.strictEqual(documentMembers?.variables.length, 1);
        assert.strictEqual(documentMembers?.variables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers?.variables[0].type, "variable");
        assert.strictEqual(documentMembers?.variables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers?.variables[0].line, 0);
        assert.strictEqual(documentMembers?.variables[0].column,13);
    });
    test("It should have a global variable with a custom type", async () => {
        await OpenAndShowSPlusDocument("myType myVariableOfType;");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const tokenService = TokenService.getInstance(mockExtensionContext);
        const documentMembers = tokenService.getDocumentMembers(vscode.window.activeTextEditor?.document.uri.toString());
        assert.strictEqual(documentMembers?.variables.length, 1);
        assert.strictEqual(documentMembers?.variables[0].name, "myVariableOfType");
        assert.strictEqual(documentMembers?.variables[0].type, "variable");
        assert.strictEqual(documentMembers?.variables[0].dataType, "myType");
        assert.strictEqual(documentMembers?.variables[0].line, 0);
        assert.strictEqual(documentMembers?.variables[0].column,7);
    });
    test("It should have a structure with an inside variable", async () => {
        await OpenAndShowSPlusDocument("STRUCTURE testStructure\n{\nBUFFER_INPUT BufferInput1[20];\n};");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const tokenService = TokenService.getInstance(mockExtensionContext);
        const documentMembers = tokenService.getDocumentMembers(vscode.window.activeTextEditor?.document.uri.toString());
        assert.strictEqual(documentMembers?.structures.length, 1);
        assert.strictEqual(documentMembers?.structures[0].name, "testStructure");
        assert.strictEqual(documentMembers?.structures[0].type, "struct");
        assert.strictEqual(documentMembers?.structures[0].line, 0);
        assert.strictEqual(documentMembers?.structures[0].column,10);

        assert.strictEqual(documentMembers?.structures[0].variables.length, 1);
        assert.strictEqual(documentMembers?.structures[0].variables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers?.structures[0].variables[0].type, "variable");
        assert.strictEqual(documentMembers?.structures[0].variables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers?.structures[0].variables[0].line, 2);
        assert.strictEqual(documentMembers?.structures[0].variables[0].column,13);
    });
    test("It should have a function with an inside variable and one parameter", async () => {
        await OpenAndShowSPlusDocument("INTEGER_FUNCTION testFunction(integer testParam)\n{\nBUFFER_INPUT BufferInput1[20];\n};");
        await delay(500);
        const mockExtensionContext = (global as any).testExtensionContext;
        const tokenService = TokenService.getInstance(mockExtensionContext);
        const documentMembers = tokenService.getDocumentMembers(vscode.window.activeTextEditor?.document.uri.toString());
        assert.strictEqual(documentMembers?.functions.length, 1);
        assert.strictEqual(documentMembers?.functions[0].name, "testFunction");
        assert.strictEqual(documentMembers?.functions[0].type, "function");
        assert.strictEqual(documentMembers?.functions[0].line, 0);
        assert.strictEqual(documentMembers?.functions[0].column,17);

        assert.strictEqual(documentMembers?.functions[0].parameters.length, 1);
        assert.strictEqual(documentMembers?.functions[0].parameters[0].name, "testParam");
        assert.strictEqual(documentMembers?.functions[0].parameters[0].type, "variable");
        assert.strictEqual(documentMembers?.functions[0].parameters[0].dataType, "integer");
        assert.strictEqual(documentMembers?.functions[0].parameters[0].line, 0);
        assert.strictEqual(documentMembers?.functions[0].parameters[0].column,38);

        assert.strictEqual(documentMembers?.functions[0].variables.length, 1);
        assert.strictEqual(documentMembers?.functions[0].variables[0].name, "BufferInput1");
        assert.strictEqual(documentMembers?.functions[0].variables[0].type, "variable");
        assert.strictEqual(documentMembers?.functions[0].variables[0].dataType, "BUFFER_INPUT");
        assert.strictEqual(documentMembers?.functions[0].variables[0].line, 2);
        assert.strictEqual(documentMembers?.functions[0].variables[0].column,13);
    });
});