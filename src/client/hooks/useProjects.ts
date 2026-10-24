import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectConfig, ProjectFormInput } from '../../server/routes/config/projects.js'

export type { ProjectConfig, ProjectFormInput }

const QUERY_KEY = ['projects'] as const

async function fetchProjects(): Promise<ProjectConfig[]> {
  const res = await fetch('/api/config/projects')
  if (!res.ok) throw new Error('Failed to load projects')
  const data = await res.json() as { projects: ProjectConfig[] }
  return data.projects
}

export function useProjects() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchProjects })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProjectFormInput): Promise<ProjectConfig> => {
      const res = await fetch('/api/config/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json() as { project?: ProjectConfig; error?: string }
      if (!res.ok) throw Object.assign(new Error(data.error ?? 'Create failed'), { code: data.error })
      return data.project!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, ...input }: { name: string } & Partial<ProjectFormInput>): Promise<ProjectConfig> => {
      const res = await fetch(`/api/config/projects/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json() as { project?: ProjectConfig; error?: string }
      if (!res.ok) throw Object.assign(new Error(data.error ?? 'Update failed'), { code: data.error })
      return data.project!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<void> => {
      const res = await fetch(`/api/config/projects/${name}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw Object.assign(new Error(data.error ?? 'Delete failed'), { code: data.error })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
