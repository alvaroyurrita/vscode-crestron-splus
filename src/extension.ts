import {
    ExtensionContext,
    languages,
    workspace,
    window,
    commands,
    env,
    Uri,
    DocumentSelector,
} from "vscode";

import { SimplPlusFormattingProvider } from './simplPlusFormattingProvider';
import { SimplPlusHoverProvider } from "./simplPlusHoverProvider";
import { SimplPlusTasks, } from './simplPlusTasks';
import { SimplPlusStatusBar } from "./simplPlusStatusBar";
import { insertCategory } from "./simplPlusCategories";
import { ApiCompletionProvider } from "./apiCompletionProvider";
import { KeywordCompletionProvider } from "./keywordCompletionProvider";
import { TextMateCompletionProvider } from "./textMateCompletionProvider";
import { TokenService } from "./tokenService";


// Creates a terminal, calls the command, then closes the terminal
function callShellCommand(shellCommand: string): void {
    let term = window.createTerminal('simpl-plus', 'c:\\windows\\system32\\cmd.exe');
    term.sendText(`\"${shellCommand}\"`, true);
    term.sendText("exit", true);
}


export async function activate(context: ExtensionContext) {

    // if (workspace.workspaceFolders === undefined) {
    //     let fileName = window?.activeTextEditor?.document.uri.path;
    //     let fileFolder = fileName.slice(0, fileName.lastIndexOf("/") + 1);
    //     commands.executeCommand("vscode.openFolder", Uri.parse(fileFolder));
    // }

    const selector: DocumentSelector = 'simpl-plus';
	// const textmateService = new TextmateLanguageService(selector, context);

    //https://code.visualstudio.com/docs/editor/codebasics#_folding
	// const foldingRangeProvider = await textmateService.createFoldingRangeProvider();
    //https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol (Activate with Ctrl+Shift+O)
	// const documentSymbolProvider = await textmateService.createDocumentSymbolProvider();
    //https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name (Activate with Ctrl+T)
	// const workspaceSymbolProvider = await textmateService.createWorkspaceSymbolProvider();
    ///https://code.visualstudio.com/api/references/vscode-api#DefinitionProvider (Activate with F12)
	// const definitionProvider = await textmateService.createDefinitionProvider();

    //
	// context.subscriptions.push(languages.registerDocumentSymbolProvider(selector, documentSymbolProvider));
	// context.subscriptions.push(languages.registerFoldingRangeProvider(selector, foldingRangeProvider));
	// context.subscriptions.push(languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
	// context.subscriptions.push(languages.registerDefinitionProvider(selector, definitionProvider));


    // const textmateService = new TextmateLanguageService(selector, context);
    // const textmateTokenService = await textmateService.initTokenService();
    // const textDocument = window.activeTextEditor!.document;
    // const tokens = await textmateTokenService.fetch(textDocument);

    const tokenService = TokenService.getInstance(context);


    const simplPlusStatusBar =SimplPlusStatusBar.getInstance(context);
    const simplPlusTasks = SimplPlusTasks.getInstance(context);

    let localHelp_command = commands.registerCommand("simpl-plus.localHelp", () => {
        const helpLocation = `${workspace.getConfiguration("simpl-plus").simplDirectory}\\Simpl+lr.chm`;
        callShellCommand(helpLocation);
    });

    let webHelp_command = commands.registerCommand("simpl-plus.webHelp", () => {
        env.openExternal(Uri.parse('https://help.crestron.com/simpl_plus'));
    });

    let showCategories_command = commands.registerCommand("simpl-plus.insertCategory", () => {
        insertCategory();
    });

    let build_command = commands.registerCommand("simpl-plus.build", () => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
            const currentBuildTargets = simplPlusStatusBar.GetDocumentBuildTargets(activeEditor.document);
            simplPlusTasks.simplPlusCompileCurrent(currentBuildTargets);
        }
    });

    let thisFormatProvider = new SimplPlusFormattingProvider();
    const formatProvider = languages.registerDocumentFormattingEditProvider({ language: 'simpl-plus' }, thisFormatProvider);

    let thisHoverProvider = new SimplPlusHoverProvider();
    const hoverProvider = languages.registerHoverProvider({ language: 'simpl-plus' }, thisHoverProvider);

    let thisApiCompletionProvider = new ApiCompletionProvider();
    // const apiCompletionProvider = languages.registerCompletionItemProvider({ language: 'simpl-plus' },thisApiCompletionProvider, '.');

    let thisKeywordCompletionProvider = new KeywordCompletionProvider();
    // const keywordCompletionProvider = languages.registerCompletionItemProvider({ language: 'simpl-plus' }, thisKeywordCompletionProvider);

    let thisTextmateCompletionProvider = new TextMateCompletionProvider();
    const textMateCompletionProvider = languages.registerCompletionItemProvider({ language: 'simpl-plus' }, thisTextmateCompletionProvider);

    context.subscriptions.push(
        formatProvider,
        hoverProvider,
        localHelp_command,
        webHelp_command,
        build_command,
        showCategories_command,
        simplPlusTasks,
        // apiCompletionProvider,
        // keywordCompletionProvider,
        textMateCompletionProvider
      );
}




