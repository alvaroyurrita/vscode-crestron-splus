import axios from 'axios';
import { MarkdownString } from 'vscode';


export class SimplPlusKeywordHelp {
    readonly CRESTRON_SIMPL_HELP_URL: string = "https://help.crestron.com/simpl_plus";
    helpUrls: HelpUrl[] = [];
    constructor() {
        this.GetToc();
    }

    private async GetToc() {
        try {
            let toc = await this.GetPartialToc("Data/Tocs/Simpl_lr_Chunk0.js");
            this.helpUrls.push(...toc);
            toc = await this.GetPartialToc("Data/Tocs/Simpl_lr_Chunk1.js");
            this.helpUrls.push(...toc);
            toc = await this.GetPartialToc("Data/Tocs/Simpl_lr_Chunk2.js");
            this.helpUrls.push(...toc);
        }
        catch {}
    };

    private async GetPartialToc(partialUrl: string): Promise<HelpUrl[]> {
        let helpUrls: HelpUrl[] = [];
        const tocUrl = `${this.CRESTRON_SIMPL_HELP_URL}/${partialUrl}`;
        try {
            const response = await axios.get(tocUrl);
            if (response.status !== 200) { return []; }
            const tocEntries = response.data.replace("define({", "").replace("});", "").replaceAll("'", '"').replaceAll("{i:", '{"i":').replaceAll(",t:", ',"t":').replaceAll(",b:", ',"b":').split("},");
            tocEntries.forEach((entry: string) => {
                try {
                    const tocObject = JSON.parse(`{${entry}}}`);
                    var partialUrl = Object.keys(tocObject)[0];
                    var url = `${this.CRESTRON_SIMPL_HELP_URL}${partialUrl}`;
                    var functionName = tocObject[partialUrl].t[0].toLowerCase();
                    helpUrls.push({ functionName: functionName, url: url });
                }
                catch {
                    return;
                }

            });
            return helpUrls;
        }
        catch {
            return [];
        }
    }

    public async GetSimplHelp(keyword: string): Promise<MarkdownString | undefined> {
        var helpUrlEntry = this.helpUrls.find((entry) => entry.functionName === keyword.toLowerCase());
        if (helpUrlEntry === undefined || helpUrlEntry.url === undefined) { return undefined; }
        const theUrl = new URL(helpUrlEntry.url);
        try {
            const response = await axios.get(helpUrlEntry.url);
            if (response.status !== 200) { return undefined; }
            const markdownContent = response.data;
            const sanitizedContent = this.replacePartialPathWithFull(theUrl, markdownContent);
            const markdownString = new MarkdownString(sanitizedContent);
            markdownString.isTrusted = true;
            markdownString.supportHtml = true;
            return markdownString;
        }
        catch {
            return undefined;
        }
    }


    private replacePartialPathWithFull(url: URL, content: string): string {
        const pathRegex = /(?:src|href)="([^"]*)"/gm;
        const baseUrl = `${url.protocol}/${url.host}${url.pathname}`;
        const paths = content.matchAll(pathRegex);
        if (paths === null) { return content; }
        for (const path of paths) {
            const pathFullLink = new URL(`${baseUrl}/../${path[1]}`);
            content = content.replace(path[1], `${pathFullLink.toString()}`);
        }
        return content;
    }
}

type HelpUrl = {
    functionName: string;
    url: string;
}