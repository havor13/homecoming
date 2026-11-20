"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { canAccessThread, canViewPost } from "@/lib/access";
import { REACTIONS } from "@/lib/reactions";

/** Adds the reaction, or removes it if this person already reacted with the same emoji. */
export async function toggleReaction(target: "post" | "message", id: string, emoji: string) {
  const userId = await requireUserId();
  if (!(REACTIONS as readonly string[]).includes(emoji)) return;

  if (target === "post") {
    if (!(await canViewPost(userId, id))) return;
    const key = { userId_postId_emoji: { userId, postId: id, emoji } };
    const existing = await db.postReaction.findUnique({ where: key });
    if (existing) await db.postReaction.delete({ where: key });
    else await db.postReaction.create({ data: { userId, postId: id, emoji } });
  } else {
    const message = await db.message.findUnique({ where: { id }, select: { threadId: true } });
    if (!message || !(await canAccessThread(userId, message.threadId))) return;
    const key = { userId_messageId_emoji: { userId, messageId: id, emoji } };
    const existing = await db.messageReaction.findUnique({ where: key });
    if (existing) await db.messageReaction.delete({ where: key });
    else await db.messageReaction.create({ data: { userId, messageId: id, emoji } });
  }

  revalidatePath("/", "layout");
}
