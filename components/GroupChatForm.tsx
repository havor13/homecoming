"use client";

import { createGroupChat } from "@/lib/actions/chat";
import { Avatar } from "./Avatar";
import { useActionForm } from "./useActionForm";

type Person = { id: string; name: string; missionName: string | null; avatarUrl: string | null };

export function GroupChatForm({ people }: { people: Person[] }) {
  const { ref, onSubmit, pending, error } = useActionForm(createGroupChat, { resetOnSuccess: false });

  return (
    <form ref={ref} onSubmit={onSubmit} className="card" style={{ maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="title">Group name</label>
        <input id="title" name="title" maxLength={80} required />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Who is in it? Pick at least two people.</legend>
        <div className="pick-list">
          {people.map((p) => (
            <label key={p.id} className="pick">
              <input type="checkbox" name="members" value={p.id} style={{ width: 20, minHeight: 20 }} />
              <Avatar name={p.name} url={p.avatarUrl} size={32} />
              <span className="grow">
                <strong style={{ fontWeight: 600 }}>{p.name}</strong>
                {p.missionName && <span className="muted"> · {p.missionName}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={pending}>{pending ? "Creating..." : "Create group chat"}</button>
    </form>
  );
}
