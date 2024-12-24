import { MarkdownString } from 'vscode';
import * as https from 'https';

export class SimplPlusKeywordHelpService {
    public static instance: SimplPlusKeywordHelpService;
    readonly CRESTRON_SIMPL_HELP_URL: string = "https://help.crestron.com/simpl_plus";
    helpUrls: HelpUrl[] = [];

    public static getInstance(): SimplPlusKeywordHelpService {
        if (!SimplPlusKeywordHelpService.instance) {
            SimplPlusKeywordHelpService.instance = new SimplPlusKeywordHelpService();
        }
        return SimplPlusKeywordHelpService.instance;
    }

    private constructor() {
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
        catch { }
    };

    private async GetPartialToc(partialUrl: string): Promise<HelpUrl[]> {
        let helpUrls: HelpUrl[] = [];
        const tocUrl = `${this.CRESTRON_SIMPL_HELP_URL}/${partialUrl}`;
        try {
            // const response = await axios.get(tocUrl);
            // if (response.status !== 200) { return []; }
            const response = await this.fetchHttpPage(tocUrl);
            // const tocEntries = response.data.replace("define({", "").replace("});", "").replaceAll("'", '"').replaceAll("{i:", '{"i":').replaceAll(",t:", ',"t":').replaceAll(",b:", ',"b":').split("},");
            const tocEntries = response.replace("define({", "").replace("});", "").replaceAll("'", '"').replaceAll("{i:", '{"i":').replaceAll(",t:", ',"t":').replaceAll(",b:", ',"b":').split("},");
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
            // const response = await axios.get(helpUrlEntry.url);
            const response = await this.fetchHttpPage(helpUrlEntry.url);
            // if (response.status !== 200) { return undefined; }
            const markdownContent = response;
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

    private fetchHttpPage(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';

                // A chunk of data has been received.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received.
                response.on('end', () => {
                    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP error! status: ${response.statusCode}`));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

}


type HelpUrl = {
    functionName: string;
    url: string;
}




