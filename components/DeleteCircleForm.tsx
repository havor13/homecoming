"use client";

import { deleteCircle } from "@/lib/actions/circles";
import { useActionForm } from "./useActionForm";

export function DeleteCircleForm({ circleId, name }: { circleId: string; name: string }) {
  const { ref, onSubmit, pending, error } = useActionForm(deleteCircle, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="circleId" value={circleId} />
      <p>
        This permanently deletes <strong>{name}</strong>, with all of its posts, chat messages, files and memberships.
        It can&rsquo;t be undone.
      </p>
      <div className="field">
        <label htmlFor="confirm-delete">Type the circle&rsquo;s name to confirm</label>
        <input id="confirm-delete" name="confirm" autoComplete="off" placeholder={name} required />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="danger" disabled={pending}>{pending ? "Deleting..." : "Delete this circle"}</button>
    </form>
  );
}
