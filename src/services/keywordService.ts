import { extensions, CompletionItemKind } from "vscode";
import { readFileSyncWrapper } from "../helpers/fsReadSyncWrapper";
import * as fsExistsWrapper from '../helpers/fsExistsSyncWrapper';
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
    "parameterModifier" |
    "variableModifier" |
    "functionModifier" |
    "outputType" |
    "parameterType" |
    "statement" |
    "structureBuiltIn" |
    "type" |
    "variable" |
    "variableType" |
    "voidFunction";


export type Keyword = {
    name: string,
    kind: CompletionItemKind,
    type: KeywordType,
    hasHelp: boolean
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
        for (const entry of keywordDefinitionsContent.split("\n")) {
            const elements = entry.split(",");
            if (elements.length !== 4) { continue; }
            const definition = {
                name: elements[0].trim(),
                kind : CompletionItemKind[elements[1].trim()],
                type : elements[2].trim() as KeywordType,
                hasHelp: elements[3].trim() === "true"
            };
            this._keywordDefinitions.push(definition);
        }
    }
    public  getKeywords(types:KeywordType[]) : Keyword[]{
        return this._keywordDefinitions.filter(kd=>types.includes(kd.type));
    }

    public getKeyword(name: string): Keyword | undefined {
        return this._keywordDefinitions.find(kd => kd.name.toLowerCase() === name.toLowerCase());
    }
}
