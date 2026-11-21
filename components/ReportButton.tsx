"use client";

import { createReport } from "@/lib/actions/reports";
import { REASON_LABEL, REPORT_REASONS } from "@/lib/reports";
import type { ReportTargetType } from "@/lib/reports";
import { useActionForm } from "./useActionForm";

export function ReportButton({
  targetType,
  targetId,
  compact = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  compact?: boolean;
}) {
  const { ref, onSubmit, pending, state, error } = useActionForm(createReport, { resetOnSuccess: false });
  const id = `${targetType}-${targetId}`;

  return (
    <details className="report">
      <summary className={compact ? "compact" : undefined}>Report</summary>
      {state?.ok ? (
        <p role="status" className="muted" style={{ padding: 8 }}>
          Thanks. A moderator will review this.
        </p>
      ) : (
        <form ref={ref} onSubmit={onSubmit}>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <label htmlFor={`reason-${id}`}>Why are you reporting this?</label>
          <select id={`reason-${id}`} name="reason" defaultValue="INAPPROPRIATE">
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{REASON_LABEL[r]}</option>
            ))}
          </select>
          <label htmlFor={`note-${id}`} className="muted" style={{ fontWeight: 400 }}>Anything else we should know? (optional)</label>
          <textarea id={`note-${id}`} name="note" rows={2} maxLength={500} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={pending}>{pending ? "Sending..." : "Send report"}</button>
        </form>
      )}
    </details>
  );
}
