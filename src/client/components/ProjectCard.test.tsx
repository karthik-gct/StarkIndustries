import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from './ProjectCard.js'
import type { ProjectConfig } from '../hooks/useProjects.js'

const base: ProjectConfig = {
  name: 'testproject',
  display_name: 'Test Project',
  jira: { project_key: 'TP', concept_issue_type: 'Epic', story_issue_type: 'Task' },
  github: { repo: 'owner/testproject', default_branch: 'main', branch_prefix: 'feature' },
  code_graph: {
    local_path: '',
    repo_url: '',
    code_roots: ['src'],
    product_doc_roots: ['docs'],
    graph_bootstrapped: false,
  },
  architecture_file: 'ArchitectureDesign.md',
}

describe('ProjectCard', () => {
  it('renders project name, jira key, github repo', () => {
    render(<ProjectCard project={base} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('TP')).toBeInTheDocument()
    expect(screen.getByText('owner/testproject')).toBeInTheDocument()
  })

  it('shows "Not indexed" badge when graph_bootstrapped is false', () => {
    render(<ProjectCard project={base} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByLabelText('graph not bootstrapped')).toBeInTheDocument()
    expect(screen.queryByLabelText('graph bootstrapped')).not.toBeInTheDocument()
  })

  it('shows "Indexed" badge when graph_bootstrapped is true', () => {
    const indexed: ProjectConfig = {
      ...base,
      code_graph: { ...base.code_graph, graph_bootstrapped: true },
    }
    render(<ProjectCard project={indexed} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByLabelText('graph bootstrapped')).toBeInTheDocument()
  })

  it('shows parse error badge when _parseError is true', () => {
    const broken: ProjectConfig = { ...base, _parseError: true }
    render(<ProjectCard project={broken} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Parse error')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<ProjectCard project={base} onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Edit testproject'))
    expect(onEdit).toHaveBeenCalledWith(base)
  })
})
