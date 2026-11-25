"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { replyToStory } from "@/lib/actions/stories";
import { useActionForm } from "./useActionForm";

export function StoryReplyForm({ storyId, name }: { storyId: string; name: string }) {
  const { ref, onSubmit, pending, state, error } = useActionForm(replyToStory);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    setSent(true);
    const t = setTimeout(() => setSent(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  const first = name.split(" ")[0];
  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 6 }}>
      <input type="hidden" name="storyId" value={storyId} />
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <label htmlFor={`reply-${storyId}`} className="sr-only">Reply to {name}&rsquo;s story</label>
        <input
          id={`reply-${storyId}`}
          name="body"
          className="grow"
          maxLength={500}
          autoComplete="off"
          placeholder={`Reply to ${first}`}
        />
        <button className="primary" disabled={pending}>{pending ? "Sending..." : "Send"}</button>
      </div>
      <p className="muted">Your reply goes to {first} as a private message.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>
        {sent && !error ? <>✓ Sent. <Link href="/messages">Open messages</Link></> : ""}
      </p>
    </form>
  );
}
