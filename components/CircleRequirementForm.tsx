"use client";

import { updateCircleRequirement } from "@/lib/actions/circles";
import { useActionForm } from "./useActionForm";

const HELP = {
  MISSION: { label: "Which mission is this circle for?", placeholder: "For example Ghana Accra" },
  LANGUAGE: { label: "Which language is this circle for?", placeholder: "For example Twi" },
  RETURN_YEAR: { label: "Which year did members return?", placeholder: "For example 2023" },
} as const;

export function CircleRequirementForm({
  circleId,
  kind,
  current,
}: {
  circleId: string;
  kind: keyof typeof HELP;
  current: string;
}) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updateCircleRequirement, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card stack" style={{ gap: 8 }}>
      <input type="hidden" name="circleId" value={circleId} />
      <h2>Who is this circle for?</h2>
      <div className="field">
        <label htmlFor="req-value">{HELP[kind].label}</label>
        <input id="req-value" name="matchValue" maxLength={60} defaultValue={current} placeholder={HELP[kind].placeholder} />
        <span className="muted">
          Only members whose profile matches can join straight away. Anyone else can send a request, and you decide.
          Leave it blank to let everyone in.
        </span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {state?.ok && !error ? "Saved." : ""}
      </p>
      <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save"}</button>
    </form>
  );
}
