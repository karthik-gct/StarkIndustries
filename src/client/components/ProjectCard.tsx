import type { ProjectConfig } from '../hooks/useProjects.js'

interface ProjectCardProps {
  project: ProjectConfig
  onEdit: (project: ProjectConfig) => void
  onDelete: (name: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  function handleDelete() {
    if (window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      onDelete(project.name)
    }
  }

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          aria-label={`Edit ${project.name}`}
          onClick={() => onEdit(project)}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          ✏️
        </button>
        <button
          aria-label={`Delete ${project.name}`}
          onClick={handleDelete}
          className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
        >
          🗑️
        </button>
      </div>

      {project._parseError && (
        <span className="mb-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
          Parse error
        </span>
      )}

      <h3 className="pr-16 font-semibold text-gray-900">{project.display_name}</h3>
      <p className="text-sm text-gray-500">{project.name}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500">Jira</dt>
        <dd className="text-gray-900">{project.jira?.project_key || '—'}</dd>
        <dt className="text-gray-500">GitHub</dt>
        <dd className="truncate text-gray-900">{project.github?.repo || '—'}</dd>
      </dl>

      <div className="mt-3">
        {project.code_graph?.graph_bootstrapped ? (
          <span
            aria-label="graph bootstrapped"
            className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
          >
            Indexed
          </span>
        ) : (
          <span
            aria-label="graph not bootstrapped"
            className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          >
            Not indexed
          </span>
        )}
      </div>
    </div>
  )
}
