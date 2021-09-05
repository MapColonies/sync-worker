import { promises as fsp, constants } from 'fs';

export async function isFileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
