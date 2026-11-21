"use client";

import { useEffect, useState } from "react";
import { updateNotifications } from "@/lib/actions/notifications";
import { useActionForm } from "./useActionForm";

export function NotificationForm({ emailMessages, emailActivity }: { emailMessages: boolean; emailActivity: boolean }) {
  const { ref, onSubmit, pending, state, error } = useActionForm(updateNotifications, { resetOnSuccess: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <h2>Email notifications</h2>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="emailMessages" defaultChecked={emailMessages} style={{ width: 20, minHeight: 20 }} />
        Email me when I get a new message (at most one email every 30 minutes per conversation)
      </label>
      <label className="row" style={{ fontWeight: 400 }}>
        <input type="checkbox" name="emailActivity" defaultChecked={emailActivity} style={{ width: 20, minHeight: 20 }} />
        Email me about comments on my posts and mentoring requests
      </label>
      <p className="muted">Emails never include the text of your messages, only who wrote and a link.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {saved && !error ? "✓ Email settings saved." : ""}
      </p>
      <button className="primary" disabled={pending}>{saved ? "Saved ✓" : pending ? "Saving..." : "Save email settings"}</button>
    </form>
  );
}
