import { writeFile, readFile, rename } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'

export { parseMarkdownYamlBlock, injectMarkdownYamlBlock, BlockNotFoundError, AGENTS_GLOBAL_SETTINGS_HEADING } from './markdownYaml.js'

/**
 * Writes content atomically: write to tmp file, then rename over target.
 * On EXDEV (cross-device rename), falls back to copy+unlink.
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const tmp = join(tmpdir(), `atomic-${randomBytes(8).toString('hex')}.tmp`)
  await writeFile(tmp, content, 'utf8')
  try {
    await rename(tmp, filePath)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      await writeFile(filePath, content, 'utf8')
      const { unlink } = await import('node:fs/promises')
      await unlink(tmp).catch(() => {})
    } else {
      throw err
    }
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8')
}
