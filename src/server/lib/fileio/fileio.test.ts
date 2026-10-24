import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BlockNotFoundError,
  FileNotFoundError,
  JsonParseError,
  YamlParseError,
  maskSecret,
  readDotEnv,
  readJson,
  readMarkdownYamlBlock,
  readYaml,
  writeAtomic,
  writeDotEnv,
  writeMarkdownYamlBlock,
  writeYaml,
} from './index.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fileio-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ── writeAtomic ────────────────────────────────────────────────────────────
describe('writeAtomic', () => {
  it('AC-1: writes content correctly and leaves no .tmp file', async () => {
    const target = path.join(tmpDir, 'test.txt');
    await writeAtomic(target, 'hello world');
    expect(await fs.readFile(target, 'utf-8')).toBe('hello world');
    const files = await fs.readdir(tmpDir);
    expect(files.every(f => !f.endsWith('.tmp'))).toBe(true);
  });

  it('creates parent directory if needed', async () => {
    const target = path.join(tmpDir, 'nested', 'dir', 'test.txt');
    await writeAtomic(target, 'content');
    expect(await fs.readFile(target, 'utf-8')).toBe('content');
  });

  it('overwrites existing file atomically', async () => {
    const target = path.join(tmpDir, 'file.txt');
    await writeAtomic(target, 'original');
    await writeAtomic(target, 'updated');
    expect(await fs.readFile(target, 'utf-8')).toBe('updated');
  });
});

// ── readDotEnv ─────────────────────────────────────────────────────────────
describe('readDotEnv', () => {
  it('AC-2: parses key-value pairs, skipping comments and blanks', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, [
      '# comment',
      '',
      'KEY1=value1',
      'KEY2=value2',
      'KEY3=',
    ].join('\n'));
    const result = await readDotEnv(envFile);
    expect(result).toEqual({ KEY1: 'value1', KEY2: 'value2', KEY3: '' });
  });

  it('strips surrounding double quotes from values', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, 'KEY="hello world"');
    const result = await readDotEnv(envFile);
    expect(result.KEY).toBe('hello world');
  });

  it('strips surrounding single quotes from values', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, "KEY='hello'");
    const result = await readDotEnv(envFile);
    expect(result.KEY).toBe('hello');
  });

  it('throws FileNotFoundError for missing file', async () => {
    await expect(readDotEnv(path.join(tmpDir, 'missing.env')))
      .rejects.toBeInstanceOf(FileNotFoundError);
  });
});

// ── writeDotEnv ────────────────────────────────────────────────────────────
describe('writeDotEnv', () => {
  it('AC-3: merges new key and preserves existing keys', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, 'EXISTING=old\n');
    await writeDotEnv(envFile, { NEW_KEY: 'value' });
    const result = await readDotEnv(envFile);
    expect(result.EXISTING).toBe('old');
    expect(result.NEW_KEY).toBe('value');
  });

  it('creates file if it does not exist', async () => {
    const envFile = path.join(tmpDir, 'new.env');
    await writeDotEnv(envFile, { KEY: 'val' });
    const result = await readDotEnv(envFile);
    expect(result.KEY).toBe('val');
  });

  it('overwrites existing key with new value', async () => {
    const envFile = path.join(tmpDir, '.env');
    await fs.writeFile(envFile, 'KEY=old\n');
    await writeDotEnv(envFile, { KEY: 'new' });
    const result = await readDotEnv(envFile);
    expect(result.KEY).toBe('new');
  });
});

// ── readYaml ───────────────────────────────────────────────────────────────
describe('readYaml', () => {
  it('AC-4: parses YAML into correct object', async () => {
    const yamlFile = path.join(tmpDir, 'config.yaml');
    await fs.writeFile(yamlFile, 'routing_backend: direct\nversion: 1\n');
    const result = await readYaml<{ routing_backend: string; version: number }>(yamlFile);
    expect(result).toEqual({ routing_backend: 'direct', version: 1 });
  });

  it('throws FileNotFoundError for missing file', async () => {
    await expect(readYaml(path.join(tmpDir, 'missing.yaml')))
      .rejects.toBeInstanceOf(FileNotFoundError);
  });

  it('throws YamlParseError for malformed YAML', async () => {
    const yamlFile = path.join(tmpDir, 'bad.yaml');
    await fs.writeFile(yamlFile, 'key: [\nbad yaml');
    await expect(readYaml(yamlFile)).rejects.toBeInstanceOf(YamlParseError);
  });
});

// ── writeYaml ──────────────────────────────────────────────────────────────
describe('writeYaml', () => {
  it('writes YAML that can be round-tripped', async () => {
    const yamlFile = path.join(tmpDir, 'out.yaml');
    const data = { foo: 'bar', count: 42, nested: { x: true } };
    await writeYaml(yamlFile, data);
    const result = await readYaml(yamlFile);
    expect(result).toEqual(data);
  });
});

