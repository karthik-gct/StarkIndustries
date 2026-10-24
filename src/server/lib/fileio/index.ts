import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import yaml from 'js-yaml'

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found: ${path}`)
    this.name = 'FileNotFoundError'
  }
}

export class YamlParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'YamlParseError'
  }
}

export async function writeAtomic(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const tmp = join(tmpdir(), `stark-${randomBytes(8).toString('hex')}.tmp`)
  try {
    await writeFile(tmp, content, 'utf8')
    await rename(tmp, filePath)
  } catch (err) {
    // EXDEV: cross-device rename — fall back to copy+delete
    const { copyFile, unlink } = await import('node:fs/promises')
    await copyFile(tmp, filePath)
    await unlink(tmp).catch(() => undefined)
  }
}

export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    throw new FileNotFoundError(filePath)
  }
  try {
    return yaml.load(raw) as T
  } catch (err) {
    throw new YamlParseError(String(err))
  }
}

export async function writeYaml(filePath: string, data: unknown): Promise<void> {
  const content = yaml.dump(data, { lineWidth: 120, noRefs: true })
  await writeAtomic(filePath, content)
}

export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 4) return '•'.repeat(value.length)
  return value.slice(0, 4) + '•'.repeat(value.length - 4)
}
