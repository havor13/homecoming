"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="auth">
      <form action={action} className="card">
        <h1>Welcome back</h1>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error && <p className="error" role="alert">{state.error}</p>}
        <button className="primary" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
        <p className="muted">Have an invite code? <Link href="/join">Join Homecoming</Link></p>
      </form>
    </div>
  );
}
