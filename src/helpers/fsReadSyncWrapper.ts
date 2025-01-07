// fsWrapper.ts
import { readFileSync as fsreadFileSync } from 'fs';

export const readFileSyncWrapper = (filePath: string): string => {
    return fsreadFileSync(filePath, 'utf8');
};
