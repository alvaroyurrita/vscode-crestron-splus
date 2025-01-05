import { Range, CompletionItemKind } from "vscode";


export type SimplObject = {
    name: string;
    kind: CompletionItemKind;
    nameRange: Range;
    dataType: string;
    dataTypeModifier: string;
    uri: string;
    blockRange?: Range;
    parent?: SimplObject;
    children: SimplObject[];
}