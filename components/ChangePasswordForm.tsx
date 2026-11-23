"use client";

import { changePassword, signOutEverywhere } from "@/lib/actions/password";
import { useActionForm } from "./useActionForm";

export function ChangePasswordForm({ justChanged }: { justChanged: boolean }) {
  const { ref, onSubmit, pending, error } = useActionForm(changePassword, { resetOnSuccess: true });

  return (
    <section className="card" style={{ maxWidth: 560 }}>
      <h2>Password and devices</h2>
      {justChanged && (
        <p role="status" style={{ color: "var(--accent-dark)", fontWeight: 600 }}>
          ✓ Password changed. Every other device has been signed out.
        </p>
      )}
      <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor="current">Current password</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required />
        </div>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Type the new password again</label>
          <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={pending}>{pending ? "Saving..." : "Change password"}</button>
      </form>

      <hr />
      <p className="muted">Lost a phone, or used a shared computer? Sign out on every device, including this one.</p>
      <form action={signOutEverywhere}>
        <button>Sign out on all devices</button>
      </form>
    </section>
  );
}
