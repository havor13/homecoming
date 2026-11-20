"use client";

import { requestMentoring } from "@/lib/actions/careers";
import { useActionForm } from "./useActionForm";

export function RequestMentoringForm({ mentorId, mentorName }: { mentorId: string; mentorName: string }) {
  const { ref, onSubmit, pending, error } = useActionForm(requestMentoring, { resetOnSuccess: false });

  return (
    <details className="ask">
      <summary>Ask {mentorName} for mentoring</summary>
      <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 10, marginTop: 8 }}>
        <input type="hidden" name="mentorId" value={mentorId} />
        <label htmlFor={`note-${mentorId}`}>What would you like help with?</label>
        <textarea
          id={`note-${mentorId}`}
          name="note"
          rows={4}
          maxLength={1000}
          placeholder="A little about you and what you are hoping to learn"
          required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={pending}>{pending ? "Sending..." : "Send request"}</button>
      </form>
    </details>
  );
}
