import {
    Task,
    TaskDefinition,
    ShellExecution,
    TaskGroup,
    TaskScope,
    WorkspaceFolder,
    TaskPresentationOptions,
} from "vscode";

export interface TaskArguments {
    taskDefinition: TaskDefinition;
    scope: TaskScope.Global | TaskScope.Workspace | WorkspaceFolder;
    name: string;
    source: string;
    execution: ShellExecution;
    problemMatchers: string[];
    group: TaskGroup | undefined;
    presentationOptions: TaskPresentationOptions;
}
export function TaskCreator(taskProperties: TaskArguments): Task {
    const task = new Task(taskProperties.taskDefinition,
        taskProperties.scope,
        taskProperties.name,
        taskProperties.source,
        taskProperties.execution,
        taskProperties.problemMatchers);
    task.group = taskProperties.group;
    task.presentationOptions = taskProperties.presentationOptions;
    return task;
}