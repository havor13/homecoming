"use client";

import { useEffect, useState } from "react";

type Counts = { messages: number; notifications: number };

/** New messages and notifications. Checked every 30 seconds and when the tab is opened again. */
export function useUnread(): Counts {
  const [counts, setCounts] = useState<Counts>({ messages: 0, notifications: 0 });

  useEffect(() => {
    let stop = false;
    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Counts;
        if (stop) return;
        setCounts(data);
        // On an installed app this also puts the number on the home-screen icon where supported.
        const total = data.messages + data.notifications;
        const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
        if (total > 0) nav.setAppBadge?.(total)?.catch(() => {});
        else nav.clearAppBadge?.()?.catch(() => {});
      } catch {
        /* offline: keep the last numbers */
      }
    }
    check();
    const timer = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return counts;
}
