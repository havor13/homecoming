"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions/auth";
import { useUnread } from "./useUnread";
import { Avatar } from "./Avatar";

type Item = { href: string; label: string; icon: string };

const TABS: Item[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/circles", label: "Circles", icon: "👥" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/people", label: "People", icon: "🔎" },
];

export function MobileNav({
  user,
  isModerator,
}: {
  user: { name: string; avatarUrl: string | null } | null;
  isModerator: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { messages: unread, notifications } = useUnread();

  // Close the menu whenever the page changes, and on Escape.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const more: Item[] = [
    { href: "/jobs", label: "Jobs", icon: "💼" },
    { href: "/mentors", label: "Mentors", icon: "🤝" },
    { href: "/events", label: "Reunions and events", icon: "📅" },
    { href: "/invites", label: "Invite members", icon: "💌" },
    { href: "/stories/new", label: "Add a story", icon: "✨" },
    { href: "/profile", label: "My profile", icon: "🙂" },
    { href: "/settings", label: "Privacy and settings", icon: "⚙️" },
    ...(isModerator ? [{ href: "/admin/reports", label: "Reports", icon: "🛡️" }] : []),
  ];

  return (
    <div className="mobile-only">
      <header className="m-top">
        <Link href="/" className="m-brand">Homecoming</Link>
        <div className="row" style={{ gap: 0, flexWrap: "nowrap" }}>
          <Link href="/search" className="m-icon-btn" aria-label="Search">🔍</Link>
          <Link href="/notifications" className="m-icon-btn" aria-label={notifications > 0 ? `Notifications, ${notifications} new` : "Notifications"}>
            🔔
            {notifications > 0 && <span className="count-badge tab">{notifications > 99 ? "99+" : notifications}</span>}
          </Link>
          <button type="button" className="m-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            ☰
          </button>
        </div>
      </header>

      <nav className="m-tabs" aria-label="Main">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={active(t.href) ? "on" : ""} aria-current={active(t.href) ? "page" : undefined}>
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
            {t.href === "/messages" && unread > 0 && (
              <span className="count-badge tab" aria-label={`${unread} conversations with new messages`}>{unread > 99 ? "99+" : unread}</span>
            )}
          </Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-label="More">
          <span aria-hidden="true">☰</span>
          More
        </button>
      </nav>

      {open && (
        <div className="m-overlay" onClick={() => setOpen(false)}>
          <div className="m-drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="row">
              {user && <Avatar name={user.name} url={user.avatarUrl} size={40} />}
              <strong className="grow">{user?.name ?? "Menu"}</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
            </div>
            <nav className="stack" style={{ gap: 4 }} aria-label="More">
              {more.map((i) => (
                <Link key={i.href} href={i.href} className={active(i.href) ? "on" : ""}>
                  <span aria-hidden="true">{i.icon}</span> {i.label}
                </Link>
              ))}
              <Link href="/terms"><span aria-hidden="true">📄</span> Terms of use</Link>
              <Link href="/guidelines"><span aria-hidden="true">📖</span> Community guidelines</Link>
              <Link href="/privacy"><span aria-hidden="true">🔒</span> Privacy</Link>
            </nav>
            <form action={logout}>
              <button type="submit" style={{ width: "100%" }}>Sign out</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
