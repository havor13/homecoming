"use client";

import { useEffect, useRef, useState } from "react";

const GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Smileys",
    items: ["😀", "😄", "😁", "😂", "🤣", "😊", "🙂", "😉", "😍", "🥰", "😘", "😎", "🤗", "🥹", "😇", "🤔", "😅", "😮", "😢", "😭", "😴", "🤯", "😬", "🙃"],
  },
  {
    label: "Hands and hearts",
    items: ["👍", "👏", "🙌", "🙏", "🤝", "💪", "👋", "✌️", "🫶", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "💯", "🔥", "✨", "🌟"],
  },
  {
    label: "Mission life",
    items: ["📖", "🕊️", "🌍", "✈️", "🎒", "🚌", "🚲", "🏠", "📚", "🎓", "💼", "🍽️", "🥘", "🍰", "☕", "📸", "🎶", "🎵"],
  },
  {
    label: "Celebrate and nature",
    items: ["🎉", "🎊", "🎈", "🎂", "🎁", "🌅", "☀️", "🌈", "🌊", "⛰️", "🌴", "🌸", "🍎", "⚽", "🏀"],
  },
];

export function EmojiPicker({
  targetId,
  placement = "down",
}: {
  targetId: string;
  placement?: "up" | "down";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
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

  function insert(emoji: string) {
    const el = document.getElementById(targetId);
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
    const caret = start + emoji.length;
    el.setSelectionRange(caret, caret);
    el.focus();
  }

  return (
    <div ref={wrapRef} className="emoji-wrap">
      <button
        type="button"
        aria-label="Add an emoji"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ padding: "0 12px", fontSize: 20 }}
      >
        <span aria-hidden="true">🙂</span>
      </button>
      {open && (
        <div className={`emoji-pop ${placement}`} role="dialog" aria-label="Emoji">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <div className="muted" style={{ padding: "4px 6px" }}>{g.label}</div>
              <div className="emoji-grid">
                {g.items.map((e) => (
                  <button key={e} type="button" className="emoji-btn" aria-label={e} onClick={() => insert(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
