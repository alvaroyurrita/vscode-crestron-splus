import * as fsExistsWrapper from './helpers/fsReadSyncWrapper';
import { workspace, Uri, Position, Range, TextDocument, } from 'vscode';
import { DocumentToken } from './services/tokenTypes';


export async function provideClassTokens(): Promise<DocumentToken[]> {

    const currentWorkspace = workspace.workspaceFolders;
    //@ts-ignore
    const dirtyDocumentPath = Uri.joinPath(currentWorkspace[0].uri, "SPlsWork", "SampleSimplSharpLibrary.api");
    const apiDocument = await workspace.openTextDocument(dirtyDocumentPath.fsPath);
    const apiDocumentContent = apiDocument.getText();
    const apiClassesMatches = apiDocumentContent.matchAll(/class\s*([\w]*)\s*{([^}]*)/gm);
    const apiClasses: DocumentToken[] = [];
    for (let apiClass of apiClassesMatches) {
        const classStart = apiDocument.positionAt(apiClass.index + apiClass[0].indexOf("{") + 1);
        const classEnd = apiDocument.positionAt(apiClass.index + apiClass[0].length);
        const classBodyRange = new Range(classStart, classEnd);
        const classNameRange = apiDocument.getWordRangeAtPosition(apiDocument.positionAt(apiClass.index + apiClass[0].indexOf(apiClass[1])))
        let delegates: DocumentToken[] = [];
        let events: DocumentToken[] = [];
        let functions: DocumentToken[] = [];
        let properties: DocumentToken[] = [];
        let variables: DocumentToken[] = [];
        let delegateProperties: DocumentToken[] = [];
        const delegatesArea = apiClass[2].match(/class delegates([^\/]*)/m);
        if (delegatesArea && delegatesArea[1]) {
            const delegatesStart = apiDocument.positionAt(apiDocument.offsetAt(classStart)+delegatesArea.index)
            const delegatesEnd = apiDocument.positionAt(apiDocument.offsetAt(classStart)+delegatesArea.index+delegatesArea[0].length);
            const delegatesRange = new Range(delegatesStart, delegatesEnd);
            delegates = getDelegates(delegatesRange, apiDocument);
        }
        const eventsArea = apiClass[2].match(/class events([^\/]*)/m);
        if (eventsArea && eventsArea[1]) {
            const eventsStart = apiDocument.positionAt(apiDocument.offsetAt(classStart)+eventsArea.index)
            const eventsEnd = apiDocument.positionAt(apiDocument.offsetAt(classStart)+eventsArea.index+eventsArea[0].length);
            const eventsRange = new Range(eventsStart, eventsEnd);
            events = getEvents(eventsRange, apiDocument);
        }
        const functionsArea = apiClass[2].match(/class functions([^\/]*)/m);
        if (functionsArea && functionsArea[1]) {
            const delegatesStart = apiDocument.positionAt(apiDocument.offsetAt(classStart)+functionsArea.index)
            const delegatesEnd = apiDocument.positionAt(apiDocument.offsetAt(classStart)+functionsArea.index+functionsArea[0].length);
            const delegatesRange = new Range(delegatesStart, delegatesEnd);
            functions = getFunctions(delegatesRange, apiDocument);
        }

        const variablesArea = apiClass[2].match(/class variables([^\/]*)/m);
        if (variablesArea && variablesArea[1]) {
            const variablesStart = apiDocument.positionAt(apiDocument.offsetAt(classStart)+variablesArea.index);
            const variablesEnd = apiDocument.positionAt(apiDocument.offsetAt(classStart)+variablesArea.index+variablesArea[0].length);
            const variablesRange = new Range(variablesStart, variablesEnd);
            variables = getVariables(variablesRange, apiDocument);
        }

        const propertiesArea = apiClass[2].match(/class properties([^\}]*)/m);
        if (propertiesArea && propertiesArea[1]) {
            const propertiesStart = apiDocument.positionAt(apiDocument.offsetAt(classStart)+propertiesArea.index)
            const propertiesEnd = apiDocument.positionAt(apiDocument.offsetAt(classStart)+propertiesArea.index+propertiesArea[0].length);
            const propertiesRange = new Range(propertiesStart, propertiesEnd);
            properties = getProperties(propertiesRange, apiDocument);
            delegateProperties = getDelegateProperties(propertiesRange, apiDocument);
        }

        apiClasses.push({
            name: apiClass[1],
            type: "class",
            nameRange: classNameRange,
            dataType: "class",
            blockRange: classBodyRange,
            internalDelegates: delegates,
            internalEvents: events,
            internalFunctions: functions,
            internalVariables: variables,
            internalProperties: properties,
            internalDelegateProperties: delegateProperties
        });
    }
    console.log(apiClasses);
    return apiClasses;
}



function getDelegates(delegatesArea: Range, document: TextDocument): DocumentToken[] {
    let delegates: DocumentToken[] = [];
    const delegatesText = document.getText(delegatesArea);
    const delegateMatches = delegatesText.matchAll(/delegate\s*([\w]*)\s*([\w]*)\s*\((.*)\)/gm);
    for (let delegateMatch of delegateMatches) {
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(delegatesArea.start)+delegateMatch.index+delegateMatch[0].indexOf(delegateMatch[2]))
        );
        const parameterStart = document.positionAt(document.offsetAt(delegatesArea.start)+delegateMatch.index+delegateMatch[0].indexOf("(")+1);
        const parametersEnd = document.positionAt(document.offsetAt(delegatesArea.start)+delegateMatch.index+delegateMatch[0].indexOf(")"));
        const parametersRange = new Range(parameterStart, parametersEnd);
        const parameters = getParameters(parametersRange, document);
        delegates.push({
            name: delegateMatch[2],
            type: "delegate",
            nameRange,
            dataType: delegateMatch[1],
            parameters
        });
    }
    return delegates;
}

