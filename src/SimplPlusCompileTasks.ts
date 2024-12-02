import {
    workspace,
    Task,
    window,
    TaskScope,
    TaskGroup,
    TaskPanelKind,
    ShellExecution,
    tasks
} from "vscode";
import { TaskCreator, TaskArguments } from "./taskCreator";
import { getCompilerPath, getFileName } from "./helperFunctions";
import { BuildType } from "./build-type";


export function simplPlusCompileTasks(): Task[] {
    let tasks: Task[] = [];
    let emptyTasks: Task[] = [];
    const fileName = getFileName();
    const compilerPath = getCompilerPath();

    let buildTypes: BuildType = BuildType.None;;
    buildTypes |= workspace.getConfiguration("simpl-plus").enable2series === true ? BuildType.Series2 : BuildType.None;
    buildTypes |= workspace.getConfiguration("simpl-plus").enable3series === true ? BuildType.Series3 : BuildType.None;
    buildTypes |= workspace.getConfiguration("simpl-plus").enable4series === true ? BuildType.Series4 : BuildType.None;

    if (fileName === undefined) { return emptyTasks; }
    switch (buildTypes) {
        case BuildType.None:
            return emptyTasks;
        case BuildType.Series2:
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series3:
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series4:
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series2 | BuildType.Series3:
            tasks.push(getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
            tasks.push(getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series2 | BuildType.Series4:
            tasks.push(getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
            tasks.push(getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series3 | BuildType.Series4:
            tasks.push(getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
            tasks.push(getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
        case BuildType.Series2 | BuildType.Series3 | BuildType.Series4:
        case BuildType.All:
            tasks.push(getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
            tasks.push(getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
            tasks.push(getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
            tasks.push(getBuildTaskByType(buildTypes, compilerPath, fileName));
            break;
    }
    tasks.sort((a, b) => a.name.localeCompare(b.name));
    return tasks;
}

function getBuildTaskByType(buildType: BuildType, compilerPath: string, fileName: string): Task {
    let [label, buildCommand] = getBuildParameters(buildType, compilerPath, fileName);

    const taskProperties: TaskArguments = {
        name: label,
        scope: TaskScope.Workspace,
        source: 'SIMPL+',
        taskDefinition: { type: "shell" },
        execution: new ShellExecution(`\"${buildCommand}\"`, { executable: 'C:\\Windows\\System32\\cmd.exe', shellArgs: ['/c'] }),
        problemMatchers: ["$SIMPL+"],
        group: TaskGroup.Build,
        presentationOptions: { panel: TaskPanelKind.Shared, focus: true, clear: true }
    };
    let task = TaskCreator(taskProperties);
    return task;
}



function getBuildParameters(buildType: BuildType, compilerPath: string, fileName: string): [label: string, command: string] {

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

export async function simplPlusCompileCurrent(buildTypes: BuildType): Promise<void> {
    const fileName = getFileName();
    const compilerPath = getCompilerPath();
    if (fileName === undefined) { return; }
    const task = getBuildTaskByType(buildTypes, compilerPath, fileName);
    await tasks.executeTask(task);
}



