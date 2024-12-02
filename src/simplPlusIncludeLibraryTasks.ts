import {
    workspace,
    Task,
    TaskScope,
    TaskGroup,
    TaskPanelKind,
    ShellExecution,
    window,
    extensions
} from "vscode";
import { TaskCreator, TaskArguments } from "./taskCreator";
import path from "path";
import * as fsExistsWrapper from './fsExistsSyncWrapper';

export function simplPlusIncludeLibraryTasks(): Task[] {
    let tasks: Task[] = [];
    let activeEditor = window.activeTextEditor;
    let activeDocument = activeEditor?.document;
    let emptyTasks: Task[] = [];

    if (activeDocument === undefined) { return emptyTasks; }
    let sSharpLibRegEx = /(?:#(?:USER|CRESTRON)_SIMPLSHARP_LIBRARY)\s*\"(?<libraryName>[\w\.\-]*)\"/gmi;

    let sSharpLibraryMatches = activeDocument.getText().matchAll(sSharpLibRegEx);


    if (!!sSharpLibraryMatches) {
        for (const match of sSharpLibraryMatches) {
            const library = match.groups?.libraryName;
            const fileNamePath = path.parse(activeDocument.uri.fsPath);
            const thisFileDir =  fileNamePath.dir;
            const libraryClzDir = path.join(thisFileDir, `${library}.clz`);
            const simplDirectory = workspace.getConfiguration("simpl-plus").simplDirectory;
            const extensionPath = extensions.getExtension("sentry07.simpl-plus")?.extensionPath;
            if (extensionPath === undefined) { return emptyTasks; }
            const simpPlusApiGeneratorPath = path.join(extensionPath, "ApiGenerator", "SimplPlusApiGenerator.exe");

            if (fsExistsWrapper.existsSyncWrapper(libraryClzDir)) {
                let buildCommand = `\"${simpPlusApiGeneratorPath}" \"${libraryClzDir}\" \"${simplDirectory}\"`;

                const taskProperties: TaskArguments = {
                    name: `Generate API file for ${library}`,
                    scope: TaskScope.Workspace,
                    source: 'Crestron S+',
                    taskDefinition: { type: "shell" },
                    execution: new ShellExecution(`\"${buildCommand}\"`, { executable: 'C:\\Windows\\System32\\cmd.exe', shellArgs: ['/C'] }),
                    problemMatchers: [],
                    group: TaskGroup.Build,
                    presentationOptions: { panel: TaskPanelKind.Shared, focus: true, clear: true }
                };

                let task = TaskCreator(taskProperties);
                tasks.push(task);
            }
        };
    }

    return tasks;
}


