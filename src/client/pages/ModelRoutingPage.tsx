<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RoutingToggle from '../components/RoutingToggle.js';
import StarkWarningBanner from '../components/StarkWarningBanner.js';
import AgentRow from '../components/AgentRow.js';
import { KNOWN_AGENTS } from '../constants/modelOptions.js';
import type { ModelsConfigResponse } from '../../server/types/modelsConfig.js';

async function fetchModels(): Promise<ModelsConfigResponse> {
  const res = await fetch('/api/config/models');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ModelsConfigResponse>;
}

async function saveModels(data: Partial<ModelsConfigResponse>): Promise<void> {
  const res = await fetch('/api/config/models', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
}

export default function ModelRoutingPage() {
  const queryClient = useQueryClient();
  const { data: serverData, isLoading, error } = useQuery({ queryKey: ['models'], queryFn: fetchModels });

  const [formData, setFormData] = useState<ModelsConfigResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (serverData && !formData) setFormData(structuredClone(serverData));
  }, [serverData, formData]);

  const isDirty = formData && serverData
    ? JSON.stringify({ routing_backend: formData.routing_backend, agents: formData.agents }) !==
      JSON.stringify({ routing_backend: serverData.routing_backend, agents: serverData.agents })
    : false;

  const mutation = useMutation({
    mutationFn: saveModels,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setToast('Model routing saved successfully');
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: Error) => setToast(`Save failed: ${err.message}`),
  });

  const handleRoutingChange = (val: 'direct' | 'stark') => {
    setFormData((prev) => prev ? { ...prev, routing_backend: val } : prev);
  };

  const handleModelChange = (agentKey: string, modelId: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        agents: {
          ...prev.agents,
          [agentKey]: { ...prev.agents[agentKey]!, model_id: modelId },
        },
      };
    });
  };

  const handleSave = () => {
    if (!formData || !serverData) return;
    mutation.mutate({
      routing_backend: formData.routing_backend,
      agents: formData.agents,
    });
  };

  const handleReset = () => {
    if (serverData) setFormData(structuredClone(serverData));
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading model configuration…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!formData) return null;

  const showStarkWarning = formData.routing_backend === 'stark' && !formData.starkEndpointConfigured;
  const knownAgentRows = KNOWN_AGENTS.filter((k) => formData.agents[k]);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Model Routing</h1>

      {toast && (
        <div role="status" className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <RoutingToggle value={formData.routing_backend} onChange={handleRoutingChange} />
      </div>

      {showStarkWarning && (
        <div className="mb-6">
          <StarkWarningBanner show={showStarkWarning} />
        </div>
      )}

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="pb-2 pr-4">Agent</th>
            <th className="pb-2 pr-4">Provider</th>
            <th className="pb-2">Model</th>
          </tr>
        </thead>
        <tbody>
          {knownAgentRows.map((key) => (
            <AgentRow
              key={key}
              agentKey={key}
              config={formData.agents[key]!}
              onChange={handleModelChange}
            />
          ))}
        </tbody>
      </table>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || mutation.isPending}
          aria-disabled={!isDirty || mutation.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleReset}
          disabled={!isDirty}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Reset
        </button>
      </div>
=======
export function ModelRoutingPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Model Routing</h2>
      <p className="mt-2 text-gray-500">Coming soon</p>
>>>>>>> origin/main
    </div>
  );
}
