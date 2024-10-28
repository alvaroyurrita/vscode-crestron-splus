
import {
    workspace,
    Task,
    TaskScope,
    TaskGroup,
    TaskPanelKind,
    ShellExecution,
    window
} from "vscode";
import { TaskCreator, TaskArguments } from "./taskCreator";
import path from "path";
import { getApiCommand } from './apiGenerator';
import * as fsWrapper from './fsWrapper';

export function simplPlusIncludeLibraryTasks(): Task[] {
    let tasks: Task[] = [];
    let activeEditor = window.activeTextEditor;
    let activeDocument = activeEditor?.document;
    let emptyTasks: Task[] = [];

    if (activeDocument === undefined) { return emptyTasks; }
    let sSharpLibRegEx = /(?:#(?:USER|CRESTRON)_SIMPLSHARP_LIBRARY)\s*\"(?<clz>[\w\.\-]*)\"/gmi;
    let sSharpIncludeRegEx = /#INCLUDEPATH\s*\"([\w\.\-]*)\"/gmi;

    let sSharpLibraryMatches = activeDocument.getText().matchAll(sSharpLibRegEx);
    let sSharpIncludes = activeDocument.getText().match(sSharpIncludeRegEx);


    if (!!sSharpLibraryMatches) {
        for (const match of sSharpLibraryMatches) {
            const library = match.groups?.clz;
            const fileNamePath = path.parse(activeDocument.uri.fsPath);
            const thisFileDir = fileNamePath.dir;
            const splsWorkDir = path.join(thisFileDir, "SPlsWork");
            const libraryClzDir = path.join(thisFileDir, `${library}.clz`);
            const simplDirectory = workspace.getConfiguration("splus").simplDirectory;

            if (fsWrapper.existsSync(libraryClzDir)) {
                let buildCommand = getApiCommand(libraryClzDir, thisFileDir);

                const taskProperties: TaskArguments = {
                    name: `Generate API file for ${library}`,
                    scope: TaskScope.Workspace,
                    source: 'Crestron S+',
                    taskDefinition: { type: "shell" },
                    execution: new ShellExecution(`\"${buildCommand}\:`, { executable: 'C:\\Windows\\System32\\cmd.exe', shellArgs: ['/c'] }),
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