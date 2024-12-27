import { Range, CompletionItemKind } from "vscode";


export type DocumentToken = {
    name: string;
    kind: CompletionItemKind;
    nameRange: Range;
    dataType: string;
    parameters?: DocumentToken[];
    parameterRange?: Range;
    blockRange?: Range;
    internalDelegates?: DocumentToken[];
    internalEvents?: DocumentToken[];
    internalFunctions?: DocumentToken[];
    internalVariables?: DocumentToken[];
    internalProperties?: DocumentToken[];
    internalDelegateProperties?: DocumentToken[];
}