function getEvents(eventsArea: Range, document: TextDocument): DocumentToken[] {
    let events: DocumentToken[] = [];
    const eventsText = document.getText(eventsArea);
    const eventMatches = eventsText.matchAll(/EventHandler\s*([\w]*)\s*\((.*)\)/gm);
    for (let eventMatch of eventMatches) {
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(eventsArea.start)+eventMatch.index+eventMatch[0].indexOf(eventMatch[1]))
        );
        const parameterStart = document.positionAt(document.offsetAt(eventsArea.start)+eventMatch.index+eventMatch[0].indexOf("(")+1);
        const parametersEnd = document.positionAt(document.offsetAt(eventsArea.start)+eventMatch.index+eventMatch[0].indexOf(")"));
        const parametersRange = new Range(parameterStart, parametersEnd);
        const parameters = getParameters(parametersRange, document);
        events.push({
            name: eventMatch[1],
            type: "event",
            nameRange,
            parameters,
            dataType: "EventHandler"
        });
    }
    return events;
}

function getFunctions(functionsArea: Range, document: TextDocument): DocumentToken[] {
    let functions: DocumentToken[] = [];
    const functionsText = document.getText(functionsArea);
    const functionMatches = functionsText.matchAll(/([\w]*)\s*([\w]*)\s*\((.*)\)/gm);
    for (let functionMatch of functionMatches) {
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(functionsArea.start)+functionMatch.index+functionMatch[0].indexOf(functionMatch[2]))
        );
        const parameterStart = document.positionAt(document.offsetAt(functionsArea.start)+functionMatch.index+functionMatch[0].indexOf("(")+1);
        const parametersEnd = document.positionAt(document.offsetAt(functionsArea.start)+functionMatch.index+functionMatch[0].indexOf(")"));
        const parametersRange = new Range(parameterStart, parametersEnd);
        const parameters = getParameters(parametersRange, document);
        functions.push({
            name: functionMatch[2],
            type: "function",
            nameRange,
            parameters,
            dataType: functionMatch[1]
        });
    }
    return functions;
}

function getVariables(variablesArea: Range, document: TextDocument): DocumentToken[] {
    let variables: DocumentToken[] = [];
    const variablesText = document.getText(variablesArea);
    const variablesMatches = variablesText.matchAll(/([\w]*)\s*([\w]*)\s*(?:\[,*\])?;/gm);
    for (let variableMatch of variablesMatches) {
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(variablesArea.start)+variableMatch.index+variableMatch[0].indexOf(variableMatch[2]))
        );
        variables.push({
            name: variableMatch[2],
            type: "variable",
            nameRange,
            dataType: variableMatch[1]
        });
    }
    return variables;
}

function getProperties(propertiesArea: Range, document: TextDocument): DocumentToken[] {
    let properties: DocumentToken[] = [];
    const variablesText = document.getText(propertiesArea);
    const propertyMatches = variablesText.matchAll(/(?:([\w]*)\s*)?([\w]*)\s*([\w\[\]]*)\s*;/gm);
    for (let propertyMatch of propertyMatches) {
        if (propertyMatch[1] !== "") { continue; };
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(propertiesArea.start)+propertyMatch.index+propertyMatch[0].indexOf(propertyMatch[3]))
        );
        properties.push({
            name: propertyMatch[3],
            type: "property",
            nameRange,
            dataType: propertyMatch[2]
        });
    }
    return properties;
}

function getDelegateProperties(delegatePropertiesArea: Range, document: TextDocument): DocumentToken[] {
    let delegateProperties: DocumentToken[] = [];
    const delegatePropertiesText = document.getText(delegatePropertiesArea);
    const delegatePropertyMatches = delegatePropertiesText.matchAll(/(?:([\w]*)\s*)?([\w]*)\s*([\w\[\]]*)\s*;/gm);
    for (let delegatePropertyMatch of delegatePropertyMatches) {
        if (delegatePropertyMatch[1] === "") { continue; };
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(delegatePropertiesArea.start)+delegatePropertyMatch.index+delegatePropertyMatch[0].indexOf(delegatePropertyMatch[3]))
        );
        delegateProperties.push({
            name: delegatePropertyMatch[3],
            type: "delegateProperty",
            nameRange,
            dataType: delegatePropertyMatch[2]
        });
    }
    return delegateProperties;
}

function getParameters(parameterArea: Range, document: TextDocument): DocumentToken[] {
    let parameters: DocumentToken[] = [];
    const parametersText = document.getText(parameterArea);

    const parameterMatches = parametersText.matchAll(/\s*([\w]*)\s*([\w]*)\s*/gm);
    for (let parameterMatch of parameterMatches) {
        if (parameterMatch[1] === "") { continue; };
        const nameRange = document.getWordRangeAtPosition(
            document.positionAt(document.offsetAt(parameterArea.start)+parameterMatch.index+parameterMatch[0].indexOf(parameterMatch[2]))
        );
        parameters.push({
            name: parameterMatch[2].trim(),
            type: "variable",
            dataType: parameterMatch[1].trim(),
            nameRange,
        });
    }
    return parameters;
}

