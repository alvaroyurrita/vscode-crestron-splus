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
}

export type FunctionMembers ={
    name: string;
    type: TokenType;
    parameters: string;
    returnType: string;
    variables: Token[];
}

export type DocumentMembers ={
    classes: ClassMembers[];
    structures: StructureMembers[];
    functions: FunctionMembers[];
    inputs: Token[];
    outputs: Token[];
    variables: Token[];
    constants: Token[];
    events: Token[];
    enums: Token[];

}