import type { Alert, Category, Severity } from '../domain/types.js';
import { severityMeetsMin } from '../domain/severity.js';

export type MatchableEvent = {
  category: Category;
  severity: Severity;
};

export function alertMatchesEvent(alert: Alert, event: MatchableEvent): boolean {
  if (!alert.enabled) {
    return false;
  }
  if (!alert.categories.includes(event.category)) {
    return false;
  }
  return severityMeetsMin(event.severity, alert.minSeverity);
}

export function matchAlerts(alerts: Alert[], event: MatchableEvent): Alert[] {
  return alerts.filter((alert) => alertMatchesEvent(alert, event));
}
