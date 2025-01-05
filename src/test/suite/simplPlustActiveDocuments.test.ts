import * as assert from 'assert';
import * as sinon from 'sinon';
import { TextDocument, Uri, workspace } from 'vscode';
import { SimplPlusActiveDocuments } from '../../simplPlusActiveDocuments';
import { BuildType } from '../../base/build-type';
import * as fsExistsWrapper from '../../helpers/fsExistsSyncWrapper';
import * as fsFileReadWrapper from '../../helpers/fsReadSyncWrapper';
import { removeWorkspaceCustomSettings, } from '../testFunctions';



suite('SimplPlusActiveDocuments', () => {
    let simplPlusActiveDocuments: SimplPlusActiveDocuments;
    let mockDocument: TextDocument;

    setup(() => {
        removeWorkspaceCustomSettings();
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
        const buildType = simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
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
        const buildType = simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
        assert.strictEqual(buildType, BuildType.Series3 | BuildType.Series4);
    });

    test('should add a new document to SimpPlusDocuments', () => {
        simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
        assert.strictEqual(simplPlusActiveDocuments['SimpPlusDocuments'].length, 1);
    });

    test('should remove a document from SimpPlusDocuments', () => {
        simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
        simplPlusActiveDocuments.RemoveSimpPlusDocument(mockDocument);
        assert.strictEqual(simplPlusActiveDocuments['SimpPlusDocuments'].length, 0);
    });

    test('should update targets for an existing document', () => {
        simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
        const updatedBuildType = simplPlusActiveDocuments.UpdateSimpPlusDocumentBuildTargets(mockDocument, BuildType.Series3);
        assert.strictEqual(updatedBuildType, BuildType.Series3 );
    });

    test('should return undefined when updating targets for a non-existing document', () => {
        const updatedBuildType = simplPlusActiveDocuments.UpdateSimpPlusDocumentBuildTargets(mockDocument);
        assert.strictEqual(updatedBuildType, undefined);
    });
});

suite('with existing document with ush contents', function ()  {
    let simplPlusActiveDocuments: SimplPlusActiveDocuments;
    let mockDocument: TextDocument;
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
        },
        {
            input: "should return global",
            expected: 2|4
        }
    ];
    setup(() => {
        removeWorkspaceCustomSettings();
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
        test(`should return ${target.expected} for ${target.input}`, function () {
            const fsExistSyncStub = sinon.stub(fsExistsWrapper, "existsSyncWrapper").returns(true);
            const fakeReadFile = sinon.stub(fsFileReadWrapper, 'readFileSyncWrapper').callsFake((test) => {
                return target.input;
            });
            const buildType = simplPlusActiveDocuments.GetSimplPlusDocumentBuildTargets(mockDocument);
            fakeReadFile.restore();
            fsExistSyncStub.restore();
            assert.strictEqual(buildType, target.expected);
        });
    });
});