// ── readJson ───────────────────────────────────────────────────────────────
describe('readJson', () => {
  it('parses JSON into correct object', async () => {
    const jsonFile = path.join(tmpDir, 'data.json');
    await fs.writeFile(jsonFile, JSON.stringify({ key: 'value', num: 1 }));
    const result = await readJson<{ key: string; num: number }>(jsonFile);
    expect(result).toEqual({ key: 'value', num: 1 });
  });

  it('throws FileNotFoundError for missing file', async () => {
    await expect(readJson(path.join(tmpDir, 'missing.json')))
      .rejects.toBeInstanceOf(FileNotFoundError);
  });

  it('throws JsonParseError for malformed JSON', async () => {
    const jsonFile = path.join(tmpDir, 'bad.json');
    await fs.writeFile(jsonFile, '{ not valid json }');
    await expect(readJson(jsonFile)).rejects.toBeInstanceOf(JsonParseError);
  });
});

// ── maskSecret ─────────────────────────────────────────────────────────────
describe('maskSecret', () => {
  it('AC-5: shows first 4 chars and masks the rest', () => {
    expect(maskSecret('ATATT1234abcd')).toBe('ATAT•••••••••');
  });

  it('AC-7: fully masks strings of 4 chars or fewer', () => {
    expect(maskSecret('')).toBe('');
    expect(maskSecret('AB')).toBe('••');
    expect(maskSecret('ABCD')).toBe('••••');
  });

  it('masks a string of exactly 5 chars', () => {
    expect(maskSecret('ABCDE')).toBe('ABCD•');
  });

  it('masks a long string (100 chars)', () => {
    const s = 'A'.repeat(100);
    const result = maskSecret(s);
    expect(result.slice(0, 4)).toBe('AAAA');
    expect(result.length).toBe(100);
    expect(result.slice(4)).toBe('•'.repeat(96));
  });

  it('returns empty string for undefined', () => {
    expect(maskSecret(undefined)).toBe('');
  });

  it('returns empty string for null', () => {
    expect(maskSecret(null)).toBe('');
  });
});

// ── readMarkdownYamlBlock ──────────────────────────────────────────────────
describe('readMarkdownYamlBlock', () => {
  const agentsMd = `# Agents Configuration

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 3
DEV_MAX_LOOPS: 5
QA_MAX_LOOPS: 3
DEV_COVERAGE_THRESHOLD: 80
PROD_EVAL_THRESHOLD: 8
\`\`\`

## Other Section

Some text here.
`;

  it('AC-6: extracts and parses the Global Settings block', async () => {
    const mdFile = path.join(tmpDir, 'Agents.md');
    await fs.writeFile(mdFile, agentsMd);
    const result = await readMarkdownYamlBlock(mdFile, 'Global Settings');
    expect(result).toEqual({
      PROD_MAX_LOOPS: 3,
      DEV_MAX_LOOPS: 5,
      QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 80,
      PROD_EVAL_THRESHOLD: 8,
    });
  });

  it('throws FileNotFoundError for missing file', async () => {
    await expect(readMarkdownYamlBlock(path.join(tmpDir, 'missing.md'), 'Global Settings'))
      .rejects.toBeInstanceOf(FileNotFoundError);
  });

  it('throws BlockNotFoundError when heading is absent', async () => {
    const mdFile = path.join(tmpDir, 'no-heading.md');
    await fs.writeFile(mdFile, '# Only One Heading\n\nNo yaml block here.\n');
    await expect(readMarkdownYamlBlock(mdFile, 'Global Settings'))
      .rejects.toBeInstanceOf(BlockNotFoundError);
  });

  it('handles file with multiple headings and fenced blocks', async () => {
    const mdFile = path.join(tmpDir, 'multi.md');
    await fs.writeFile(mdFile, `## First Block

\`\`\`yaml
key1: a
\`\`\`

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 2
\`\`\`

## Third Block

\`\`\`yaml
key3: c
\`\`\`
`);
    const result = await readMarkdownYamlBlock(mdFile, 'Global Settings');
    expect(result).toEqual({ PROD_MAX_LOOPS: 2 });
  });
});

// ── writeMarkdownYamlBlock ─────────────────────────────────────────────────
describe('writeMarkdownYamlBlock', () => {
  it('replaces only the target block, preserving all other content', async () => {
    const mdFile = path.join(tmpDir, 'Agents.md');
    const original = `# Title

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 3
\`\`\`

## Other Section

Keep this content.
`;
    await fs.writeFile(mdFile, original);
    await writeMarkdownYamlBlock(mdFile, 'Global Settings', { PROD_MAX_LOOPS: 5 });
    const updated = await fs.readFile(mdFile, 'utf-8');
    expect(updated).toContain('PROD_MAX_LOOPS: 5');
    expect(updated).toContain('## Other Section');
    expect(updated).toContain('Keep this content.');
    expect(updated).not.toContain('PROD_MAX_LOOPS: 3');
  });

  it('throws BlockNotFoundError when heading is missing', async () => {
    const mdFile = path.join(tmpDir, 'no-block.md');
    await fs.writeFile(mdFile, '# Title\n\nNo yaml blocks.\n');
    await expect(writeMarkdownYamlBlock(mdFile, 'Global Settings', {}))
      .rejects.toBeInstanceOf(BlockNotFoundError);
  });
});
