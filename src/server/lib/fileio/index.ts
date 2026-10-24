import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
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
  }
}

export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
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
    } else {
      await fs.unlink(tmp).catch(() => undefined);
      throw err;
    }
  }
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
}

export async function writeDotEnv(
  filePath: string,
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
  try {
    return yaml.load(raw) as T;
  } catch (err) {
    throw new YamlParseError(filePath, err);
  }
}

export async function writeYaml(filePath: string, data: unknown): Promise<void> {
  const content = yaml.dump(data, { lineWidth: -1 });
  await writeAtomic(filePath, content);
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  if (!(await fileExists(filePath))) throw new FileNotFoundError(filePath);
  const raw = await fs.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new JsonParseError(filePath, err);
  }
}

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
