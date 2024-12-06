import { provideClassTokens } from "../../apiParser";
import * as sinon from 'sinon';
import * as fsFileReadWrapper from '../../fsReadSyncWrapper';
import * as vscode from 'vscode';
import * as assert from 'assert';

suite("With api Parser", function () {
    let readFileSyncStub: sinon.SinonStub;
    let workspaceFoldersStub: sinon.SinonStub;

    setup(() => {
        readFileSyncStub = sinon.stub(fsFileReadWrapper, 'readFileSyncWrapper');
    });

    teardown(() => {
        readFileSyncStub.restore();
        workspaceFoldersStub.restore();
    });

    test("get classes and tokens", async () => {
        const apiDocumentContent = `
namespace SampleSimplSharpLibrary;
{
     class SampleClass 
    {
        // class delegates
        delegate FUNCTION SampleDelegate ( );
        delegate SIGNED_LONG_INTEGER_FUNCTION IntSampleDelegate ( SIGNED_LONG_INTEGER intParameter );

        // class events
        EventHandler SampleEvent ( SampleClass sender, EventArgs e );
        EventHandler SampleComplexEvent ( SampleClass sender, MyEventArgs e );

        // class functions
        FUNCTION SampleVoidMethod ();
        INTEGER_FUNCTION SampleUshortMethod ( INTEGER ushortParameter , SampleStructure clientStructureParam , SampleSubClass clientClassParam );

        // class variables
        SIGNED_LONG_INTEGER intSampleField;
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
        readFileSyncStub.returns(apiDocumentContent);

        const apiMembers = provideClassTokens();

        sinon.assert.calledOnce(readFileSyncStub);
        sinon.assert.calledWith(readFileSyncStub, sinon.match(/SampleSimplSharpLibrary\.api$/));
        assert.strictEqual(apiMembers.length, 2);
        assert.strictEqual(apiMembers[0].name, "SampleClass");
        assert.strictEqual(apiMembers[0].type, "class");

        assert.strictEqual(apiMembers[0].delegates.length, 2);
        assert.strictEqual(apiMembers[0].delegates[0].name, "SampleDelegate");
        assert.strictEqual(apiMembers[0].delegates[0].type, "delegate");
        assert.strictEqual(apiMembers[0].delegates[0].parameters, " ");
        assert.strictEqual(apiMembers[0].delegates[0].returnType, "FUNCTION");
        assert.strictEqual(apiMembers[0].delegates[1].name, "IntSampleDelegate");
        assert.strictEqual(apiMembers[0].delegates[1].type, "delegate");
        assert.strictEqual(apiMembers[0].delegates[1].parameters, " SIGNED_LONG_INTEGER intParameter ");
        assert.strictEqual(apiMembers[0].delegates[1].returnType, "SIGNED_LONG_INTEGER_FUNCTION");

        assert.strictEqual(apiMembers[0].events.length, 2);
        assert.strictEqual(apiMembers[0].events[0].name, "SampleEvent");
        assert.strictEqual(apiMembers[0].events[0].type, "event");
        assert.strictEqual(apiMembers[0].events[0].parameters, " SampleClass sender, EventArgs e ");
        assert.strictEqual(apiMembers[0].events[1].name, "SampleComplexEvent");
        assert.strictEqual(apiMembers[0].events[1].type, "event");
        assert.strictEqual(apiMembers[0].events[1].parameters, " SampleClass sender, MyEventArgs e ");

        assert.strictEqual(apiMembers[0].functions.length, 2);
        assert.strictEqual(apiMembers[0].functions[0].name, "SampleVoidMethod");
        assert.strictEqual(apiMembers[0].functions[0].type, "function");
        assert.strictEqual(apiMembers[0].functions[0].parameters, "");
        assert.strictEqual(apiMembers[0].functions[0].returnType, "FUNCTION");
        assert.strictEqual(apiMembers[0].functions[1].name, "SampleUshortMethod");
        assert.strictEqual(apiMembers[0].functions[1].type, "function");
        assert.strictEqual(apiMembers[0].functions[1].parameters, " INTEGER ushortParameter , SampleStructure clientStructureParam , SampleSubClass clientClassParam ");
        assert.strictEqual(apiMembers[0].functions[1].returnType, "INTEGER_FUNCTION");

        assert.strictEqual(apiMembers[0].variables.length, 2);
        assert.strictEqual(apiMembers[0].variables[0].name, "intSampleField");
        assert.strictEqual(apiMembers[0].variables[0].type, "variable");
        assert.strictEqual(apiMembers[0].variables[0].dataType, "SIGNED_LONG_INTEGER");
        assert.strictEqual(apiMembers[0].variables[1].name, "stringSampleField[]");
        assert.strictEqual(apiMembers[0].variables[1].type, "variable");
        assert.strictEqual(apiMembers[0].variables[1].dataType, "STRING");

        assert.strictEqual(apiMembers[0].properties.length, 1);
        assert.strictEqual(apiMembers[0].properties[0].name, "SampleSampleSubClass");
        assert.strictEqual(apiMembers[0].properties[0].type, "property");
        assert.strictEqual(apiMembers[0].properties[0].dataType, "SampleSubClass");

        assert.strictEqual(apiMembers[0].delegateProperties.length, 1);
        assert.strictEqual(apiMembers[0].delegateProperties[0].name, "SampleDelegateProperty");
        assert.strictEqual(apiMembers[0].delegateProperties[0].type, "delegateProperty");
        assert.strictEqual(apiMembers[0].delegateProperties[0].dataType, "SampleDelegate");

        assert.strictEqual(apiMembers[1].name, "MyEventArgs");

        assert.strictEqual(apiMembers[1].delegates.length, 0);
        assert.strictEqual(apiMembers[1].events.length, 0);
        assert.strictEqual(apiMembers[1].functions.length, 2);
        assert.strictEqual(apiMembers[1].functions[0].name, "GetHashCode");
        assert.strictEqual(apiMembers[1].functions[0].type, "function");
        assert.strictEqual(apiMembers[1].functions[0].parameters, "");
        assert.strictEqual(apiMembers[1].functions[0].returnType, "SIGNED_LONG_INTEGER_FUNCTION");
        assert.strictEqual(apiMembers[1].functions[1].name, "ToString");
        assert.strictEqual(apiMembers[1].functions[1].type, "function");
        assert.strictEqual(apiMembers[1].functions[1].parameters, "");
        assert.strictEqual(apiMembers[1].functions[1].returnType, "STRING_FUNCTION");
        assert.strictEqual(apiMembers[1].variables.length, 0);
        assert.strictEqual(apiMembers[1].properties.length, 1);
        assert.strictEqual(apiMembers[1].properties[0].name, "EventInt");
        assert.strictEqual(apiMembers[1].properties[0].type, "property");
        assert.strictEqual(apiMembers[1].properties[0].dataType, "SIGNED_LONG_INTEGER");
        assert.strictEqual(apiMembers[1].delegateProperties.length, 0);
    });
});