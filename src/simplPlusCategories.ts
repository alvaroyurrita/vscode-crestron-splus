import * as fs from 'fs';
import path from 'path';
import { extensions, QuickPickItem, QuickPickOptions, window } from 'vscode';
export async function insertCategory(){
    const extensionPath = extensions.getExtension("sentry07.simpl-plus")?.extensionPath;
    if (extensionPath === undefined) {return;}
    const categoriesPath = path.join(extensionPath, "categories.json");
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8')) as QuickPickItem[];
    const quickPickOptions: QuickPickOptions = {
        canPickMany: false,
        placeHolder: "Select category to insert",
        matchOnDescription: true,
    };
    const selection = await window.showQuickPick<any>(categories, quickPickOptions) as QuickPickItem[];

}