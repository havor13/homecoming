"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { join } from "@/lib/actions/auth";

export default function JoinPage() {
  const [state, action, pending] = useActionState(join, undefined);
  const codeInput = useRef<HTMLInputElement>(null);

  // An invite link looks like /join?code=HOME-ABC123 and fills the code in.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && codeInput.current) codeInput.current.value = code;
  }, []);

  return (
    <div className="auth">
      <form action={action} className="card">
        <h1>Join Homecoming</h1>
        <p className="muted">Open to returned missionaries who are invited by another member.</p>
        <div className="field">
          <label htmlFor="inviteCode">Invite code</label>
          <input id="inviteCode" name="inviteCode" ref={codeInput} placeholder="HOME-0000" required />
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="field">
          <label htmlFor="missionName">Mission name</label>
          <input id="missionName" name="missionName" placeholder="For example, Ghana Cape Coast Mission" required />
        </div>
        <div className="field">
          <label htmlFor="language">Language (optional)</label>
          <input id="language" name="language" />
        </div>
        <div className="field">
          <label htmlFor="yearsServed">Years served (optional)</label>
          <input id="yearsServed" name="yearsServed" />
        </div>
        {state?.error && <p className="error" role="alert">{state.error}</p>}
        <button className="primary" disabled={pending}>{pending ? "Creating account..." : "Create account"}</button>
        <p className="muted">Already a member? <Link href="/login">Sign in</Link></p>
        <p className="muted">By creating an account you agree to the <Link href="/terms">terms</Link>, the <Link href="/guidelines">community guidelines</Link> and the <Link href="/privacy">privacy notice</Link>.</p>
        <p className="muted">An independent community. Not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints.</p>
      </form>
    </div>
  );
}
