export const ANTHROPIC_MODELS = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-8',
];

export const MODEL_OPTIONS_BY_PROVIDER: Record<string, string[]> = {
  anthropic: ANTHROPIC_MODELS,
};

export const KNOWN_AGENTS = ['prod_mgmt', 'design', 'code', 'quality', 'prod_eval', 'dev_eval'];

export const AGENT_LABELS: Record<string, string> = {
  prod_mgmt: 'ProdMgmtAgent',
  design: 'DesignAgent',
  code: 'CodeAgent',
  quality: 'QualityAgent',
  prod_eval: 'PROD_EVALAGENT',
  dev_eval: 'DEV_EVALAGENT',
};
