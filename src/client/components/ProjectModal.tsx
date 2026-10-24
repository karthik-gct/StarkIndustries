import { useState, useEffect } from 'react'
import type { ProjectConfig, ProjectFormInput } from '../hooks/useProjects.js'

interface ProjectModalProps {
  mode: 'add' | 'edit'
  initial?: ProjectConfig
  onSave: (data: ProjectFormInput) => Promise<void>
  onClose: () => void
}

const SLUG_RE = /^[a-z0-9-]+$/

export function ProjectModal({ mode, initial, onSave, onClose }: ProjectModalProps) {
  const [form, setForm] = useState<ProjectFormInput>({
    name: initial?.name ?? '',
    display_name: initial?.display_name ?? '',
    jira_project_key: initial?.jira?.project_key ?? '',
    github_repo: initial?.github?.repo ?? '',
    github_default_branch: initial?.github?.default_branch ?? 'main',
    github_branch_prefix: initial?.github?.branch_prefix ?? 'feature',
    code_local_path: initial?.code_graph?.local_path ?? '',
    architecture_file: initial?.architecture_file ?? '',
  })
  const [slugError, setSlugError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (mode === 'add' && form.name && !SLUG_RE.test(form.name)) {
      setSlugError('Name must be lowercase letters, numbers, and hyphens only')
    } else {
      setSlugError('')
    }
  }, [form.name, mode])

  function set(field: keyof ProjectFormInput) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const requiredFilled =
    form.name.trim() !== '' &&
    form.display_name.trim() !== '' &&
    form.jira_project_key.trim() !== '' &&
    form.github_repo.trim() !== ''
  const canSave = requiredFilled && !slugError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave(form)
      onClose()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'PROJECT_EXISTS') {
        setSaveError(`Project '${form.name}' already exists`)
      } else {
        setSaveError(String(err))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'add' ? 'Add Project' : `Edit ${initial?.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">
          {mode === 'add' ? 'Add Project' : `Edit ${initial?.name}`}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name *" htmlFor="name">
            <input
              id="name"
              value={form.name}
              onChange={set('name')}
              disabled={mode === 'edit'}
              required
              aria-required="true"
              aria-describedby={slugError ? 'name-error' : undefined}
              className="w-full rounded border px-3 py-1.5 text-sm disabled:bg-gray-50"
            />
            {slugError && (
              <p id="name-error" role="alert" className="mt-1 text-xs text-red-600">
                {slugError}
              </p>
            )}
          </Field>

          <Field label="Display Name *" htmlFor="display_name">
            <input
              id="display_name"
              value={form.display_name}
              onChange={set('display_name')}
              required
              aria-required="true"
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="Jira Project Key *" htmlFor="jira_project_key">
            <input
              id="jira_project_key"
              value={form.jira_project_key}
              onChange={set('jira_project_key')}
              required
              aria-required="true"
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="GitHub Repo * (owner/repo)" htmlFor="github_repo">
            <input
              id="github_repo"
              value={form.github_repo}
              onChange={set('github_repo')}
              required
              aria-required="true"
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="Default Branch" htmlFor="github_default_branch">
            <input
              id="github_default_branch"
              value={form.github_default_branch}
              onChange={set('github_default_branch')}
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="Branch Prefix" htmlFor="github_branch_prefix">
            <input
              id="github_branch_prefix"
              value={form.github_branch_prefix}
              onChange={set('github_branch_prefix')}
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="Local Code Path (optional)" htmlFor="code_local_path">
            <input
              id="code_local_path"
              value={form.code_local_path}
              onChange={set('code_local_path')}
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          <Field label="Architecture File" htmlFor="architecture_file">
            <input
              id="architecture_file"
              value={form.architecture_file}
              onChange={set('architecture_file')}
              placeholder="ArchitectureDesign.md"
              className="w-full rounded border px-3 py-1.5 text-sm"
            />
          </Field>

          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave || saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  )
}
