"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { createPost } from "@/lib/actions/posts";
import { ACCEPT_ATTR, MAX_VIDEO_BYTES, VIDEO_ACCEPT_ATTR, VIDEO_FOLDER, VIDEO_TYPES } from "@/lib/upload-config";
import { EmojiPicker } from "./EmojiPicker";
import { useActionForm } from "./useActionForm";

export function PostComposer({
  circles,
  fixedCircleId,
  userId,
}: {
  circles: { id: string; name: string }[];
  fixedCircleId?: string;
  userId: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);

  // A video is too big for a server action, so it goes straight to storage first and the
  // post only carries its address.
  const { ref, onSubmit, pending, error } = useActionForm(createPost, {
    prepare: async (formData) => {
      const video = formData.get("video");
      formData.delete("video");
      if (!(video instanceof File) || video.size === 0) return undefined;

      if (!(VIDEO_TYPES as readonly string[]).includes(video.type)) return "Videos can be MP4, WebM or MOV.";
      if (video.size > MAX_VIDEO_BYTES) return "Videos can be up to 50 MB.";

      const safe = video.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-60);
      setProgress(0);
      try {
        const blob = await upload(`${VIDEO_FOLDER}/${userId}/${safe}`, video, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          contentType: video.type,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        formData.set("videoUrl", blob.url);
        formData.set("videoName", video.name.slice(0, 200));
      } catch {
        return "The video could not be uploaded. Check your connection and try again.";
      } finally {
        setProgress(null);
      }
      return undefined;
    },
  });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card">
      <label htmlFor="post-body">Share with your mission family</label>
      <textarea id="post-body" name="body" rows={3} maxLength={2000} placeholder="A memory, a question, a job lead, a reunion idea" />
      <div className="field">
        <label htmlFor="post-files" className="muted">Add photos or files (4 MB total)</label>
        <input id="post-files" name="files" type="file" multiple accept={ACCEPT_ATTR} className="file-input" />
      </div>
      <div className="field">
        <label htmlFor="post-video" className="muted">Add a video (MP4, WebM or MOV, up to 50 MB)</label>
        <input id="post-video" name="video" type="file" accept={VIDEO_ACCEPT_ATTR} className="file-input" />
      </div>
      {progress !== null && (
        <p role="status" className="muted">Uploading video... {progress}%</p>
      )}
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
        <EmojiPicker targetId="post-body" />
        <button className="primary" style={{ marginLeft: "auto" }} disabled={pending}>
          {progress !== null ? "Uploading..." : pending ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
