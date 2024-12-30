import * as sinon from "sinon";
import { expect } from "chai";
import { ApiTokenService } from "./apiTokenService";
import { ExtensionContext, TextDocument, TextDocumentChangeEvent, Uri, workspace, window, FileSystemWatcher } from "vscode";
import { provideClassTokens } from "../helpers/apiParser";

suite("ApiTokenService", () => {
    let sandbox: sinon.SinonSandbox;
    let context: ExtensionContext;
    let document: TextDocument;
    let uri: Uri;
    let watcher: FileSystemWatcher;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        context = { subscriptions: [] } as unknown as ExtensionContext;
        document = { languageId: "simpl-plus", uri: { fsPath: "path/to/document" } } as unknown as TextDocument;
        uri = { fsPath: "path/to/document" } as unknown as Uri;
        watcher = { dispose: sandbox.stub() } as unknown as FileSystemWatcher;

        sandbox.stub(workspace, "onDidOpenTextDocument").returns({ dispose: sandbox.stub() });
        sandbox.stub(workspace, "onDidChangeTextDocument").returns({ dispose: sandbox.stub() });
        sandbox.stub(workspace, "onDidCloseTextDocument").returns({ dispose: sandbox.stub() });
        sandbox.stub(workspace, "createFileSystemWatcher").returns(watcher);
        sandbox.stub(window, "activeTextEditor").value({ document });
        sandbox.stub(provideClassTokens, "provideClassTokens").resolves([]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    test("should create an instance of ApiTokenService", () => {
        const service = ApiTokenService.getInstance(context);
        expect(service).to.be.instanceOf(ApiTokenService);
    });

    test("should tokenize document on open", async () => {
        const service = ApiTokenService.getInstance(context);
        const tokenizeStub = sandbox.stub(service as any, "tokenize").resolves();

        await (service as any).updateOnOpenTextDocument(document);

        expect(tokenizeStub.calledOnceWith(document)).to.be.true;
    });

    test("should tokenize document on change", async () => {
        const service = ApiTokenService.getInstance(context);
        const tokenizeStub = sandbox.stub(service as any, "tokenize").resolves();
        const changeEvent = { document } as TextDocumentChangeEvent;

        await (service as any).updateOnDidChangeTextDocument(changeEvent);

        expect(tokenizeStub.calledOnceWith(document)).to.be.true;
    });

    test("should clear watchers and apis on dispose", () => {
        const service = ApiTokenService.getInstance(context);
        service.dispose();

        expect(service["_apis"].size).to.equal(0);
        expect(service["_watchers"].size).to.equal(0);
    });

    test("should create a file system watcher if not exists", async () => {
        const service = ApiTokenService.getInstance(context);
        const tokenizeStub = sandbox.stub(service as any, "tokenize").resolves();
        const documentWithLibrary = { ...document, getText: () => '#USER_SIMPLSHARP_LIBRARY "Library"' } as TextDocument;

        await (service as any).tokenize(documentWithLibrary);

        expect(workspace.createFileSystemWatcher.calledOnce).to.be.true;
        expect(service["_watchers"].size).to.equal(1);
    });

    test("should delete library tokens on file delete", () => {
        const service = ApiTokenService.getInstance(context);
        service["_apis"].set(uri.fsPath, []);

        (service as any).deleteLibrary(uri);

        expect(service["_apis"].has(uri.fsPath)).to.be.false;
    });

    test("should update library tokens on file change", async () => {
        const service = ApiTokenService.getInstance(context);
        const runApiGeneratorStub = sandbox.stub(service as any, "runApiGenerator").resolves();
        const apiTokens = [{ name: "token" }];
        sandbox.stub(provideClassTokens, "provideClassTokens").resolves(apiTokens);

        service["_apis"].set(uri.fsPath, []);
        await (service as any).updateLibrary(uri);

        expect(runApiGeneratorStub.calledOnceWith(uri.fsPath)).to.be.true;
        expect(service["_apis"].get(uri.fsPath)).to.deep.equal(apiTokens);
    });
});