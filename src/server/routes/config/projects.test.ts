import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import yaml from 'js-yaml'
import projectsRouter, { validateProjectSlug, buildProjectYaml } from './projects.js'

function makeApp(projectsRoot: string) {
  const app = express()
  app.use(express.json())
  process.env.MARK3_ROOT = projectsRoot
  app.use('/api/config/projects', projectsRouter)
  return app
}

describe('validateProjectSlug', () => {
  it('accepts valid slugs', () => {
    expect(validateProjectSlug('starkindustries')).toBe(true)
    expect(validateProjectSlug('my-project')).toBe(true)
    expect(validateProjectSlug('proj123')).toBe(true)
  })

  it('rejects uppercase letters', () => {
    expect(validateProjectSlug('MyProject')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(validateProjectSlug('my project')).toBe(false)
  })

  it('rejects underscores', () => {
    expect(validateProjectSlug('my_project')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateProjectSlug('')).toBe(false)
  })
})

describe('buildProjectYaml', () => {
  it('always sets graph_bootstrapped: false', () => {
    const result = buildProjectYaml({
      name: 'test',
      display_name: 'Test',
      jira_project_key: 'TEST',
      github_repo: 'owner/test',
    })
    expect(result.code_graph.graph_bootstrapped).toBe(false)
  })

  it('defaults architecture_file to ArchitectureDesign.md', () => {
    const result = buildProjectYaml({
      name: 'test',
      display_name: 'Test',
      jira_project_key: 'TEST',
      github_repo: 'owner/test',
    })
    expect(result.architecture_file).toBe('ArchitectureDesign.md')
  })
})

describe('GET /api/config/projects — AC-1', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'stark-test-'))
    await mkdir(join(tmpRoot, 'projects'))
    await writeFile(
      join(tmpRoot, 'projects', 'alpha.yaml'),
      yaml.dump({
        name: 'alpha',
        display_name: 'Alpha',
        jira: { project_key: 'AL', concept_issue_type: 'Epic', story_issue_type: 'Task' },
        github: { repo: 'o/alpha', default_branch: 'main', branch_prefix: 'feature' },
        code_graph: { local_path: '', repo_url: '', code_roots: ['src'], product_doc_roots: ['docs'], graph_bootstrapped: false },
        architecture_file: 'ArchitectureDesign.md',
      })
    )
    await writeFile(
      join(tmpRoot, 'projects', 'beta.yaml'),
      yaml.dump({
        name: 'beta',
        display_name: 'Beta',
        jira: { project_key: 'BE', concept_issue_type: 'Epic', story_issue_type: 'Task' },
        github: { repo: 'o/beta', default_branch: 'main', branch_prefix: 'feature' },
        code_graph: { local_path: '', repo_url: '', code_roots: ['src'], product_doc_roots: ['docs'], graph_bootstrapped: true },
        architecture_file: 'ArchitectureDesign.md',
      })
    )
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('returns all projects with required fields', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(200)
    expect(res.body.projects).toHaveLength(2)
    const names = res.body.projects.map((p: { name: string }) => p.name)
    expect(names).toContain('alpha')
    expect(names).toContain('beta')
    const alpha = res.body.projects.find((p: { name: string }) => p.name === 'alpha')
    expect(alpha.jira.project_key).toBe('AL')
    expect(alpha.github.repo).toBe('o/alpha')
    expect(alpha.code_graph.graph_bootstrapped).toBe(false)
  })

  it('excludes _template.yaml', async () => {
    await writeFile(join(tmpRoot, 'projects', '_template.yaml'), yaml.dump({ name: '_template' }))
    const app = makeApp(tmpRoot)
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(200)
    const names = res.body.projects.map((p: { name: string }) => p.name)
    expect(names).not.toContain('_template')
  })

  it('returns empty array when no projects', async () => {
    const emptyRoot = await mkdtemp(join(tmpdir(), 'stark-empty-'))
    await mkdir(join(emptyRoot, 'projects'))
    const app = makeApp(emptyRoot)
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(200)
    expect(res.body.projects).toHaveLength(0)
    await rm(emptyRoot, { recursive: true, force: true })
  })

  it('returns 500 when projects/ directory missing', async () => {
    const noDir = await mkdtemp(join(tmpdir(), 'stark-nodir-'))
    const app = makeApp(noDir)
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('PROJECTS_DIR_MISSING')
    await rm(noDir, { recursive: true, force: true })
  })

  it('returns _parseError badge for malformed YAML', async () => {
    await writeFile(join(tmpRoot, 'projects', 'broken.yaml'), ': invalid: yaml: {{{')
    const app = makeApp(tmpRoot)
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(200)
    const broken = res.body.projects.find((p: { name: string }) => p.name === 'broken')
    expect(broken._parseError).toBe(true)
  })
})

