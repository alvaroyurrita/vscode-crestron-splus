import sinon from "sinon";
import { window, TextDocument, Uri, workspace } from 'vscode';
import { delay, OpenAndShowSPlusDocument, removeWorkspaceCustomSettings } from "../testFunctions";
import assert from "assert";
import * as fsExistsWrapper from '../../fsExistsSyncWrapper';
import * as fsFileReadWrapper from '../../fsReadSyncWrapper';

suite("Status Bar ", () => {
    let mockDocument: TextDocument;
    const statusBarSpy = sinon.spy(window, "createStatusBarItem");
    setup(() => {
        removeWorkspaceCustomSettings();
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
        sinon.resetBehavior();
    });
    test("Should show default build types when opening a new SIMPL Document", async () => {
        await OpenAndShowSPlusDocument("Nothing To See");
        var statusBarItem = statusBarSpy.returnValues[0];
        assert.strictEqual(statusBarItem.text, "Targets: $(target-three)$(target-four)");
        assert.strictEqual(statusBarItem.tooltip, "Click to select SIMPL+ compilation targets");
        assert.strictEqual(statusBarItem.command, "simpl-plus.showQuickPick");
    });
    // couldn't automate opening several documents with different USH contents.  
    // VSCode does not trigger the onDidCloseTextDocument after the second document is opened.
    // the extension is not able to update the status bar with the correct build targets.
    // https://stackoverflow.com/questions/48693666/detect-when-document-is-closed
    test("Should show series 4 when opening document with USH ", async () => {
        const fsExistSyncStub = sinon.stub(fsExistsWrapper, "existsSyncWrapper").returns(true);
        const fakeReadFile = sinon.stub(fsFileReadWrapper, 'readFileSyncWrapper').callsFake((test) => {
            return "Inclusions_CDS=7";
        });
        const currentWorkspace = workspace.workspaceFolders;
        //@ts-ignore
        const dirtyDocumentPath = Uri.joinPath(currentWorkspace[0].uri, "statusBarTest.usp");
        const dirtyDocument = await workspace.openTextDocument(dirtyDocumentPath);
        await window.showTextDocument(dirtyDocument);
        await delay(1000);
        var statusBarItem = statusBarSpy.returnValues[0];
        assert.strictEqual(statusBarItem.text, "Targets: $(target-four)");
        assert.strictEqual(statusBarItem.tooltip, "Click to select SIMPL+ compilation targets");
        assert.strictEqual(statusBarItem.command, "simpl-plus.showQuickPick");
        statusBarSpy.restore();
        fakeReadFile.resetBehavior();
        fsExistSyncStub.resetBehavior();
    });
});