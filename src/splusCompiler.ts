import { workspace } from "vscode";

export class SplusCompiler {
    arguments: string[];
    compilerPath: string;

    constructor() {
        this.arguments = [];
        this.compilerPath = "\"" + workspace.getConfiguration("splus").compilerLocation + "\"";
    }
    buildCommand() {
        return this.compilerPath + " " + this.arguments.join(" ");
    }
}