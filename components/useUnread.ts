"use client";

import { useEffect, useState } from "react";

/** How many conversations have new messages. Checked every 30 seconds and when the tab is opened again. */
export function useUnread() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stop = false;
    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (stop) return;
        setCount(data.count);
        // On an installed app this also puts the number on the home-screen icon.
        const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
        if (data.count > 0) nav.setAppBadge?.(data.count)?.catch(() => {});
        else nav.clearAppBadge?.()?.catch(() => {});
      } catch {
        /* offline: keep the last number */
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

  return count;
}
