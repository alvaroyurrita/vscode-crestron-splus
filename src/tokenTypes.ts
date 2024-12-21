import { Range } from "vscode";

export type  TokenType = "delegate" | "event" | "function" | "property" | "variable" | "delegateProperty" | "class" | "constant"  | "method" | "field"  | "struct" | "enum" ; 

export type DocumentToken = {
    name: string;
    type: TokenType;
    nameRange: Range;
    dataType: string;
    parameters?: DocumentToken[];
    blockRange?: Range;
    internalDelegates?: DocumentToken[];
    internalEvents?: DocumentToken[];
    internalFunctions?: DocumentToken[];
    internalVariables?: DocumentToken[];
    internalProperties?: DocumentToken[];
    internalDelegateProperties?: DocumentToken[];
}