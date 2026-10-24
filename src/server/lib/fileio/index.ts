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
  }
}

export async function writeAtomic(filePath: string, content: string): Promise<void> {
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
}

export async function writeDotEnv(
  filePath: string,
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
