"use client";

import { deleteAccount } from "@/lib/actions/privacy";
import { useActionForm } from "./useActionForm";

export function DeleteAccountForm() {
  const { ref, onSubmit, pending, error } = useActionForm(deleteAccount, { resetOnSuccess: false });

  return (
    <details className="card danger-zone" style={{ maxWidth: 560 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Delete my account</summary>
      <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 12, marginTop: 12 }}>
        <p>
          This permanently removes your profile, posts, comments, messages you sent, reactions, jobs and uploaded
          files. It cannot be undone. Consider downloading your data first.
        </p>
        <div className="field">
          <label htmlFor="delete-password">Your password</label>
          <input id="delete-password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <label className="row" style={{ fontWeight: 400 }}>
          <input type="checkbox" name="confirm" style={{ width: 20, minHeight: 20 }} />
          I understand this is permanent
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="danger" disabled={pending}>{pending ? "Deleting..." : "Delete my account"}</button>
      </form>
    </details>
  );
}
