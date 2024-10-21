import {
    workspace,
    window,
    tasks,
    Task,
    TaskDefinition,
    ShellExecution,
    OutputChannel,
    TaskGroup,
    TaskScope,
    TextDocument,
    Disposable,
} from "vscode";
import * as fsWrapper from './fsWrapper';
import { SplusCompiler } from './splusCompiler';
import { getApiCommand } from './apiGenerator';


let extensionTasks : Disposable | undefined;

export function clearExtensionTasks() {
    extensionTasks?.dispose();
}

export function buildExtensionTasks(): void {
    if (extensionTasks) {
        extensionTasks.dispose();
        extensionTasks = undefined;
    }
    if (!extensionTasks && window?.activeTextEditor?.document.languageId === "splus-source") {
        let splusPromise: Thenable<Task[]> | undefined = undefined;
        extensionTasks = tasks.registerTaskProvider('splus', {
            provideTasks: () => {
                if (!splusPromise) {
                    splusPromise = getCompileTasks();
                }
                return splusPromise;
            },
            resolveTask: () => {
                return undefined;
            }
        });
    }
}

async function getCompileTasks(): Promise<Task[]> {
    let result: Task[] = [];
    let editor = window.activeTextEditor;
    let doc = editor?.document;
    let emptyTasks: Task[] = [];

    if (doc === undefined) { return emptyTasks; }
    let workspaceFolder = workspace.getWorkspaceFolder(doc.uri);
    if (!workspaceFolder) {
        return emptyTasks;
    }

    let workspaceRoot = workspaceFolder.uri.fsPath;
    if (!workspaceRoot) {
        return emptyTasks;
    }

    try {
        let sSharpLibRegEx = /(#(?:USER|CRESTRON)_SIMPLSHARP_LIBRARY)\s*\"([\w\.\-]*)\"/gmi;
        let sSharpIncludeRegEx = /#INCLUDEPATH\s*\"([\w\.\-]*)\"/gmi;

        let sSharpLibs = doc.getText().match(sSharpLibRegEx);
        let sSharpIncludes = doc.getText().match(sSharpIncludeRegEx);

        let enable2SeriesCompile = workspace.getConfiguration("splus").enable2series === true;
        let enable3SeriesCompile = workspace.getConfiguration("splus").enable3series === true;
        let enable4SeriesCompile = workspace.getConfiguration("splus").enable4series === true;

        if (sSharpLibs && sSharpLibs.length > 0) {
            sSharpLibs.forEach((regexMatch: string) => {
                let fileName = "";
                let tokens = regexMatch.match(/\S+/g);
                if (tokens !== null && tokens.length > 1) {
                    fileName = tokens[1].slice(1, -1);
                }

                let thisFileDir = doc.fileName.slice(0, doc.fileName.lastIndexOf("\\") + 1);

                if (fsWrapper.existsSync(thisFileDir + "SPlsWork\\" + fileName + ".dll")) {
                    let buildCommand = getApiCommand(fileName, thisFileDir);

                    let taskDef: TaskDefinition = {
                        type: "shell",
                        label: "Generate API file for " + fileName,
                        command: buildCommand,
                        problemMatcher: [],
                        presentation: {
                            panel: "shared",
                            focus: true,
                            clear: true
                        }
                    };

                    let executable = 'C:\\Windows\\System32\\cmd.exe';
                    let command = new ShellExecution("\"" + taskDef.command + "\"", { executable: executable, shellArgs: ['/c'] });
                    let task = new Task(taskDef, TaskScope.Workspace, taskDef.label, 'Crestron S+', command, taskDef.problemMatcher);
                    task.group = TaskGroup.Build;
                    task.definition = taskDef;
                    task.presentationOptions = taskDef.presentation;

                    result.push(task);
                }
            });
        }

        if (enable2SeriesCompile) {
            result.push(getBuildTask(doc, BuildType.Series2)); // compile 2 series
            if (enable3SeriesCompile) {
                result.push(getBuildTask(doc, BuildType.Series2 | BuildType.Series3)); // compile 2 & 3 series
            }
        }

        if (enable3SeriesCompile) {
            result.push(getBuildTask(doc, BuildType.Series3)); // compile 3 series
            if (enable4SeriesCompile) {
                result.push(getBuildTask(doc, BuildType.Series3 | BuildType.Series4)); // compile 3 & 4 series
            }
        }

        if (enable4SeriesCompile) {
            result.push(getBuildTask(doc, BuildType.Series4)); // compile 4 series
        }

        // likely do not need 2 & 4 series compile option...
        if (enable2SeriesCompile && enable3SeriesCompile && enable4SeriesCompile) {
            result.push(getBuildTask(doc, BuildType.All));
        }

        return result;
    }
    catch (err) {
        let channel = getOutputChannel();
        console.log(err);

        if (err instanceof Error) {
            channel.appendLine(err.message);
        }

        channel.appendLine('SIMPL+ compile failed');
        channel.show(true);
        return emptyTasks;
    }
}

enum BuildType {
    None = 0,
    Series2 = 1,
    Series3 = 2,
    Series4 = 4,
    All = 7
}

function getBuildTask(doc: TextDocument, buildType: BuildType): Task {
    let [label, buildCommand] = getBuildParameters(doc.fileName, buildType);

    let taskDef: TaskDefinition = {
        type: "shell",
        label: label,
        command: buildCommand,
        problemMatcher: ["$splusCC"],
        presentation: {
            panel: "shared",
            focus: true,
            clear: true
        }
    };

    let executable = 'C:\\Windows\\System32\\cmd.exe';
    let command = new ShellExecution("\"" + taskDef.command + "\"", { executable: executable, shellArgs: ['/c'] });
    let task = new Task(taskDef, TaskScope.Workspace, taskDef.label, "Crestron S+", command, taskDef.problemMatcher);
    task.group = TaskGroup.Build;
    task.definition = taskDef;
    task.presentationOptions = taskDef.presentation;

    return task;
}

let _channel: OutputChannel;
function getOutputChannel(): OutputChannel {
    if (!_channel) {
        _channel = window.createOutputChannel("SIMPL+ Compile");
    }
    return _channel;
}


function getBuildParameters(fileName: string, buildType: BuildType): [string, string] {
    let compiler = new SplusCompiler();
    compiler.arguments.push("\\rebuild \"" + fileName + "\" \\target");

    let seriesTargets = [];
    if ((buildType & BuildType.Series2) === BuildType.Series2) {
        seriesTargets.push(2);
        compiler.arguments.push("series2");
    }
    if ((buildType & BuildType.Series3) === BuildType.Series3) {
        seriesTargets.push(3);
        compiler.arguments.push("series3");
    }
    if ((buildType & BuildType.Series4) === BuildType.Series4) {
        seriesTargets.push(4);
        compiler.arguments.push("series4");
    }

    let label = "Compile " + seriesTargets.join(" & ") + " Series";
    let command = compiler.buildCommand();
    return [label, command];
}



