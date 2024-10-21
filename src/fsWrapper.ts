// fsWrapper.ts
import { existsSync as fsExistsSync } from 'fs';

export const existsSync = (filePath: string): boolean => {
    return fsExistsSync(filePath);
};
