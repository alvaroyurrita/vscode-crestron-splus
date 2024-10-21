import * as fsWrapper from './fsWrapper';

export function getApiCommand(apiFileName: string, thisFileDir: string): string {
    let workDir = thisFileDir + "SPlsWork\\";
    return "\"" + workDir + "splusheader.exe\" \"" + workDir + apiFileName + ".dll\" \"" + thisFileDir + apiFileName + ".api\"";
}


function getApiInIncludeCommand(apiFileName: string, thisFileDir: string, includePaths: string[]): string {
    includePaths.forEach((path: string) => {
        let thisPath = path.slice(14, -1);
        let workDir = thisFileDir;
        if (workDir.endsWith("\\")) {
            workDir = workDir.slice(0, -1);
        }
        while (thisPath.startsWith("..\\\\")) {
            thisPath = thisPath.slice(3);
            workDir = workDir.slice(0, workDir.lastIndexOf("\\"));
        }
        if (!thisPath.endsWith("\\")) {
            thisPath = thisPath + "\\";
        }
        if (fsWrapper.existsSync(workDir + "\\" + thisPath + apiFileName + ".dll")) {
            return "\"" + workDir + "splusheader.exe\" \"" + workDir + apiFileName + ".dll\" \"" + thisFileDir + apiFileName + ".api\"";
        }
    });

    return "";
}