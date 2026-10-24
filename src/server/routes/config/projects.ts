import { Router, Request, Response } from 'express'
import { readdir, unlink, access } from 'node:fs/promises'
import { resolve, join, basename } from 'node:path'
import { readYaml, writeYaml, FileNotFoundError, YamlParseError } from '../../lib/fileio/index.js'

const projectsRouter = Router()

export interface ProjectConfig {
  name: string
  display_name: string
  description?: string
  jira: {
    project_key: string
    concept_issue_type: string
    story_issue_type: string
  }
  github: {
    repo: string
    default_branch: string
    branch_prefix: string
  }
  code_graph: {
    local_path: string
    repo_url: string
    code_roots: string[]
    product_doc_roots: string[]
    graph_bootstrapped: boolean
  }
  architecture_file: string
  _parseError?: boolean
}

export interface ProjectFormInput {
  name: string
  display_name: string
  jira_project_key: string
  github_repo: string
  github_default_branch?: string
  github_branch_prefix?: string
  code_local_path?: string
  architecture_file?: string
}

const SLUG_RE = /^[a-z0-9-]+$/

export function validateProjectSlug(name: string): boolean {
  return SLUG_RE.test(name)
}

export function buildProjectYaml(input: ProjectFormInput): ProjectConfig {
  return {
    name: input.name,
    display_name: input.display_name,
    jira: {
      project_key: input.jira_project_key,
      concept_issue_type: 'Epic',
      story_issue_type: 'Task',
    },
    github: {
      repo: input.github_repo,
      default_branch: input.github_default_branch ?? 'main',
      branch_prefix: input.github_branch_prefix ?? 'feature',
    },
    code_graph: {
      local_path: input.code_local_path ?? '',
      repo_url: `https://github.com/${input.github_repo}`,
      code_roots: ['src'],
      product_doc_roots: ['docs'],
      graph_bootstrapped: false,
    },
    architecture_file: input.architecture_file || 'ArchitectureDesign.md',
  }
}

function projectsDir(): string {
  return resolve(process.env.MARK3_ROOT ?? process.cwd(), 'projects')
}

function projectFilePath(name: string): string {
  return join(projectsDir(), `${name}.yaml`)
}

function assertNoTraversal(name: string, resolvedPath: string): void {
  const dir = projectsDir()
  if (!resolvedPath.startsWith(dir + '/') && resolvedPath !== dir) {
    throw new Error('INVALID_NAME')
  }
  if (name.includes('/') || name.includes('..') || name.includes('\\')) {
    throw new Error('INVALID_NAME')
  }
}

async function listProjects(_req: Request, res: Response): Promise<void> {
  const dir = projectsDir()
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    res.status(500).json({ error: 'PROJECTS_DIR_MISSING' })
    return
  }

  const yamlFiles = entries.filter(
    (f) => f.endsWith('.yaml') && f !== '_template.yaml' && !f.startsWith('.')
  )

  const projects = await Promise.all(
    yamlFiles.map(async (file): Promise<ProjectConfig> => {
      const filePath = join(dir, file)
      try {
        const config = await readYaml<ProjectConfig>(filePath)
        return config
      } catch (err) {
        const name = basename(file, '.yaml')
        return {
          name,
          display_name: name,
          jira: { project_key: '', concept_issue_type: '', story_issue_type: '' },
          github: { repo: '', default_branch: '', branch_prefix: '' },
          code_graph: {
            local_path: '',
            repo_url: '',
            code_roots: [],
            product_doc_roots: [],
            graph_bootstrapped: false,
          },
          architecture_file: '',
          _parseError: true,
        }
      }
    })
  )

  projects.sort((a, b) => a.name.localeCompare(b.name))
  res.json({ projects })
}

async function createProject(req: Request, res: Response): Promise<void> {
  const body = req.body as ProjectFormInput

  const requiredFields: (keyof ProjectFormInput)[] = [
    'name',
    'display_name',
    'jira_project_key',
    'github_repo',
  ]
  for (const field of requiredFields) {
    if (!body[field]) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELD', field })
      return
    }
  }

  if (!validateProjectSlug(body.name)) {
    res.status(400).json({ error: 'INVALID_SLUG' })
    return
  }

  const filePath = projectFilePath(body.name)
  try {
    await access(filePath)
    res.status(400).json({ error: 'PROJECT_EXISTS' })
    return
  } catch {
    // file does not exist — proceed
  }

  const project = buildProjectYaml(body)
  await writeYaml(filePath, project)
  res.status(201).json({ project })
}

async function updateProject(req: Request, res: Response): Promise<void> {
  const { name } = req.params
  const filePath = projectFilePath(name)

  let existing: ProjectConfig
  try {
    existing = await readYaml<ProjectConfig>(filePath)
  } catch (err) {
    if (err instanceof FileNotFoundError) {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }
    throw err
  }

  const body = req.body as Partial<ProjectFormInput>
  const requiredFields: (keyof ProjectFormInput)[] = [
    'display_name',
    'jira_project_key',
    'github_repo',
  ]
  for (const field of requiredFields) {
    if (field in body && !body[field]) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELD', field })
      return
    }
  }

  const updated: ProjectConfig = {
    ...existing,
    display_name: body.display_name ?? existing.display_name,
    jira: {
      ...existing.jira,
      project_key: body.jira_project_key ?? existing.jira.project_key,
    },
    github: {
      ...existing.github,
      repo: body.github_repo ?? existing.github.repo,
      default_branch: body.github_default_branch ?? existing.github.default_branch,
      branch_prefix: body.github_branch_prefix ?? existing.github.branch_prefix,
    },
    code_graph: {
      ...existing.code_graph,
      local_path: body.code_local_path ?? existing.code_graph.local_path,
    },
    architecture_file: body.architecture_file || existing.architecture_file,
  }

  await writeYaml(filePath, updated)
  res.json({ project: updated })
}

async function deleteProject(req: Request, res: Response): Promise<void> {
  const { name } = req.params
  const resolvedPath = resolve(projectFilePath(name))

  try {
    assertNoTraversal(name, resolvedPath)
  } catch {
    res.status(400).json({ error: 'INVALID_NAME' })
    return
  }

  try {
    await access(resolvedPath)
  } catch {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  await unlink(resolvedPath)
  res.status(204).send()
}

projectsRouter.get('/', listProjects)
projectsRouter.post('/', createProject)
projectsRouter.put('/:name', updateProject)
projectsRouter.delete('/:name', deleteProject)

export default projectsRouter
