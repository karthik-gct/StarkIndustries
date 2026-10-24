export interface AgentModelConfig {
  model_id: string;
  provider: string;
  stark_task_type?: string;
}

export interface ModelsConfig {
  routing_backend: 'direct' | 'stark';
  agents: Record<string, AgentModelConfig>;
}

export interface ModelsConfigResponse extends ModelsConfig {
  starkEndpointConfigured: boolean;
}
