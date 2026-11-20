"use client";

import { useEffect, useRef } from "react";

/** The scrolling message list. Jumps to the newest message when the count changes. */
export function ChatLog({ count, children }: { count: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  return (
    <div ref={ref} className="msgs" role="log" aria-live="polite" aria-label="Messages">
      {children}
    </div>
  );
}
