import path from "path";
import { BuildType } from "./build-type";
import { existsSyncWrapper } from "./fsExistsSyncWrapper";
import { readFileSyncWrapper } from "./fsReadSyncWrapper";
import { workspace, TextDocument, Uri  } from 'vscode';

class SimplPlusDocumentBuildTargets {
    private _document: TextDocument | undefined;
    public get Document(){ return this._document;}

    private buildType: BuildType = BuildType.None;
    public get BuildType() {return this.buildType;}

    public constructor(document: TextDocument | undefined ) {
        if (document === undefined) {return;}
        if (document.languageId !== "simpl-plus") { return;}
        this._document = document;
        this.UpdatedBuildTargets(document);
    }

    public UpdatedBuildTargets(document: TextDocument, newTargets?: BuildType ): BuildType | undefined
    {
        if (this._document !== document) {return undefined;}
        if (newTargets !== undefined) {
            this.buildType = newTargets;
            return this.buildType;
        }
        if (this._document.isUntitled){
            this.buildType = this.getBuildTargetsFromPreferences();
            return;
        }
        if (this.isUshFileExists(this._document.uri))
        {
            this.buildType = this.getBuildTargetsFromUshFile(this._document.uri);
            return;
        }
        this.buildType = this.getBuildTargetsFromPreferences();
        return this.buildType;
    }

    private isUshFileExists(filePath: Uri): boolean {
        const docPath = path.parse(filePath.fsPath);
        const ushFilePath = path.join(docPath.dir, docPath.name + ".ush");
        return existsSyncWrapper(ushFilePath);
    }

    private getBuildTargetsFromUshFile(filePath: Uri): BuildType {
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
        return this.getBuildTargetsFromPreferences();
    }

    private getBuildTargetsFromPreferences(): BuildType {
        let fileBuildType: BuildType = BuildType.None;
        const simplConfig = workspace.getConfiguration("simpl-plus");
        fileBuildType |= simplConfig.get("enable2series") ? BuildType.Series2 : BuildType.None;
        fileBuildType |= simplConfig.get("enable3series") ? BuildType.Series3 : BuildType.None;
        fileBuildType |= simplConfig.get("enable4series") ? BuildType.Series4 : BuildType.None;
        return fileBuildType;
    }
}

export class SimplPlusActiveDocuments  {

    private SimpPlusDocuments: SimplPlusDocumentBuildTargets[] = [];

    public GetSimplPlusDocumentBuildTargets(document: TextDocument | undefined): BuildType {
        let simplPlusDocument = this.SimpPlusDocuments.find(sd => sd.Document?.fileName === document?.fileName);
        if (simplPlusDocument === undefined) {
            simplPlusDocument = new SimplPlusDocumentBuildTargets(document);
            this.SimpPlusDocuments.push(simplPlusDocument);
        }
        return simplPlusDocument.BuildType;
    }

    public RemoveSimpPlusDocument(document: TextDocument): void {
        let simplPlusDocumentIndex = this.SimpPlusDocuments.findIndex(sd => sd.Document?.fileName === document.fileName);
        if (simplPlusDocumentIndex === -1) { return; }
        this.SimpPlusDocuments.splice(simplPlusDocumentIndex,1);
    }

    public UpdateSimpPlusDocumentBuildTargets(document: TextDocument, newTarget?: BuildType): BuildType | undefined
    {
        let simplPlusDocument = this.SimpPlusDocuments.find(sd => sd.Document?.fileName === document.fileName);
        if (simplPlusDocument === undefined) { return undefined; }
        return simplPlusDocument.UpdatedBuildTargets(document, newTarget);
    }
    RemoveAllSimpPlusDocuments() {
        this.SimpPlusDocuments = [];
    }
}
