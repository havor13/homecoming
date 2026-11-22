"use client";

import { useEffect, useState } from "react";
import { createInvites } from "@/lib/actions/invites";
import { useActionForm } from "./useActionForm";

export function InviteForm({ moderator }: { moderator: boolean }) {
  const { ref, onSubmit, pending, state, error } = useActionForm(createInvites);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <h2>Create an invite code</h2>
      <div className="field">
        <label htmlFor="invite-note">Who is it for? (optional, only you see this)</label>
        <input id="invite-note" name="note" maxLength={60} placeholder="For example, Elder Mensah, Ghana Accra Mission" />
      </div>
      {moderator && (
        <div className="field">
          <label htmlFor="invite-count">How many codes?</label>
          <input id="invite-count" name="count" type="number" min={1} max={20} defaultValue={1} />
          <span className="muted">People you invite as a moderator are confirmed straight away.</span>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {saved && !error ? "✓ Code created below." : ""}
      </p>
      <button className="primary" disabled={pending}>{pending ? "Creating..." : "Create code"}</button>
    </form>
  );
}
