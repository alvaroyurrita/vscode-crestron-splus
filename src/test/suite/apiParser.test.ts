import { provideClassTokens } from "../../apiParser";
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as assert from 'assert';

suite("With api Parser", function () {
    let openTextDocumentStub: sinon.SinonStub;

    test("get classes and tokens", async () => {
        const apiDocumentContent = `
namespace SampleSimplSharpLibrary;
{
     class SampleClass 
    {
        // class delegates
        delegate SIGNED_LONG_INTEGER_FUNCTION IntSampleDelegate ( SIGNED_LONG_INTEGER intParameter, INTEGER uShortIntegerParameter );

        // class events
        EventHandler SampleComplexEvent ( SampleClass sender, MyEventArgs e );

        // class functions
        INTEGER_FUNCTION SampleUshortMethod ( INTEGER ushortParameter , SampleStructure clientStructureParam , SampleSubClass clientClassParam );

        // class variables
        STRING stringSampleField[];

        // class properties
        DelegateProperty SampleDelegate SampleDelegateProperty;
        SampleSubClass SampleSampleSubClass;
    };
    class MyEventArgs
    {
        // class delegates

        // class events

        // class functions
        SIGNED_LONG_INTEGER_FUNCTION GetHashCode ();
        STRING_FUNCTION ToString ();

        // class variables

        // class properties
        SIGNED_LONG_INTEGER EventInt;
    };
}
`;
        const sampleTextDocument = await vscode.workspace.openTextDocument({ content: apiDocumentContent });
        openTextDocumentStub = sinon.stub(vscode.workspace, 'openTextDocument');
        openTextDocumentStub.returns(sampleTextDocument);

        const apiMembers = await provideClassTokens();
        openTextDocumentStub.restore();
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');


        sinon.assert.calledOnce(openTextDocumentStub);
        sinon.assert.calledWith(openTextDocumentStub, sinon.match(/SampleSimplSharpLibrary\.api$/));
        assert.strictEqual(apiMembers.length, 2);
        assert.strictEqual(apiMembers[0].name, "SampleClass");
        assert.strictEqual(apiMembers[0].type, "class");
        assert.strictEqual(apiMembers[0].dataType, "class");
        assert.strictEqual(apiMembers[0].nameRange.start.line, 3);
        assert.strictEqual(apiMembers[0].nameRange.start.character, 11);
        assert.strictEqual(apiMembers[0].nameRange.end.line, 3);
        assert.strictEqual(apiMembers[0].nameRange.end.character, 22);


        assert.strictEqual(apiMembers[0].internalDelegates.length, 1);
        assert.strictEqual(apiMembers[0].internalDelegates[0].name, "IntSampleDelegate");
        assert.strictEqual(apiMembers[0].internalDelegates[0].type, "delegate");
        assert.strictEqual(apiMembers[0].internalDelegates[0].dataType, "SIGNED_LONG_INTEGER_FUNCTION");
        assert.strictEqual(apiMembers[0].internalDelegates[0].nameRange.start.line, 6);
        assert.strictEqual(apiMembers[0].internalDelegates[0].nameRange.start.character, 46);
        assert.strictEqual(apiMembers[0].internalDelegates[0].nameRange.end.line, 6);
        assert.strictEqual(apiMembers[0].internalDelegates[0].nameRange.end.character, 63);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters.length, 2);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters.length, 2);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].name, "intParameter");
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].type, "variable");
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].dataType, "SIGNED_LONG_INTEGER");
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].nameRange.start.line, 6);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].nameRange.start.character, 86);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].nameRange.end.line, 6);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[0].nameRange.end.character, 98);
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[1].name, "uShortIntegerParameter");
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[1].type, "variable");
        assert.strictEqual(apiMembers[0].internalDelegates[0].parameters[1].dataType, "INTEGER");

        assert.strictEqual(apiMembers[0].internalEvents.length, 1);
        assert.strictEqual(apiMembers[0].internalEvents[0].name, "SampleComplexEvent");
        assert.strictEqual(apiMembers[0].internalEvents[0].type, "event");
        assert.strictEqual(apiMembers[0].internalEvents[0].dataType, "EventHandler");
        assert.strictEqual(apiMembers[0].internalEvents[0].nameRange.start.line, 9);
        assert.strictEqual(apiMembers[0].internalEvents[0].nameRange.start.character, 21);
        assert.strictEqual(apiMembers[0].internalEvents[0].nameRange.end.line, 9);
        assert.strictEqual(apiMembers[0].internalEvents[0].nameRange.end.character, 39);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters.length, 2);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].name, "sender");
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].type, "variable");
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].dataType, "SampleClass");
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].nameRange.start.line, 9);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].nameRange.start.character, 54);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].nameRange.end.line, 9);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[0].nameRange.end.character, 60);
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[1].name, "e");
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[1].type, "variable");
        assert.strictEqual(apiMembers[0].internalEvents[0].parameters[1].dataType, "MyEventArgs");

        assert.strictEqual(apiMembers[0].internalFunctions.length, 1);
        assert.strictEqual(apiMembers[0].internalFunctions[0].dataType,"INTEGER_FUNCTION");
        assert.strictEqual(apiMembers[0].internalFunctions[0].name, "SampleUshortMethod");
        assert.strictEqual(apiMembers[0].internalFunctions[0].type, "function");
        assert.strictEqual(apiMembers[0].internalFunctions[0].nameRange.start.line, 12);
        assert.strictEqual(apiMembers[0].internalFunctions[0].nameRange.start.character, 25);
        assert.strictEqual(apiMembers[0].internalFunctions[0].nameRange.end.line, 12);
        assert.strictEqual(apiMembers[0].internalFunctions[0].nameRange.end.character, 43);
        assert.strictEqual(apiMembers[0].internalFunctions[0].parameters.length, 3);
        assert.strictEqual(apiMembers[0].internalFunctions[0].parameters[0].name, "ushortParameter");
        assert.strictEqual(apiMembers[0].internalFunctions[0].parameters[0].dataType, "INTEGER");
        assert.strictEqual(apiMembers[0].internalFunctions[0].parameters[0].type, "variable");

        assert.strictEqual(apiMembers[0].internalVariables.length, 1);
        assert.strictEqual(apiMembers[0].internalVariables[0].name, "stringSampleField");
        assert.strictEqual(apiMembers[0].internalVariables[0].type, "variable");
        assert.strictEqual(apiMembers[0].internalVariables[0].dataType, "STRING");
        assert.strictEqual(apiMembers[0].internalVariables[0].nameRange.start.line, 15);
        assert.strictEqual(apiMembers[0].internalVariables[0].nameRange.start.character, 15);
        assert.strictEqual(apiMembers[0].internalVariables[0].nameRange.end.line, 15);
        assert.strictEqual(apiMembers[0].internalVariables[0].nameRange.end.character, 32);

        assert.strictEqual(apiMembers[0].internalProperties.length, 1);
        assert.strictEqual(apiMembers[0].internalProperties[0].name, "SampleSampleSubClass");
        assert.strictEqual(apiMembers[0].internalProperties[0].type, "property");
        assert.strictEqual(apiMembers[0].internalProperties[0].dataType, "SampleSubClass");
        assert.strictEqual(apiMembers[0].internalProperties[0].nameRange.start.line, 19);
        assert.strictEqual(apiMembers[0].internalProperties[0].nameRange.start.character, 23);
        assert.strictEqual(apiMembers[0].internalProperties[0].nameRange.end.line, 19);
        assert.strictEqual(apiMembers[0].internalProperties[0].nameRange.end.character, 43);

        assert.strictEqual(apiMembers[0].internalDelegateProperties.length, 1);
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].name, "SampleDelegateProperty");
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].type, "delegateProperty");
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].dataType, "SampleDelegate");
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].nameRange.start.line, 18);
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].nameRange.start.character, 40);
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].nameRange.end.line, 18);
        assert.strictEqual(apiMembers[0].internalDelegateProperties[0].nameRange.end.character, 62);


        assert.strictEqual(apiMembers[1].name, "MyEventArgs");
    });
});