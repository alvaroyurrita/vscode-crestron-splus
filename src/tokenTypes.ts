export type  TokenType = "delegate" | "event" | "function" | "property" | "variable" | "delegateProperty" | "class" | "constant"  | "method" | "field"  | "struct" | "enum" ; 

export type Token = {
    name: string;
    type: TokenType;
    parameters?: string;
    returnType?: string;
    dataType?: string;
    line?: number;
    column?: number;
}

export type ClassMembers ={
    name: string;
    type: TokenType;
    delegates: Token[];
    events: Token[];
    functions: Token[];
    properties: Token[];
    variables: Token[];
    delegateProperties: Token[];
}

export type StructureMembers ={
    name: string;
    type: TokenType;
    variables: Token[];
    line?: number;
    column?: number;
}

export type EventMembers ={
    name: string;
    type: TokenType;
    variables: Token[];
    line?: number;
    column?: number;
}

export type FunctionMembers ={
    name: string;
    type: TokenType;
    returnType: string;
    variables: Token[];
    line?: number;
    column?: number;
    parameters?: Token[];
}

export type DocumentMembers ={
    structures: StructureMembers[];
    functions: FunctionMembers[];
    events: EventMembers[];
    variables: Token[];
    constants: Token[];
}