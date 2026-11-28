"use client";

import { updateCircle } from "@/lib/actions/circles";
import { useActionForm } from "./useActionForm";

export function CircleEditForm({
  circleId,
  name,
  description,
  visibility,
}: {
  circleId: string;
  name: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE";
}) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updateCircle, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="circleId" value={circleId} />
      <div className="field">
        <label htmlFor="edit-name">Circle name</label>
        <input id="edit-name" name="name" defaultValue={name} maxLength={60} required />
      </div>
      <div className="field">
        <label htmlFor="edit-description">What is it for?</label>
        <textarea id="edit-description" name="description" defaultValue={description} rows={3} maxLength={300} required />
      </div>
      <div className="field">
        <label htmlFor="edit-visibility">Who can join?</label>
        <select id="edit-visibility" name="visibility" defaultValue={visibility}>
          <option value="PUBLIC">Public: matching members can join</option>
          <option value="PRIVATE">Private: you approve each request</option>
        </select>
        <span className="muted">Members already in the circle stay in, whichever you choose.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {state?.ok && !error ? "Saved." : ""}
      </p>
      <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
    </form>
  );
}
