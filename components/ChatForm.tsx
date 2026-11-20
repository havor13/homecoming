"use client";

import { sendMessage } from "@/lib/actions/chat";
import { ACCEPT_ATTR } from "@/lib/upload-config";
import { useActionForm } from "./useActionForm";

export function ChatForm({ threadId }: { threadId: string }) {
  const { ref, onSubmit, pending, error } = useActionForm(sendMessage);

  return (
    <form ref={ref} onSubmit={onSubmit} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="threadId" value={threadId} />
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <label htmlFor={`msg-${threadId}`} className="sr-only">Write a message</label>
        <input id={`msg-${threadId}`} name="body" className="grow" placeholder="Write a message" maxLength={2000} autoComplete="off" />
        <button className="primary" disabled={pending}>{pending ? "Sending..." : "Send"}</button>
      </div>
      <div className="row">
        <label htmlFor={`files-${threadId}`} className="muted">Attach photos or files (4 MB total)</label>
        <input id={`files-${threadId}`} name="files" type="file" multiple accept={ACCEPT_ATTR} className="file-input" />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
