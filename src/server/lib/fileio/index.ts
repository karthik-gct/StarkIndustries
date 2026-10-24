import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';

export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class YamlParseError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`YAML parse error in ${filePath}: ${cause}`);
    this.name = 'YamlParseError';
  }
}

export class JsonParseError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`JSON parse error in ${filePath}: ${cause}`);
    this.name = 'JsonParseError';
  }
}

export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(os.tmpdir(), `stark-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmp, content, 'utf8');
  try {
    await fs.rename(tmp, filePath);
  } catch (err: unknown) {
    // EXDEV: cross-device rename (tmpdir on different fs)
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      await fs.copyFile(tmp, filePath);
      await fs.unlink(tmp).catch(() => undefined);
    } else {
      await fs.unlink(tmp).catch(() => undefined);
      throw err;
    }
  }
  void dir; // suppress unused warning
}

export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    throw new FileNotFoundError(filePath);
  }
  try {
    return yaml.load(raw) as T;
  } catch (err) {
    throw new YamlParseError(filePath, err);
  }
}

export async function writeYaml(filePath: string, data: unknown): Promise<void> {
  const content = yaml.dump(data, { lineWidth: 120 });
  await writeAtomic(filePath, content);
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    throw new FileNotFoundError(filePath);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new JsonParseError(filePath, err);
  }
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '•'.repeat(value.length);
  return value.slice(0, 4) + '•'.repeat(value.length - 4);
}
