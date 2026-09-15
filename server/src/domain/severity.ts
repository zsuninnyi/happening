import type { Severity } from './types.js';

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function severityRank(severity: Severity): number {
  return SEVERITY_RANK[severity];
}

/** True when event severity meets or exceeds the alert threshold. */
export function severityMeetsMin(eventSeverity: Severity, minSeverity: Severity): boolean {
  return severityRank(eventSeverity) >= severityRank(minSeverity);
}
