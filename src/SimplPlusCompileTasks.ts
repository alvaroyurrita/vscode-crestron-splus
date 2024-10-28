import {
    workspace,
    Task,
    window,
    TaskScope,
    TaskGroup,
    TaskPanelKind,
    ShellExecution
} from "vscode";
import { TaskCreator, TaskArguments } from "./taskCreator";

let compilerPath = "";
let fileName = "";

export function simplPlusCompileTasks(): Task[] {
    let tasks: Task[] = [];
    let activeEditor = window.activeTextEditor;
    let activeDocument = activeEditor?.document;
    fileName = activeDocument?.fileName ?? "";
    let emptyTasks: Task[] = [];
    compilerPath = `\"${workspace.getConfiguration("splus").simplDirectory}\\SPlusCC.exe\"`;


    if (activeDocument === undefined) { return emptyTasks; }

    let buildTypes: BuildType = BuildType.None;;
    buildTypes |= workspace.getConfiguration("splus").enable2series === true ? BuildType.Series2 : BuildType.None;
    buildTypes |= workspace.getConfiguration("splus").enable3series === true ? BuildType.Series3 : BuildType.None;
    buildTypes |= workspace.getConfiguration("splus").enable4series === true ? BuildType.Series4 : BuildType.None;

    switch (buildTypes) {
        case BuildType.None:
            return emptyTasks;
        case BuildType.Series2:
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series3:
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series4:
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series2 | BuildType.Series3:
            tasks.push(getBuildTaskByType(BuildType.Series2));
            tasks.push(getBuildTaskByType(BuildType.Series3));
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series2 | BuildType.Series4:
            tasks.push(getBuildTaskByType(BuildType.Series2));
            tasks.push(getBuildTaskByType(BuildType.Series4));
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series3 | BuildType.Series4:
            tasks.push(getBuildTaskByType(BuildType.Series3));
            tasks.push(getBuildTaskByType(BuildType.Series4));
            tasks.push(getBuildTaskByType(buildTypes));
            break;
        case BuildType.Series2 | BuildType.Series3 | BuildType.Series4:
        case BuildType.All:
            tasks.push(getBuildTaskByType(BuildType.Series2));
            tasks.push(getBuildTaskByType(BuildType.Series3));
            tasks.push(getBuildTaskByType(BuildType.Series4));
            tasks.push(getBuildTaskByType(buildTypes));
            break;
    }
    tasks.sort((a, b) => a.name.localeCompare(b.name));
    return tasks;
}

function getBuildTaskByType(buildType: BuildType): Task {
    let [label, buildCommand] = getBuildParameters(buildType);

    const taskProperties: TaskArguments = {
        name: label,
        scope: TaskScope.Workspace,
        source: 'Crestron S+',
        taskDefinition: { type: "shell" },
        execution: new ShellExecution(`\"${buildCommand}\"`, { executable: 'C:\\Windows\\System32\\cmd.exe', shellArgs: ['/c'] }),
        problemMatchers: ["$splusCC"],
        group: TaskGroup.Build,
        presentationOptions: { panel: TaskPanelKind.Shared, focus: true, clear: true }
    };
    let task = TaskCreator(taskProperties);
    return task;
}



function getBuildParameters(buildType: BuildType): [label: string, command: string] {

    let commandArguments: string[] = [];
    let seriesTargets: string[] = [];

    commandArguments.push("\\rebuild");
    commandArguments.push(fileName);
    commandArguments.push("\\target");

    if ((buildType & BuildType.Series2) === BuildType.Series2) {
        seriesTargets.push("2");
        commandArguments.push("series2");
    }
    if ((buildType & BuildType.Series3) === BuildType.Series3) {
        seriesTargets.push("3");
        commandArguments.push("series3");
    }
    if ((buildType & BuildType.Series4) === BuildType.Series4) {
        seriesTargets.push("4");
        commandArguments.push("series4");
    }

    let label = `Compile ${seriesTargets.join(" & ")} Series`;
    let command = `${compilerPath} ${commandArguments.join(" ")}`;
    return [label, command];
}


enum BuildType {
    None = 0,
    Series2 = 1 << 0,
    Series3 = 1 << 2,
    Series4 = 1 << 4,
    All = ~(~0 << 4)
}