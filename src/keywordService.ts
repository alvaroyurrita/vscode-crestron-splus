import { extensions } from "vscode";
import { readFileSyncWrapper } from "./fsReadSyncWrapper";
import * as fsExistsWrapper from './fsExistsSyncWrapper';
import path from "path";


export type KeywordType =
    "classBuiltIn" |
    "constant" |
    "declaration" |
    "event-handler" |
    "eventType" |
    "function" |
    "functionType" |
    "inputType" |
    "modifier" |
    "outputType" |
    "parameterType" |
    "statement" |
    "structureBuiltIn" |
    "type" |
    "variable" |
    "variableType" |
    "voidFunction";


type Keyword = {
    name: string,
    kind: string,
    type: KeywordType
}

export class KeywordService {
    private _keywordDefinitions: Keyword[] = [];
    private static _instance: KeywordService;
    public static getInstance(): KeywordService {
        if (!KeywordService._instance) {
            KeywordService._instance = new KeywordService();
        }
        return KeywordService._instance;
    }

    private constructor() {
        const extensionPath = extensions.getExtension("sentry07.simpl-plus")?.extensionPath;
        if (extensionPath === undefined) { return; }
        const keywordDefinitionsPath = path.join(extensionPath, "src", "keywords.csv");
        if (!fsExistsWrapper.existsSyncWrapper(keywordDefinitionsPath)) {return;};
        const keywordDefinitionsContent = readFileSyncWrapper(keywordDefinitionsPath);
        keywordDefinitionsContent.split("\n").
            forEach(kd => {
                const elements = kd.split(",");
                if (elements.length!==3) {return;}
                const definition:Keyword = {
                    name : elements[0].trim(),
                    kind : elements[1].trim(),
                    type : elements[2].trim() as KeywordType
                };
                this._keywordDefinitions.push(definition);
            });
    }
    public  getKeywords(types:KeywordType[]) : Keyword[]{
        return this._keywordDefinitions.filter(kd=>types.includes(kd.type));
    }
}
