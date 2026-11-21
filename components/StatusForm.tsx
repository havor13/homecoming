"use client";

import { useEffect, useRef, useState } from "react";
import { updateStatus } from "@/lib/actions/status";
import { STATUS_MAX } from "@/lib/member-status";
import { EmojiPicker } from "./EmojiPicker";
import { useActionForm } from "./useActionForm";

export function StatusForm({ initial }: { initial: string }) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updateStatus, { resetOnSuccess: false });
  const input = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card">
      <h2>Your status</h2>
      <p className="muted">A short line others see on your profile and posts. It fades after two weeks.</p>
      <div className="field">
        <label htmlFor="statusText">What are you up to?</label>
        <input
          id="statusText"
          name="statusText"
          ref={input}
          defaultValue={initial}
          maxLength={STATUS_MAX}
          placeholder="Starting a new job, looking for a mentor..."
        />
        <div className="row">
          <EmojiPicker targetId="statusText" />
          <span className="muted">Up to {STATUS_MAX} characters</span>
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {saved && !error ? "✓ Status saved." : ""}
      </p>
      <div className="row">
        <button className="primary" disabled={pending}>{pending ? "Saving..." : "Update status"}</button>
        <button type="button" onClick={() => { if (input.current) input.current.value = ""; input.current?.focus(); }}>
          Clear
        </button>
      </div>
    </form>
  );
}