describe('POST /api/config/projects — AC-2, AC-5, AC-6', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'stark-test-'))
    await mkdir(join(tmpRoot, 'projects'))
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('creates new project YAML with graph_bootstrapped: false (AC-2)', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).post('/api/config/projects').send({
      name: 'newproject',
      display_name: 'New Project',
      jira_project_key: 'NP',
      github_repo: 'owner/newproject',
    })
    expect(res.status).toBe(201)
    expect(res.body.project.code_graph.graph_bootstrapped).toBe(false)

    const fileContent = await readFile(join(tmpRoot, 'projects', 'newproject.yaml'), 'utf8')
    const parsed = yaml.load(fileContent) as { code_graph: { graph_bootstrapped: boolean } }
    expect(parsed.code_graph.graph_bootstrapped).toBe(false)
  })

  it('rejects invalid slug — uppercase (AC-5)', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).post('/api/config/projects').send({
      name: 'MyProject',
      display_name: 'My Project',
      jira_project_key: 'MP',
      github_repo: 'owner/myproject',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_SLUG')
  })

  it('rejects invalid slug — spaces (AC-5)', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).post('/api/config/projects').send({
      name: 'my project',
      display_name: 'My Project',
      jira_project_key: 'MP',
      github_repo: 'owner/myproject',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_SLUG')
  })

  it('rejects duplicate name with PROJECT_EXISTS (AC-6)', async () => {
    await writeFile(
      join(tmpRoot, 'projects', 'existing.yaml'),
      yaml.dump({ name: 'existing', display_name: 'Existing' })
    )
    const app = makeApp(tmpRoot)
    const res = await request(app).post('/api/config/projects').send({
      name: 'existing',
      display_name: 'Existing Dupe',
      jira_project_key: 'EX',
      github_repo: 'owner/existing',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('PROJECT_EXISTS')
  })

  it('rejects missing required fields', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).post('/api/config/projects').send({
      name: 'incomplete',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('MISSING_REQUIRED_FIELD')
  })
})

describe('PUT /api/config/projects/:name — AC-3', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'stark-test-'))
    await mkdir(join(tmpRoot, 'projects'))
    await writeFile(
      join(tmpRoot, 'projects', 'editme.yaml'),
      yaml.dump({
        name: 'editme',
        display_name: 'Edit Me',
        jira: { project_key: 'OLD', concept_issue_type: 'Epic', story_issue_type: 'Task' },
        github: { repo: 'o/editme', default_branch: 'main', branch_prefix: 'feature' },
        code_graph: { local_path: '', repo_url: '', code_roots: ['src'], product_doc_roots: ['docs'], graph_bootstrapped: false },
        architecture_file: 'ArchitectureDesign.md',
      })
    )
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('updates jira_project_key and writes YAML (AC-3)', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).put('/api/config/projects/editme').send({
      jira_project_key: 'NEW',
    })
    expect(res.status).toBe(200)
    expect(res.body.project.jira.project_key).toBe('NEW')

    const fileContent = await readFile(join(tmpRoot, 'projects', 'editme.yaml'), 'utf8')
    const parsed = yaml.load(fileContent) as { jira: { project_key: string } }
    expect(parsed.jira.project_key).toBe('NEW')
  })

  it('returns 404 for non-existent project', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).put('/api/config/projects/doesnotexist').send({
      jira_project_key: 'X',
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/config/projects/:name — AC-4', () => {
  let tmpRoot: string

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'stark-test-'))
    await mkdir(join(tmpRoot, 'projects'))
    await mkdir(join(tmpRoot, 'artifacts', 'deleteme'), { recursive: true })
    await writeFile(join(tmpRoot, 'artifacts', 'deleteme', 'important.md'), 'keep me')
    await writeFile(
      join(tmpRoot, 'projects', 'deleteme.yaml'),
      yaml.dump({ name: 'deleteme', display_name: 'Delete Me' })
    )
  })

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true })
  })

  it('removes projects/{name}.yaml and leaves artifacts/ intact (AC-4, NFR-1)', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).delete('/api/config/projects/deleteme')
    expect(res.status).toBe(204)

    // YAML file gone
    await expect(access(join(tmpRoot, 'projects', 'deleteme.yaml'))).rejects.toThrow()

    // artifacts untouched
    const artifactContent = await readFile(join(tmpRoot, 'artifacts', 'deleteme', 'important.md'), 'utf8')
    expect(artifactContent).toBe('keep me')
  })

  it('returns 404 for non-existent project', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).delete('/api/config/projects/ghost')
    expect(res.status).toBe(404)
  })

  it('rejects path traversal attempt', async () => {
    const app = makeApp(tmpRoot)
    const res = await request(app).delete('/api/config/projects/..%2F..%2Fetc%2Fpasswd')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_NAME')
  })
})
