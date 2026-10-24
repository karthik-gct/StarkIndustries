import yaml from 'js-yaml'

export class BlockNotFoundError extends Error {
  constructor(headingText: string) {
    super(`Global Settings block not found in Agents.md: heading '## ${headingText}' or its fenced yaml block is missing`)
    this.name = 'BlockNotFoundError'
  }
}

export const AGENTS_GLOBAL_SETTINGS_HEADING = 'Global Settings'

/**
 * Extracts and parses the first ```yaml fence under the given ## heading.
 * Stops scanning at the next ## heading so multi-fence files are safe.
 */
export function parseMarkdownYamlBlock(
  content: string,
  headingText: string
): Record<string, unknown> {
  const lines = content.split('\n')
  const headingLine = `## ${headingText}`

  let inSection = false
  let inFence = false
  const fenceLines: string[] = []

  for (const line of lines) {
    if (!inSection) {
      if (line.trim() === headingLine) inSection = true
      continue
    }
    // Stop at next heading
    if (line.startsWith('## ') && line.trim() !== headingLine) break

    if (!inFence) {
      if (line.trim() === '```yaml') { inFence = true }
      continue
    }
    if (line.trim() === '```') break
    fenceLines.push(line)
  }

  if (fenceLines.length === 0) throw new BlockNotFoundError(headingText)

  const parsed = yaml.load(fenceLines.join('\n'))
  if (!parsed || typeof parsed !== 'object') throw new BlockNotFoundError(headingText)
  return parsed as Record<string, unknown>
}

/**
 * Replaces the first ```yaml fence under the given ## heading with serialised data.
 * All content outside that fence is preserved byte-for-byte.
 */
export function injectMarkdownYamlBlock(
  content: string,
  headingText: string,
  data: Record<string, unknown>
): string {
  const lines = content.split('\n')
  const headingLine = `## ${headingText}`

  let inSection = false
  let fenceStart = -1
  let fenceEnd = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inSection) {
      if (line.trim() === headingLine) inSection = true
      continue
    }
    if (line.startsWith('## ') && line.trim() !== headingLine) break
    if (fenceStart === -1 && line.trim() === '```yaml') { fenceStart = i; continue }
    if (fenceStart !== -1 && fenceEnd === -1 && line.trim() === '```') { fenceEnd = i; break }
  }

  if (fenceStart === -1 || fenceEnd === -1) throw new BlockNotFoundError(headingText)

  // js-yaml strips comments — acceptable per design decision
  const newBlock = yaml.dump(data, { lineWidth: -1 }).trimEnd()
  const result = [
    ...lines.slice(0, fenceStart + 1),
    newBlock,
    ...lines.slice(fenceEnd)
  ]
  return result.join('\n')
}
