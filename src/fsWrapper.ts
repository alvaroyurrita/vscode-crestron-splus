// This wrapes fs.existsSync so we can run stubs for unit testing
import { existsSync as fsExistsSync } from 'fs';

export const existsSync = (filePath: string): boolean => {
    return fsExistsSync(filePath);
};
