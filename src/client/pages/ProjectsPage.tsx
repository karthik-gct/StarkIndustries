<<<<<<< HEAD
import { useState } from 'react'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects.js'
import type { ProjectConfig, ProjectFormInput } from '../hooks/useProjects.js'
import { ProjectCard } from '../components/ProjectCard.js'
import { ProjectModal } from '../components/ProjectModal.js'

export function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; project?: ProjectConfig } | null>(null)

  async function handleSave(data: ProjectFormInput) {
    if (modal?.mode === 'add') {
      await createProject.mutateAsync(data)
    } else if (modal?.project) {
      await updateProject.mutateAsync({ name: modal.project.name, ...data })
    }
  }

  async function handleDelete(name: string) {
    await deleteProject.mutateAsync(name)
  }

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading projects…</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load projects directory. Ensure the Mark3 server is started from its root directory.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
        <button
          aria-label="Add Project"
          onClick={() => setModal({ mode: 'add' })}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      {projects && projects.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500">No projects yet</p>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              onEdit={(p) => setModal({ mode: 'edit', project: p })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          mode={modal.mode}
          initial={modal.project}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
=======
export function ProjectsPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
      <p className="mt-2 text-gray-500">Coming soon</p>
    </div>
  );
>>>>>>> origin/main
}
