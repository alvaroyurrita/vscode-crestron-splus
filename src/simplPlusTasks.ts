import {
    workspace,
    window,
    tasks,
    Task,
    OutputChannel,
    Disposable,
    TaskScope,
    ExtensionContext,
    extensions,
    TaskGroup,
    TaskPanelKind,
    ShellExecution,
    TaskDefinition,
    WorkspaceFolder,
    TaskPresentationOptions,
} from "vscode";
import path from "path";
import * as fsExistsWrapper from './helpers/fsExistsSyncWrapper';
import { getCompilerPath, getFileName } from "./helpers/helperFunctions";
import { BuildType } from "./build-type";

export class SimplPlusTasks implements Disposable {
    private static _instance: SimplPlusTasks;
    private _extensionTasks: Disposable | undefined;
    public static getInstance(ctx?: ExtensionContext): SimplPlusTasks {
        if (!SimplPlusTasks._instance) {
            SimplPlusTasks._instance = new SimplPlusTasks(ctx);
        }
        return SimplPlusTasks._instance;
    }
    private constructor(ctx?: ExtensionContext) {
        this.buildExtensionTasks();
        let onDidChangeConfiguration = workspace.onDidChangeConfiguration(() => this.buildExtensionTasks());
        let onDidOpenTextDocument = workspace.onDidOpenTextDocument(() => this.buildExtensionTasks());
        let onDidSaveTextDocument = workspace.onDidSaveTextDocument(() => this.buildExtensionTasks());

        ctx?.subscriptions.push(
            onDidSaveTextDocument,
            onDidChangeConfiguration,
            onDidOpenTextDocument,
        );
    }

    private buildExtensionTasks(): void {
        if (this._extensionTasks) {
            this._extensionTasks.dispose();
            this._extensionTasks = undefined;
        }
        if (!this._extensionTasks && window?.activeTextEditor?.document.languageId === "simpl-plus") {
            let splusPromise: Thenable<Task[]> | undefined = undefined;
            this._extensionTasks = tasks.registerTaskProvider('simpl-plus', {
                provideTasks: () => {
                    if (!splusPromise) {
                        splusPromise = this.getSimplPlusComputedTasks();
                    }
                    return splusPromise;
                },
                resolveTask: () => {
                    return undefined;
                }
            });
        }
    }

    private async getSimplPlusComputedTasks(): Promise<Task[]> {
        let result: Task[] = [];
        let activeEditor = window.activeTextEditor;
        let activeDocument = activeEditor?.document;
        let emptyTasks: Task[] = [];

        if (activeDocument === undefined) { return emptyTasks; }
        let workspaceFolder = workspace.getWorkspaceFolder(activeDocument.uri);
        if (!workspaceFolder) {
            return emptyTasks;
        }

        let workspaceRoot = workspaceFolder.uri.fsPath;
        if (!workspaceRoot) {
            return emptyTasks;
        }

        try {
            result = result.concat(...this.simplPlusIncludeLibraryTasks());
            result = result.concat(...this.simplPlusCompileTasks());
            return result;
        }
        catch (err) {
            let channel = this.getOutputChannel();
            console.log("Error while calculating Simpl Plus Tasks",err);

            if (err instanceof Error) {
                channel.appendLine(err.message);
            }

            channel.appendLine('SIMPL+ compile failed');
            channel.show(true);
            return emptyTasks;
        }
    }

    private _channel: OutputChannel | undefined;
    private getOutputChannel(): OutputChannel {
        if (!this._channel) {
            this._channel = window.createOutputChannel("SIMPL+ Compile");
        }
        return this._channel;
    }

    private simplPlusIncludeLibraryTasks(): Task[] {
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
                const thisFileDir = fileNamePath.dir;
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

                    let task = this.TaskCreator(taskProperties);
                    tasks.push(task);
                }
            };
        }

        return tasks;
    }

    private simplPlusCompileTasks(): Task[] {
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
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series3:
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series4:
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series2 | BuildType.Series3:
                tasks.push(this.getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series2 | BuildType.Series4:
                tasks.push(this.getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series3 | BuildType.Series4:
                tasks.push(this.getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
            case BuildType.Series2 | BuildType.Series3 | BuildType.Series4:
            case BuildType.All:
                tasks.push(this.getBuildTaskByType(BuildType.Series2, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(BuildType.Series3, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(BuildType.Series4, compilerPath, fileName));
                tasks.push(this.getBuildTaskByType(buildTypes, compilerPath, fileName));
                break;
        }
        tasks.sort((a, b) => a.name.localeCompare(b.name));
        return tasks;
    }

    private getBuildTaskByType(buildType: BuildType, compilerPath: string, fileName: string): Task {
        let [label, buildCommand] = this.getBuildParameters(buildType, compilerPath, fileName);

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
        let task = this.TaskCreator(taskProperties);
        return task;
    }



    private getBuildParameters(buildType: BuildType, compilerPath: string, fileName: string): [label: string, command: string] {

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

    public async simplPlusCompileCurrent(buildTypes: BuildType): Promise<void> {
        const fileName = getFileName();
        const compilerPath = getCompilerPath();
        if (fileName === undefined) { return; }
        const task = this.getBuildTaskByType(buildTypes, compilerPath, fileName);
        await tasks.executeTask(task);
    }


    private TaskCreator(taskProperties: TaskArguments): Task {
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

    dispose() {
        this._extensionTasks?.dispose();
    }

}

interface TaskArguments {
    taskDefinition: TaskDefinition;
    scope: TaskScope.Global | TaskScope.Workspace | WorkspaceFolder;
    name: string;
    source: string;
    execution: ShellExecution;
    problemMatchers: string[];
    group: TaskGroup | undefined;
    presentationOptions: TaskPresentationOptions;
}
