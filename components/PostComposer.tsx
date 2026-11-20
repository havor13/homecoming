"use client";

import { createPost } from "@/lib/actions/posts";
import { ACCEPT_ATTR } from "@/lib/upload-config";
import { useActionForm } from "./useActionForm";

export function PostComposer({
  circles,
  fixedCircleId,
}: {
  circles: { id: string; name: string }[];
  fixedCircleId?: string;
}) {
  const { ref, onSubmit, pending, error } = useActionForm(createPost);

  return (
    <form ref={ref} onSubmit={onSubmit} className="card">
      <label htmlFor="post-body">Share with your mission family</label>
      <textarea id="post-body" name="body" rows={3} maxLength={2000} placeholder="A memory, a question, a job lead, a reunion idea" />
      <div className="field">
        <label htmlFor="post-files" className="muted">Add photos or files (4 MB total)</label>
        <input id="post-files" name="files" type="file" multiple accept={ACCEPT_ATTR} className="file-input" />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        {fixedCircleId ? (
          <input type="hidden" name="circleId" value={fixedCircleId} />
        ) : (
          <>
            <label htmlFor="post-circle" className="sr-only">Post to</label>
            <select id="post-circle" name="circleId" style={{ maxWidth: 260 }} defaultValue="">
              <option value="">Everyone</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </>
        )}
        <button className="primary" style={{ marginLeft: "auto" }} disabled={pending}>
          {pending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
