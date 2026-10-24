import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectModal } from './ProjectModal.js'

describe('ProjectModal — add mode', () => {
  it('shows inline slug error for uppercase name (AC-5)', async () => {
    render(<ProjectModal mode="add" onSave={vi.fn()} onClose={vi.fn()} />)
    const nameInput = screen.getByLabelText('Name *')
    await userEvent.type(nameInput, 'MyProject')
    expect(
      await screen.findByText('Name must be lowercase letters, numbers, and hyphens only')
    ).toBeInTheDocument()
  })

  it('keeps Save disabled when required fields are empty', () => {
    render(<ProjectModal mode="add" onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('enables Save when all required fields are filled with valid slug', async () => {
    render(<ProjectModal mode="add" onSave={vi.fn()} onClose={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Name *'), 'myproject')
    await userEvent.type(screen.getByLabelText('Display Name *'), 'My Project')
    await userEvent.type(screen.getByLabelText('Jira Project Key *'), 'MP')
    await userEvent.type(screen.getByLabelText(/GitHub Repo/i), 'owner/myproject')
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
  })

  it('shows PROJECT_EXISTS error when server returns that code (AC-6)', async () => {
    const onSave = vi.fn().mockRejectedValue(
      Object.assign(new Error('PROJECT_EXISTS'), { code: 'PROJECT_EXISTS' })
    )
    render(<ProjectModal mode="add" onSave={onSave} onClose={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Name *'), 'existing')
    await userEvent.type(screen.getByLabelText('Display Name *'), 'Existing')
    await userEvent.type(screen.getByLabelText('Jira Project Key *'), 'EX')
    await userEvent.type(screen.getByLabelText(/GitHub Repo/i), 'owner/existing')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText("Project 'existing' already exists")).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<ProjectModal mode="add" onSave={vi.fn()} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ProjectModal — edit mode', () => {
  const project = {
    name: 'editme',
    display_name: 'Edit Me',
    jira: { project_key: 'EM', concept_issue_type: 'Epic', story_issue_type: 'Task' },
    github: { repo: 'o/editme', default_branch: 'main', branch_prefix: 'feature' },
    code_graph: { local_path: '', repo_url: '', code_roots: ['src'], product_doc_roots: ['docs'], graph_bootstrapped: false },
    architecture_file: 'ArchitectureDesign.md',
  }

  it('pre-populates fields from existing project', () => {
    render(<ProjectModal mode="edit" initial={project} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText(/Jira Project Key \*/i)).toHaveValue('EM')
    expect(screen.getByLabelText(/GitHub Repo \*/i)).toHaveValue('o/editme')
  })

  it('name field is disabled in edit mode', () => {
    render(<ProjectModal mode="edit" initial={project} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText('Name *')).toBeDisabled()
  })
})
