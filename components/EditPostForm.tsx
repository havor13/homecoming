"use client";

import { useEffect, useState } from "react";
import { editPost } from "@/lib/actions/posts";
import { useActionForm } from "./useActionForm";

export function EditPostForm({ postId, body }: { postId: string; body: string }) {
  const [open, setOpen] = useState(false);
  const { ref, onSubmit, pending, state, error } = useActionForm(editPost, { resetOnSuccess: false });

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <div>
        <button type="button" className="link" onClick={() => setOpen(true)}>Edit text</button>
      </div>
    );
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="postId" value={postId} />
      <label className="sr-only" htmlFor={`edit-${postId}`}>Edit your post</label>
      <textarea id={`edit-${postId}`} name="body" defaultValue={body} rows={4} maxLength={2000} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="primary" disabled={pending}>{pending ? "Saving..." : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
