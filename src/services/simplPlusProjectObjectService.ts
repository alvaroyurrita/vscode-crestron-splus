import {
    ExtensionContext,
    Disposable,
    Uri,
    Position,
    CompletionItemKind,
    CompletionItem,
    SnippetString,
    CompletionItemLabel,
    TextDocument,
    Range
} from "vscode";
import { SimplPlusObject } from "../base/simplPlusObject";
import { SimplPlusProgramObjectService } from "./simplPlusProgramObjectService";
import { simplPlusApiObjectService } from "./simplPlusApiObjectService";

export class SimplPlusProjectObjectService implements Disposable {


    private static _instance: SimplPlusProjectObjectService;
    private _programObjectService: SimplPlusProgramObjectService;
    private _apiObjectService: simplPlusApiObjectService;

    public static getInstance(ctx: ExtensionContext): SimplPlusProjectObjectService {
        if (!SimplPlusProjectObjectService._instance && ctx) {
            SimplPlusProjectObjectService._instance = new SimplPlusProjectObjectService(ctx);
        }
        return SimplPlusProjectObjectService._instance;
    }
    private constructor(ctx: ExtensionContext) {
        this._programObjectService = SimplPlusProgramObjectService.getInstance(ctx);
        this._apiObjectService = simplPlusApiObjectService.getInstance(ctx);
    }
    public dispose() {
        this._programObjectService.dispose();
        this._apiObjectService.dispose();
    }
    public getProjectObjects(uri: Uri): SimplPlusObject[] | undefined {
        const projectObjects: SimplPlusObject[] = [];
        const programObjects = this._programObjectService.getObjects(uri);
        const apiObjects = this._apiObjectService.getObjects(uri);
        if (programObjects !== undefined) { projectObjects.push(...programObjects); }
        if (apiObjects !== undefined && apiObjects.length > 0) { projectObjects.push(...apiObjects); }
        return projectObjects;
    }

    //returns the object (structure, event or function, or parameter range) that a position is inside of.
    // used to figure out what members to display during autocomplete
    public getProgramObjectAtPosition(uri: Uri, position: Position): SimplPlusObject | undefined {
        return this._programObjectService.getObjectAtPosition(uri,position);
    }
    isPositionAtFunctionParameter(functionObject: SimplPlusObject, position: Position) : boolean {
        return functionObject.children.some(ch=>ch.kind===CompletionItemKind.TypeParameter && (ch.blockRange?.contains(position)??false));
    }
    //Returns the member of object tree.  Matches as long as it is a full member (ends in . or ( or [))
    //Use for function param auto complete ( ( ) or for next class member autocompletion (.)
    public getObjectAtPosition(document: TextDocument, position: Position): SimplPlusObject | undefined {
        const uri = document.uri;
        const offsetPosition = document.offsetAt(position);
        let textUntilPosition = document.getText().slice(0, offsetPosition);
        // let textUntilPosition = document.lineAt(position).text.slice(0, position.character);
        const wordWithDotMatch = textUntilPosition.match(/((?:(?:[_\w][_#$\w]*)\s*\.\s*)*(?:[_\w][_#$\w]*)\s*)[\.\(\[]$/);//grab any group of words followed by a dot or a Opening Param at the end of the string (ie: test.test.  or test.test(  )
        if (!wordWithDotMatch) { return undefined; }
        const tokenTree = wordWithDotMatch[1].match(/[_\w][_#$\w]*/gm);
        let currentToken = tokenTree.shift();
        let currentObject: SimplPlusObject;
        let projectObjects = this.getProjectObjects(uri);
        currentObject = projectObjects.find(co=>co.name===currentToken);
        currentToken = tokenTree.shift();
        while (currentToken !== undefined){
            currentObject = currentObject.children.find(ch=>ch.name===currentToken);
            currentToken = tokenTree.shift();
        }
        return currentObject;
    }

    public getRootObjectByName(uri: Uri, name: string): SimplPlusObject | undefined {
        const documentMembers = this.getProjectObjects(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.name === name);
    }
    public getChildObjectAtPositionByName(uri: Uri, name: string, position: Position): SimplPlusObject | undefined {
        const blockMember = this.getProgramObjectAtPosition(uri, position);
        if (blockMember === undefined) { return undefined; }
        return blockMember.children.find(member => member.name === name);
    }

    public getFunctionInfo(uri: Uri, tokenLabel: string): SimplPlusObject | undefined {
        const documentMembers = this.getProjectObjects(uri);
        if (documentMembers === undefined) { return undefined; }
        return documentMembers.find(member => member.name === tokenLabel && member.kind === CompletionItemKind.Function);
    }


    public getCompletionItemsFromObjects(objects: SimplPlusObject[]): CompletionItem[] {
        if (objects === undefined) { return []; }
        const items: CompletionItem[] = objects.map(o => {
            let itemLabel: CompletionItemLabel = {
                label: o.name,
                description: o.dataType.toString()
            };
            let documentation: string = "";
            const item = new CompletionItem(itemLabel, o.kind);
            if (o.kind === CompletionItemKind.Function) {
                documentation = `${o.dataType} ${o.name}(`;
                const functionParameters = o.children.filter(c=>c.kind===CompletionItemKind.TypeParameter);
                if (functionParameters.length > 0) {
                    documentation += functionParameters.map(p => `${p.dataType} ${p.name}`).join(", ");
                }
                documentation += ")";
                const snippetString = new SnippetString();
                snippetString.appendText(o.name);
                snippetString.appendText("(");
                if (functionParameters.length > 0) {
                    functionParameters.forEach((parameter, index, parameters) => {
                        if (index > 0) { snippetString.appendText(", "); }
                        snippetString.appendPlaceholder(parameter.name);
                    });
                }
                else {
                    snippetString.appendTabstop();
                }
                snippetString.appendText(")");
                item.insertText = snippetString;
                item.command = {
                    command: "editor.action.triggerParameterHints",
                    title: "triggerSignatureHelp",
                };
            }
            item.documentation = documentation;
            return item;
        });
        return items;
    }
}