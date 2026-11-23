import { db } from "@/lib/db";
import { isModeratorEmail } from "@/lib/moderation";

type NotificationType = "COMMENT" | "MENTOR" | "INVITE" | "CONFIRMED" | "REPORT";

/** Adds an item to someone's notifications list. Old ones (60 days) are cleared out as we go. */
export async function createNotification(opts: { userId: string; type: NotificationType; text: string; href: string }) {
  await db.notification.create({ data: opts });
  await db.notification.deleteMany({
    where: { userId: opts.userId, createdAt: { lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
  });
}

export async function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

/** Tells every moderator (the emails in MODERATOR_EMAILS) that something needs attention. */
export async function notifyModerators(text: string, href: string) {
  const emails = (process.env.MODERATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return;
  const mods = await db.user.findMany({ where: { email: { in: emails }, suspendedAt: null }, select: { id: true, email: true } });
  for (const m of mods) {
    if (isModeratorEmail(m.email)) await createNotification({ userId: m.id, type: "REPORT", text, href });
  }
}
