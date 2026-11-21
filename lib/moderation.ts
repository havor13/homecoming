import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

/** Moderators are the people whose emails are listed in MODERATOR_EMAILS (comma separated). */
export function isModeratorEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.MODERATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** The moderator's id. Anyone else gets a "not found" page, so the moderation pages stay hidden. */
export async function requireModerator() {
  const userId = await requireUserId();
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!isModeratorEmail(user?.email)) notFound();
  return userId;
}
