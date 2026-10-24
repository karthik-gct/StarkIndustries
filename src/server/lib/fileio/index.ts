<<<<<<< HEAD
/**
 * Atomic config file I/O library (inline stub for SCRUM-8 branch).
 * Full implementation lives in SCRUM-7 (feature/SCRUM-7-file-io-library).
 * This stub will be superseded when SCRUM-7 is merged to main.
 */
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`)
    this.name = 'FileNotFoundError'
  }
}

export class FileWriteError extends Error {
  constructor(filePath: string, cause?: unknown) {
    super(`Failed to write file: ${filePath}`)
    this.name = 'FileWriteError'
    this.cause = cause
=======
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
<<<<<<< HEAD

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
=======
import {
  BlockNotFoundError,
  FileNotFoundError,
  JsonParseError,
  YamlParseError,
} from './errors.js';

export {
  BlockNotFoundError,
  FileNotFoundError,
  JsonParseError,
  YamlParseError,
} from './errors.js';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
>>>>>>> origin/main
>>>>>>> origin/main
  }
}

export async function writeAtomic(filePath: string, content: string): Promise<void> {
<<<<<<< HEAD
  const dir = path.dirname(filePath)
  const tmp = path.join(os.tmpdir(), `stark-tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  try {
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(tmp, content, 'utf8')
    await fs.rename(tmp, filePath)
  } catch (err) {
    await fs.unlink(tmp).catch(() => {})
    throw new FileWriteError(filePath, err)
  }
}

export async function readDotEnv(filePath: string): Promise<Record<string, string>> {
  let content: string
  try {
    content = await fs.readFile(filePath, 'utf8')
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') throw new FileNotFoundError(filePath)
    throw err
  }
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key) result[key] = value
  }
  return result
=======
  const dir = path.dirname(filePath);
<<<<<<< HEAD
  const tmp = path.join(os.tmpdir(), `stark-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(tmp, content, 'utf8');
  try {
    await fs.rename(tmp, filePath);
  } catch (err: unknown) {
    // EXDEV: cross-device rename (tmpdir on different fs)
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      await fs.copyFile(tmp, filePath);
      await fs.unlink(tmp).catch(() => undefined);
=======
  const base = path.basename(filePath);
  const tmp = path.join(os.tmpdir(), `${base}.tmp.${Date.now()}.${process.pid}`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmp, content, 'utf-8');
  try {
    await fs.rename(tmp, filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      // Cross-filesystem: fall back to copy+delete (best-effort atomicity)
      await fs.copyFile(tmp, filePath);
      await fs.unlink(tmp);
>>>>>>> origin/main
    } else {
      await fs.unlink(tmp).catch(() => undefined);
      throw err;
    }
  }
<<<<<<< HEAD
  void dir; // suppress unused warning
}

export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    throw new FileNotFoundError(filePath);
  }
=======
}

export async function readDotEnv(filePath: string): Promise<Record<string, string>> {
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1);
    // Strip surrounding single or double quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
>>>>>>> origin/main
}

export async function writeDotEnv(
  filePath: string,
<<<<<<< HEAD
  values: Record<string, string>
): Promise<void> {
  let existing: Record<string, string> = {}
  try {
    existing = await readDotEnv(filePath)
  } catch (err) {
    if (!(err instanceof FileNotFoundError)) throw err
  }
  const merged = { ...existing, ...values }
  const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`)
  await writeAtomic(filePath, lines.join('\n') + '\n')
}

export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 4) return '•'.repeat(value.length)
  return value.slice(0, 4) + '•'.repeat(value.length - 4)
}
=======
  values: Record<string, string>,
): Promise<void> {
  let existing: Record<string, string> = {};
  if (await fileExists(filePath)) {
    existing = await readDotEnv(filePath);
  }
  const merged = { ...existing, ...values };
  const content =
    Object.entries(merged)
      .map(([k, v]) => {
        // Quote values containing spaces or = signs
        const needsQuote = v.includes(' ') || v.includes('=');
        return needsQuote ? `${k}="${v}"` : `${k}=${v}`;
      })
      .join('\n') + '\n';
  await writeAtomic(filePath, content);
}

export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');
>>>>>>> origin/main
  try {
    return yaml.load(raw) as T;
  } catch (err) {
    throw new YamlParseError(filePath, err);
  }
}

export async function writeYaml(filePath: string, data: unknown): Promise<void> {
<<<<<<< HEAD
  const content = yaml.dump(data, { lineWidth: 120 });
=======
  const content = yaml.dump(data, { lineWidth: -1 });
>>>>>>> origin/main
  await writeAtomic(filePath, content);
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
<<<<<<< HEAD
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    throw new FileNotFoundError(filePath);
  }
=======
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');
>>>>>>> origin/main
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new JsonParseError(filePath, err);
  }
}

<<<<<<< HEAD
export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '•'.repeat(value.length);
  return value.slice(0, 4) + '•'.repeat(value.length - 4);
}
=======
export function maskSecret(value: string | undefined | null): string {
  if (value == null) return '';
  if (value.length === 0) return '';
  if (value.length <= 4) return '•'.repeat(value.length);
  return value.slice(0, 4) + '•'.repeat(value.length - 4);
}

export async function readMarkdownYamlBlock(
  filePath: string,
  headingText: string,
): Promise<Record<string, unknown>> {
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');

  const escapedHeading = headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match any heading level followed by the heading text
  const headingRegex = new RegExp(`^#{1,6}\\s+${escapedHeading}\\s*$`, 'm');
  const headingMatch = headingRegex.exec(raw);
  if (!headingMatch) throw new BlockNotFoundError(headingText, filePath);

  const afterHeading = raw.slice(headingMatch.index + headingMatch[0].length);

  // Find the next ```yaml fence
  const fenceStart = afterHeading.indexOf('```yaml');
  if (fenceStart === -1) throw new BlockNotFoundError(headingText, filePath);

  const contentStart = afterHeading.indexOf('\n', fenceStart) + 1;
  const fenceEnd = afterHeading.indexOf('```', contentStart);
  if (fenceEnd === -1) throw new BlockNotFoundError(headingText, filePath);

  const blockContent = afterHeading.slice(contentStart, fenceEnd);
  try {
    return yaml.load(blockContent) as Record<string, unknown>;
  } catch (err) {
    throw new YamlParseError(filePath, err);
  }
}

export async function writeMarkdownYamlBlock(
  filePath: string,
  headingText: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');

  const escapedHeading = headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingRegex = new RegExp(`^#{1,6}\\s+${escapedHeading}\\s*$`, 'm');
  const headingMatch = headingRegex.exec(raw);
  if (!headingMatch) throw new BlockNotFoundError(headingText, filePath);

  const beforeFenceSearch = headingMatch.index + headingMatch[0].length;
  const afterHeading = raw.slice(beforeFenceSearch);

  const fenceStart = afterHeading.indexOf('```yaml');
  if (fenceStart === -1) throw new BlockNotFoundError(headingText, filePath);

  const contentStart = afterHeading.indexOf('\n', fenceStart) + 1;
  const fenceEnd = afterHeading.indexOf('```', contentStart);
  if (fenceEnd === -1) throw new BlockNotFoundError(headingText, filePath);

  const newBlock = yaml.dump(data, { lineWidth: -1 });
  const updated =
    raw.slice(0, beforeFenceSearch + fenceStart + '```yaml'.length) +
    '\n' +
    newBlock +
    raw.slice(beforeFenceSearch + fenceEnd);

  await writeAtomic(filePath, updated);
}
>>>>>>> origin/main
>>>>>>> origin/main
