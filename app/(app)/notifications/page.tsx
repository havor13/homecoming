import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { timeAgo } from "@/lib/format";
import { clearNotifications } from "@/lib/actions/notifications-list";

const ICON: Record<string, string> = {
  COMMENT: "💬",
  MENTOR: "🤝",
  INVITE: "💌",
  CONFIRMED: "✅",
  REPORT: "🛡️",
};

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const items = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Opening the list counts as reading it. The ones that were new still show highlighted on this visit.
  if (items.some((n) => !n.readAt)) {
    await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  return (
    <>
      <div className="row">
        <h1 className="grow">Notifications</h1>
        {items.length > 0 && (
          <form action={clearNotifications}>
            <button>Clear all</button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="card" style={{ maxWidth: 560 }}>
          Nothing yet. You will see comments on your posts, mentoring requests and invite updates here.
        </p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, maxWidth: 560, gap: 8 }}>
          {items.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className={`notice${n.readAt ? "" : " new"}`}>
                <span aria-hidden="true" style={{ fontSize: 22 }}>{ICON[n.type] ?? "🔔"}</span>
                <span className="grow">
                  {!n.readAt && <span className="sr-only">New: </span>}
                  {n.text}
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>{timeAgo(n.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
