"use client";

import { createComment } from "@/lib/actions/posts";
import { useActionForm } from "./useActionForm";

export function CommentForm({ postId }: { postId: string }) {
  const { ref, onSubmit, pending, error } = useActionForm(createComment);

  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 6 }}>
      <input type="hidden" name="postId" value={postId} />
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <label htmlFor={`comment-${postId}`} className="sr-only">Write a comment</label>
        <input id={`comment-${postId}`} name="body" className="grow" placeholder="Write a comment" maxLength={1000} autoComplete="off" />
        <button disabled={pending}>{pending ? "..." : "Reply"}</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
