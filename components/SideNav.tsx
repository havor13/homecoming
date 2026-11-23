"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnread } from "./useUnread";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/circles", label: "Mission circles", icon: "👥" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/people", label: "People", icon: "👥" },
  { href: "/jobs", label: "Jobs", icon: "💼" },
  { href: "/mentors", label: "Mentors", icon: "🤝" },
  { href: "/events", label: "Reunions and events", icon: "📅" },
  { href: "/invites", label: "Invite members", icon: "💌" },
  { href: "/stories/new", label: "Add a story", icon: "✨" },
  { href: "/profile", label: "My profile", icon: "🙂" },
  { href: "/settings", label: "Privacy and settings", icon: "⚙️" },
];

export function SideNav({ isModerator }: { isModerator: boolean }) {
  const path = usePathname();
  const { messages, notifications } = useUnread();
  const countFor = (href: string) => (href === "/messages" ? messages : href === "/notifications" ? notifications : 0);
  const items = isModerator ? [...ITEMS, { href: "/admin/reports", label: "Reports", icon: "🛡️" }] : ITEMS;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <nav className="nav" aria-label="Main">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={active(i.href) ? "on" : ""} aria-current={active(i.href) ? "page" : undefined}>
          <span className="nav-icon" aria-hidden="true">{i.icon}</span>
          {i.label}
          {countFor(i.href) > 0 && (
            <span className="count-badge" aria-label={`${countFor(i.href)} new`}>{countFor(i.href) > 99 ? "99+" : countFor(i.href)}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
