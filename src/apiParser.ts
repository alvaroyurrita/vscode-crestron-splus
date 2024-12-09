import * as fsExistsWrapper from './fsReadSyncWrapper';
import { workspace, Uri } from 'vscode';
import { ClassMembers, Token, FunctionMembers, StructureMembers, TokenType, DocumentMembers } from './tokenTypes';


export function provideClassTokens(): ClassMembers[] {

    const currentWorkspace = workspace.workspaceFolders;
    //@ts-ignore
    const dirtyDocumentPath = Uri.joinPath(currentWorkspace[0].uri, "SPlsWork", "SampleSimplSharpLibrary.api");
    const apiDocument = fsExistsWrapper.readFileSyncWrapper(dirtyDocumentPath.fsPath).toString();
    const classTokenMatches = apiDocument.matchAll(/class\s*([_\w][\w]*)\s*{([^}]*)/gm);
    const classMembers: ClassMembers[] = [];
    for (let tokenMatch of classTokenMatches) {
        let delegates: Token[] = [];
        let events: Token[] = [];
        let functions: Token[] = [];
        let properties: Token[] = [];
        let variables: Token[] = [];
        let delegateProperties: Token[] = [];
        const delegatesArea = tokenMatch[2].match(/class delegates([^\/]*)/m);
        if (delegatesArea && delegatesArea[1]) {
            delegates = getDelegates(delegatesArea[1]);
        }
        const eventsArea = tokenMatch[2].match(/class events([^\/]*)/m);
        if (eventsArea && eventsArea[1]) {
            events = getEvents(eventsArea[1]);
        }
        const functionsArea = tokenMatch[2].match(/class functions([^\/]*)/m);
        if (functionsArea && functionsArea[1]) {
            functions = getFunctions(functionsArea[1]);
        }

        const variablesArea = tokenMatch[2].match(/class variables([^\/]*)/m);
        if (variablesArea && variablesArea[1]) {
            variables = getVariables(variablesArea[1]);
        }

        const propertiesArea = tokenMatch[2].match(/class properties([^\}]*)/m);
        if (propertiesArea && propertiesArea[1]) {
            properties = getProperties(propertiesArea[1]);
            delegateProperties = getDelegateProperties(propertiesArea[1]);
        }

        classMembers.push({
            name: tokenMatch[1],
            type: "class",
            delegates,
            events,
            functions,
            properties,
            variables,
            delegateProperties
        });
        console.log(tokenMatch[1]);
    }
    return classMembers;
}

function getDelegates(delegatesArea: string) :Token[] {
    let delegates: Token[] = [];
    const classDelegates = delegatesArea.matchAll(/delegate\s*([_\w][\w]*)\s*([_\w][\w]*)\s*\((.*)\)/gm);
    for (let delegate of classDelegates) {
        delegates.push({
            name: delegate[2],
            type: "delegate",
            parameters: delegate[3],
            returnType: delegate[1]
        });
    }
    return delegates;
}

function getEvents(eventsArea: string): Token[] {
    let events: Token[] = [];
    const classEvents = eventsArea.matchAll(/EventHandler\s*([_\w][\w]*)\s*\((.*)\)/gm);
    for (let event of classEvents) {
        events.push({
            name: event[1],
            type: "event",
            parameters: event[2]
        });
    }
    return events;
}

function getFunctions(functionsArea: string): Token[] {
    let functions: Token[] = [];
    const classFunctions = functionsArea.matchAll(/([\w]*)\s*([_\w][\w]*)\s*\((.*)\)/gm);
    for (let func of classFunctions) {
        functions.push({
            name: func[2],
            type: "function",
            parameters: func[3],
            returnType: func[1]
        });
    }
    return functions;
}

function getVariables(variablesArea: string): Token[] {
    let variables: Token[] = [];
    const classVariables = variablesArea.matchAll(/([\w]*)\s*([_\w][\w\[\]]*)\s*;/gm);
    for (let variable of classVariables) {
        variables.push({
            name: variable[2],
            type: "variable",
            dataType: variable[1]
        });
    }
    return variables;
}

function getProperties(propertiesArea: string): Token[] {
    let properties: Token[] = [];
    const classProperties = propertiesArea.matchAll(/(?:([\w]*)\s*)?([\w]*)\s*([_\w][\w\[\]]*)\s*;/gm);
    for (let property of classProperties) {
        if (property[1] !== "") {continue;};
        properties.push({
            name: property[3],
            type: "property",
            dataType: property[2]
        });
    }
    return properties;
}

function getDelegateProperties(delegatePropertiesArea: string): Token[] {
    let delegateProperties: Token[] = [];
    const classProperties = delegatePropertiesArea.matchAll(/(?:([\w]*)\s*)?([\w]*)\s*([_\w][\w\[\]]*)\s*;/gm);
    for (let delegateProperty of classProperties) {
        if (delegateProperty[1] === "") {continue;};
        delegateProperties.push({
            name: delegateProperty[3],
            type: "delegateProperty",
            dataType: delegateProperty[2]
        });
    }
    return delegateProperties;
}

