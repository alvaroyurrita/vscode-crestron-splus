import { Range } from "vscode";

export type TokenType =
    "delegate" |
    "event" |
    "function" |
    "property" |
    "variable" |
    "parameter" |
    "delegateProperty" |
    "class" |
    "constant" |
    "method" |
    "field" |
    "struct" |
    "enum";

export type DocumentArea =
    "function" |
    "event" |
    "parameter" |
    "expression" |
    "root" |
    "enum" |
    "struct";


export type DocumentToken = {
    name: string;
    type: TokenType;
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