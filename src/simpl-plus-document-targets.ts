import path from "path";
import { BuildType } from "./build-type";
import { existsSyncWrapper } from "./fsExistsSyncWrapper";
import { readFileSyncWrapper } from "./fsReadSyncWrapper";
import { workspace, TextDocument, Uri  } from 'vscode';

class SimplPlusDocumentTargets {
    private _document: TextDocument | undefined;
    public get Document(){ return this._document;}

    private buildType: BuildType = BuildType.None;
    public get BuildType() {return this.buildType;}

    public constructor(document: TextDocument | undefined ) {
        if (document === undefined) {return;}
        if (document.languageId !== "simpl-plus") { return;}
        this._document = document;
        this.UpdatedTargets(document);
    }

    public UpdatedTargets(document: TextDocument ): BuildType | undefined
    {
        if (this._document !== document) {return undefined;}
        if (this._document.isUntitled){
            this.buildType = this.getBuildTaskFromGlobal();
            return;
        }
        if (this.isUshFileExists(this._document.uri))
        {
            this.buildType = this.getBuildTaskFromCurrentFile(this._document.uri);
            return;
        }
        this.buildType = this.getBuildTaskFromGlobal();
        return this.buildType;
    }

    private isUshFileExists(filePath: Uri): boolean {
        const docPath = path.parse(filePath.fsPath);
        const ushFilePath = path.join(docPath.dir, docPath.name + ".ush");
        return existsSyncWrapper(ushFilePath);
    }

    private getBuildTaskFromCurrentFile(filePath: Uri): BuildType {
        const docPath = path.parse(filePath.fsPath);
        const ushFilePath = path.join(docPath.dir, docPath.name + ".ush");
        const ushContent = readFileSyncWrapper(ushFilePath);
        const regex = /(?:Inclusions_CDS=)(.*)/;
        const match = ushContent.match(regex);
        if (match && match[1]) {
            let fileBuildType: BuildType = BuildType.None;
            fileBuildType |= match[1].includes("5") ? BuildType.Series2 : BuildType.None;
            fileBuildType |= match[1].includes("6") ? BuildType.Series3 : BuildType.None;
            fileBuildType |= match[1].includes("7") ? BuildType.Series4 : BuildType.None;
            return fileBuildType;
        }
        return this.getBuildTaskFromGlobal();
    }

    private getBuildTaskFromGlobal(): BuildType {
        let fileBuildType: BuildType = BuildType.None;
        const simplConfig = workspace.getConfiguration("simpl-plus");
        fileBuildType |= simplConfig.enable2series ? BuildType.Series2 : BuildType.None;
        fileBuildType |= simplConfig.enable3series ? BuildType.Series3 : BuildType.None;
        fileBuildType |= simplConfig.enable4series ? BuildType.Series4 : BuildType.None;
        return fileBuildType;
    }
}

export class SimplPlusActiveDocuments {
    private SimpPlusDocuments: SimplPlusDocumentTargets[] = [];

    public GetDocumentBuiltType(document: TextDocument | undefined): BuildType {
        let simplPlusDocument = this.SimpPlusDocuments.find(sd => sd.Document === document);
        if (simplPlusDocument === undefined) {
            simplPlusDocument = new SimplPlusDocumentTargets(document);
            this.SimpPlusDocuments.push(simplPlusDocument);
        }
        return simplPlusDocument.BuildType;
    }

    public RemoveSimpPlusDocument(document: TextDocument): void {
        let simplPlusDocumentIndex = this.SimpPlusDocuments.findIndex(sd => sd.Document === document);
        if (simplPlusDocumentIndex === -1) { return; }
        this.SimpPlusDocuments.splice(simplPlusDocumentIndex,1);
    }

    public UpdateSimpPlusDocumentTargets(document: TextDocument): BuildType | undefined
    {
        let simplPlusDocumentIndex = this.SimpPlusDocuments.find(sd => sd.Document === document);
        if (simplPlusDocumentIndex === undefined) { return undefined; }
        return simplPlusDocumentIndex.UpdatedTargets(document);
    }
}
