import {
    workspace,
    window,
    tasks,
    Task,
    OutputChannel,
    Disposable,
} from "vscode";
import { simplPlusCompileTasks } from './simplPlusCompileTasks';
import { simplPlusIncludeLibraryTasks } from "./simplPlusIncludeLibraryTasks";

let extensionTasks: Disposable | undefined;

export function clearExtensionTasks() {
    extensionTasks?.dispose();
}

export function buildExtensionTasks(): void {
    if (extensionTasks) {
        extensionTasks.dispose();
        extensionTasks = undefined;
    }
    if (!extensionTasks && window?.activeTextEditor?.document.languageId === "simpl-plus") {
        let splusPromise: Thenable<Task[]> | undefined = undefined;
        extensionTasks = tasks.registerTaskProvider('simpl-plus', {
            provideTasks: () => {
                if (!splusPromise) {
                    splusPromise = getSimplPlusComputedTasks();
                }
                return splusPromise;
            },
            resolveTask: () => {
                return undefined;
            }
        });
    }
}

async function getSimplPlusComputedTasks(): Promise<Task[]> {
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
        result = result.concat(...simplPlusIncludeLibraryTasks());
        result = result.concat(...simplPlusCompileTasks());
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

let _channel: OutputChannel;
function getOutputChannel(): OutputChannel {
    if (!_channel) {
        _channel = window.createOutputChannel("SIMPL+ Compile");
    }
    return _channel;
}






