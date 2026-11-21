"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/password";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="auth">
      <form action={action} className="card">
        <h1>Forgot your password?</h1>
        <p className="muted">Enter the email you joined with and we will send you a link to choose a new one.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {state?.error && <p className="error" role="alert">{state.error}</p>}
        {state?.ok && <p role="status" style={{ color: "var(--accent-dark)", fontWeight: 600 }}>{state.message}</p>}
        <button className="primary" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</button>
        <p className="muted"><Link href="/login">Back to sign in</Link></p>
      </form>
    </div>
  );
}
