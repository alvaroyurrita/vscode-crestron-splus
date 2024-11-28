import * as assert from 'assert';
import * as sinon from 'sinon';
import { TextDocument, Uri } from 'vscode';
import { SimplPlusActiveDocuments } from '../../simpl-plus-document-targets';
import { BuildType } from '../../build-type';
import * as fsExistsWrapper from '../../fsExistsSyncWrapper';
import * as fsFileReadWrapper from '../../fsReadSyncWrapper';

suite('SimplPlusActiveDocuments', () => {
    let simplPlusActiveDocuments: SimplPlusActiveDocuments;
    let mockDocument: TextDocument;

    setup(() => {
        simplPlusActiveDocuments = new SimplPlusActiveDocuments();
        mockDocument = {
            uri: Uri.file('test.usp'),
            languageId: 'simpl-plus',
            isUntitled: false,
            version: 1,
            getText: sinon.stub(),
            lineCount: 1,
            lineAt: sinon.stub(),
            offsetAt: sinon.stub(),
            positionAt: sinon.stub(),
            save: sinon.stub(),
            eol: 1,
            isDirty: false,
            isClosed: false,
            fileName: 'test.usp'
        } as unknown as TextDocument;
    });

    teardown(() => {
        sinon.restore();
    });

    test('should return global values BuildType.Series3 and 4 for a new document', () => {
        const buildType = simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
        assert.strictEqual(buildType, BuildType.Series3 | BuildType.Series4);
    });



    test('should return global values BuildType.Series3 and 4 for an untitled', () => {
        mockDocument = {
            uri: Uri.file('test.usp'),
            languageId: 'simpl-plus',
            isUntitled: true,
            version: 1,
            getText: sinon.stub(),
            lineCount: 1,
            lineAt: sinon.stub(),
            offsetAt: sinon.stub(),
            positionAt: sinon.stub(),
            save: sinon.stub(),
            eol: 1,
            isDirty: false,
            isClosed: false,
            fileName: 'test.usp'
        } as unknown as TextDocument;
        const buildType = simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
        assert.strictEqual(buildType, BuildType.Series3 | BuildType.Series4);
    });

    test('should add a new document to SimpPlusDocuments', () => {
        simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
        assert.strictEqual(simplPlusActiveDocuments['SimpPlusDocuments'].length, 1);
    });

    test('should remove a document from SimpPlusDocuments', () => {
        simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
        simplPlusActiveDocuments.RemoveSimpPlusDocument(mockDocument);
        assert.strictEqual(simplPlusActiveDocuments['SimpPlusDocuments'].length, 0);
    });

    test('should update targets for an existing document', () => {
        simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
        const updatedBuildType = simplPlusActiveDocuments.UpdateSimpPlusDocumentTargets(mockDocument);
        assert.strictEqual(updatedBuildType, BuildType.Series3 | BuildType.Series4);
    });

    test('should return undefined when updating targets for a non-existing document', () => {
        const updatedBuildType = simplPlusActiveDocuments.UpdateSimpPlusDocumentTargets(mockDocument);
        assert.strictEqual(updatedBuildType, undefined);
    });
});

suite('with existing document with ush contents', function ()  {
    let simplPlusActiveDocuments: SimplPlusActiveDocuments;
    let mockDocument: TextDocument;
    const t = "t";
    const targetsToTest = [
        {
            input: "Inclusions_CDS=5",
            expected: 1
        },
        {
            input: "Inclusions_CDS=6",
            expected: 2
        },
        {
            input: "Inclusions_CDS=7",
            expected: 4
        },
        {
            input: "Inclusions_CDS=5,6",
            expected: 1|2
        },
        {
            input: "Inclusions_CDS=5,7",
            expected: 1|4
        },
        {
            input: "Inclusions_CDS=6,7",
            expected: 2|4
        },
        {
            input: "Inclusions_CDS=5,6,7",
            expected: 1|2|4
        }
    ];
    setup(() => {
        simplPlusActiveDocuments = new SimplPlusActiveDocuments();
        mockDocument = {
            uri: Uri.file('test.usp'),
            languageId: 'simpl-plus',
            isUntitled: false,
            version: 1,
            getText: sinon.stub(),
            lineCount: 1,
            lineAt: sinon.stub(),
            offsetAt: sinon.stub(),
            positionAt: sinon.stub(),
            save: sinon.stub(),
            eol: 1,
            isDirty: false,
            isClosed: false,
            fileName: 'test.usp'
        } as unknown as TextDocument;
    });
    teardown(() => {
        sinon.restore();
    });

    targetsToTest.forEach(function (target) {
        test(`should return ${target.expected} for an existing document with ush contents ${target.input}`, function () {
            const fsExistSyncStub = sinon.stub(fsExistsWrapper, "existsSyncWrapper").returns(true);
            const fakeReadFile = sinon.stub(fsFileReadWrapper, 'readFileSyncWrapper').callsFake((test) => {
                console.log(test);
                return target.input;
            });
            const buildType = simplPlusActiveDocuments.GetDocumentBuiltType(mockDocument);
            fakeReadFile.restore();
            fsExistSyncStub.restore();
            assert.strictEqual(buildType, target.expected);
        });
    });
});