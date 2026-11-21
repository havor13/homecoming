"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { canAccessThread } from "@/lib/access";
import { findOrCreateDirectThread } from "@/lib/threads";
import { notifyNewMessage } from "@/lib/notify";
import { canMessage, directThreadBlocked } from "@/lib/privacy";
import { pickFiles, tryUpload } from "@/lib/upload";
import type { FormState } from "@/lib/types";

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const threadId = String(formData.get("threadId") ?? "");
  if (!(await canAccessThread(userId, threadId))) {
    return { error: "You can't post in this conversation." };
  }
  if (await directThreadBlocked(threadId, userId)) {
    return { error: "You can't send messages in this conversation." };
  }

  const body = z.string().trim().max(2000, "Messages can be up to 2,000 characters.").safeParse(formData.get("body") ?? "");
  if (!body.success) return { error: body.error.issues[0].message };

  const files = pickFiles(formData, "files");
  if (!body.data && files.length === 0) return { error: "Write a message or attach a file." };

  const upload = await tryUpload(files, "chat", userId);
  if (!upload.ok) return { error: upload.error };

  await db.message.create({
    data: { threadId, senderId: userId, body: body.data, attachments: { create: upload.files } },
  });
  after(() => notifyNewMessage(threadId, userId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function startDirectThread(otherUserId: string) {
  const userId = await requireUserId();
  if (otherUserId === userId) return;

  const other = await db.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) return;

  // Blocks and "who can message me" settings apply. The messages page explains the refusal.
  if (!(await canMessage(userId, otherUserId))) redirect("/messages?notice=unavailable");

  const thread = await findOrCreateDirectThread(userId, otherUserId);
  redirect(`/messages?t=${thread.id}`);
}

export async function createGroupChat(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const title = z.string().trim().min(2, "Give the group a name.").max(80).safeParse(formData.get("title"));
  if (!title.success) return { error: title.error.issues[0].message };

  const ids = [...new Set(formData.getAll("members").map(String))].filter((id) => id && id !== userId);
  if (ids.length < 2) return { error: "Pick at least two people for a group chat." };
  if (ids.length > 49) return { error: "Group chats can have up to 50 people." };

  const found = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (found.length !== ids.length) return { error: "Some of those people could not be found." };

  for (const id of ids) {
    if (!(await canMessage(userId, id))) {
      return { error: "Some of those people can't be added to a group chat. Try removing a few." };
    }
  }

  const thread = await db.thread.create({
    data: {
      title: title.data,
      members: { create: [userId, ...ids].map((id) => ({ userId: id })) },
    },
  });
  revalidatePath("/", "layout");
  redirect(`/messages?t=${thread.id}`);
}
