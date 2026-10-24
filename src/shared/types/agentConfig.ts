export interface AgentLimitsConfig {
  PROD_MAX_LOOPS: number
  DEV_MAX_LOOPS: number
  QA_MAX_LOOPS: number
  DEV_COVERAGE_THRESHOLD: number
  PROD_EVAL_THRESHOLD: number
}

export const AGENT_LIMITS_CONSTRAINTS: Record<
  keyof AgentLimitsConfig,
  { min: number; max: number; label: string; description: string }
> = {
  PROD_MAX_LOOPS: { min: 1, max: 10, label: 'PROD_MAX_LOOPS', description: 'Max ProdMgmtAgent + PROD_EVALAGENT iterations' },
  DEV_MAX_LOOPS: { min: 1, max: 10, label: 'DEV_MAX_LOOPS', description: 'Max CodeAgent + DEV_EVALAGENT iterations' },
  QA_MAX_LOOPS: { min: 1, max: 10, label: 'QA_MAX_LOOPS', description: 'Max QualityAgent ↔ CodeAgent iterations' },
  DEV_COVERAGE_THRESHOLD: { min: 50, max: 100, label: 'DEV_COVERAGE_THRESHOLD', description: 'Minimum new-code coverage % for DEV_EVALAGENT pass' },
  PROD_EVAL_THRESHOLD: { min: 1, max: 10, label: 'PROD_EVAL_THRESHOLD', description: 'Minimum PROD_EVALAGENT score (0–10) to advance' },
}
