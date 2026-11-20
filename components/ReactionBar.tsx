"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { toggleReaction } from "@/lib/actions/reactions";
import { REACTIONS } from "@/lib/reactions";
import type { ReactionSummary } from "@/lib/reactions";

export function ReactionBar({
  target,
  id,
  summary,
}: {
  target: "post" | "message";
  id: string;
  summary: ReactionSummary[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function react(emoji: string) {
    setOpen(false);
    startTransition(async () => {
      await toggleReaction(target, id, emoji);
    });
  }

  return (
    <div ref={ref} className="reactions">
      {summary.map((s) => (
        <button
          key={s.emoji}
          type="button"
          className={`reaction${s.mine ? " on" : ""}`}
          aria-pressed={s.mine}
          aria-label={`${s.emoji} ${s.count}${s.mine ? ", you reacted" : ""}`}
          onClick={() => react(s.emoji)}
        >
          <span aria-hidden="true">{s.emoji}</span> {s.count}
        </button>
      ))}
      <button
        type="button"
        className="reaction"
        aria-label="Add a reaction"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">🙂 +</span>
      </button>
      {open && (
        <div className="react-row" role="group" aria-label="Pick a reaction">
          {REACTIONS.map((emoji) => (
            <button key={emoji} type="button" className="emoji-btn" aria-label={`React ${emoji}`} onClick={() => react(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
