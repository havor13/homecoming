"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/password";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.ok) {
    return (
      <div className="auth">
        <div className="card">
          <h1>Password updated</h1>
          <p role="status">You can now sign in with your new password.</p>
          <Link href="/login" className="button">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <form action={action} className="card">
        <h1>Choose a new password</h1>
        <input type="hidden" name="token" value={token} />
        <div className="field">
          <label htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="field">
          <label htmlFor="confirm">Type it again</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {state?.error && <p className="error" role="alert">{state.error}</p>}
        <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save new password"}</button>
        <p className="muted">Link expired? <Link href="/forgot-password">Ask for a new one</Link></p>
      </form>
    </div>
  );
}
