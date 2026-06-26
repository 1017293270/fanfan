import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createMemoryStore } from './memoryStore.js';
import type { DataStore, StoredData } from './types.js';

const emptyData: StoredData = {
  users: [],
  inviteCodes: [],
  sessions: [],
  places: [],
  stores: [],
  storePlaceLinks: []
};

async function loadData(path: string): Promise<StoredData> {
  try {
    const content = await readFile(path, 'utf8');
    return { ...emptyData, ...(JSON.parse(content) as Partial<StoredData>) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyData;
    throw error;
  }
}

async function saveData(path: string, data: StoredData): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tempPath, path);
}

export async function createFileStore(dataFilePath: string): Promise<DataStore> {
  const resolvedPath = resolve(dataFilePath);
  return createMemoryStore({
    initialData: await loadData(resolvedPath),
    onChange: (data) => saveData(resolvedPath, data)
  });
}
