import { isSessionId } from "./session";
export type SafeContext = { session?: string; stage?: string; error_code?: string; failed_action?: string; affected_record_count?: number; audit_reference?: string };
export const actions = ["discovery", "mapping", "migration", "validation", "configuration", "onboarding", "first_productive_use"];
export function safeContext(query: URLSearchParams): SafeContext {
  const result: SafeContext = {};
  const session = query.get("session") ?? "";
  if (isSessionId(session)) result.session = session;
  const stage = query.get("stage") ?? "";
  if (/^[0-4]$/.test(stage)) result.stage = stage;
  const code = query.get("error_code") ?? "";
  if (/^MB-[A-Z_]{1,48}$/.test(code)) result.error_code = code;
  const action = query.get("failed_action") ?? "";
  if (actions.includes(action)) result.failed_action = action;
  const count = query.get("affected_record_count") ?? "";
  if (/^\d{1,6}$/.test(count)) result.affected_record_count = Number(count);
  const audit = query.get("audit_reference") ?? "";
  if (isSessionId(audit)) result.audit_reference = audit;
  return result;
}
export function contextQuery(context: SafeContext) {
  return new URLSearchParams(Object.entries(context).map(([key, value]) => [key, String(value)])).toString();
}
