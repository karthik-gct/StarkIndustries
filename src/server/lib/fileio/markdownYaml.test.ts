import { describe, it, expect } from 'vitest'
import { parseMarkdownYamlBlock, injectMarkdownYamlBlock, BlockNotFoundError } from './markdownYaml.js'

const AGENTS_MD = `# Agents Configuration

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 3
DEV_MAX_LOOPS: 5
QA_MAX_LOOPS: 3
DEV_COVERAGE_THRESHOLD: 80
PROD_EVAL_THRESHOLD: 8
\`\`\`

---

## ProdMgmtAgent

\`\`\`yaml
agent: ProdMgmtAgent
model_config_key: prod_mgmt
\`\`\`

Some trailing markdown content.
`

const MULTI_FENCE_MD = `# Config

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 2
DEV_MAX_LOOPS: 4
QA_MAX_LOOPS: 2
DEV_COVERAGE_THRESHOLD: 75
PROD_EVAL_THRESHOLD: 7
\`\`\`

## Another Section

\`\`\`yaml
unrelated: true
\`\`\`
`

describe('parseMarkdownYamlBlock', () => {
  it('parses the Global Settings block correctly', () => {
    const result = parseMarkdownYamlBlock(AGENTS_MD, 'Global Settings')
    expect(result).toEqual({
      PROD_MAX_LOOPS: 3,
      DEV_MAX_LOOPS: 5,
      QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 80,
      PROD_EVAL_THRESHOLD: 8,
    })
  })

  it('does not read fences from other sections (multi-fence safety)', () => {
    const result = parseMarkdownYamlBlock(MULTI_FENCE_MD, 'Global Settings')
    expect(result).toMatchObject({ PROD_MAX_LOOPS: 2 })
    expect(result).not.toHaveProperty('unrelated')
  })

  it('throws BlockNotFoundError when heading is absent', () => {
    expect(() => parseMarkdownYamlBlock('# No heading here\n', 'Global Settings'))
      .toThrow(BlockNotFoundError)
  })

  it('throws BlockNotFoundError when heading exists but no yaml fence', () => {
    const md = '## Global Settings\n\nNo fence here.\n\n## Next\n'
    expect(() => parseMarkdownYamlBlock(md, 'Global Settings')).toThrow(BlockNotFoundError)
  })
})

describe('injectMarkdownYamlBlock', () => {
  it('round-trips: inject then parse returns same data', () => {
    const newData = {
      PROD_MAX_LOOPS: 5,
      DEV_MAX_LOOPS: 5,
      QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 90,
      PROD_EVAL_THRESHOLD: 9,
    }
    const updated = injectMarkdownYamlBlock(AGENTS_MD, 'Global Settings', newData)
    const parsed = parseMarkdownYamlBlock(updated, 'Global Settings')
    expect(parsed).toEqual(newData)
  })

  it('preserves all content outside the target block', () => {
    const updated = injectMarkdownYamlBlock(AGENTS_MD, 'Global Settings', { PROD_MAX_LOOPS: 1, DEV_MAX_LOOPS: 1, QA_MAX_LOOPS: 1, DEV_COVERAGE_THRESHOLD: 50, PROD_EVAL_THRESHOLD: 1 })
    expect(updated).toContain('## ProdMgmtAgent')
    expect(updated).toContain('agent: ProdMgmtAgent')
    expect(updated).toContain('Some trailing markdown content.')
  })

  it('does not modify the second fence when injecting into first section', () => {
    const updated = injectMarkdownYamlBlock(MULTI_FENCE_MD, 'Global Settings', { PROD_MAX_LOOPS: 9, DEV_MAX_LOOPS: 9, QA_MAX_LOOPS: 9, DEV_COVERAGE_THRESHOLD: 99, PROD_EVAL_THRESHOLD: 9 })
    expect(updated).toContain('unrelated: true')
  })

  it('throws BlockNotFoundError when heading is missing', () => {
    expect(() => injectMarkdownYamlBlock('# No heading\n', 'Global Settings', {}))
      .toThrow(BlockNotFoundError)
  })
})
