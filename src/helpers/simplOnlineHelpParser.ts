import { ExtensionContext } from "vscode";
import { SimplPlusKeywordHelpService } from "../services/simplPlusKeywordHelpService";
import * as fs from "fs";

//to be used only once, or when information in the keywords.csv file changes or when information in help.crestron.com/SIMPL+ changes
async function parseSimplOnlineHelp(context: ExtensionContext): Promise<void> {
    const helpService = await SimplPlusKeywordHelpService.getInstance();
    const keywordFilePath = context.asAbsolutePath("src/keywords.csv");
    const keywordFile = fs.readFileSync(keywordFilePath).toString();
    let definitions: { name: string, kind: string, type: string, hasHelp: boolean }[] = [];
    for (const entry of keywordFile.split("\n")) {
        const elements = entry.split(",");
        if (elements.length !== 3) { continue; }
        const help = await helpService.GetSimplHelp(elements[0].trim());
        const definition = {
            name: elements[0].trim(),
            kind: elements[1].trim(),
            type: elements[2].trim(),
            hasHelp: help !== undefined
        };
        definitions.push(definition);
    }

    const newFile = definitions.map(it => {
        return Object.values(it).toString();
      }).join('\r\n');

    const newFilePath = context.asAbsolutePath("src/keywords2.csv");
    fs.writeFileSync(newFilePath, newFile);
};