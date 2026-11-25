"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { REACTIONS } from "@/lib/reactions";
import { createNotification } from "@/lib/notifications";
import { deleteBlobs, pickFiles, tryUpload } from "@/lib/upload";
import { STORY_BG_KEYS, STORY_HOURS, STORY_MAX_CHARS } from "@/lib/stories";
import { storyWhere } from "@/lib/story-queries";
import { findOrCreateDirectThread } from "@/lib/threads";
import { notifyNewMessage } from "@/lib/notify";
import { canMessage } from "@/lib/privacy";
import type { FormState } from "@/lib/types";

const schema = z.object({
  body: z.string().trim().max(STORY_MAX_CHARS, `Keep it under ${STORY_MAX_CHARS} characters.`),
  bg: z.enum(STORY_BG_KEYS),
});

/** Removes stories past their 24 hours, and their photos. Runs whenever someone posts a story. */
async function purgeExpired() {
  const old = await db.story.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true, imageUrl: true },
    take: 50,
  });
  if (old.length === 0) return;
  await db.story.deleteMany({ where: { id: { in: old.map((s) => s.id) } } });
  await deleteBlobs(old.flatMap((s) => (s.imageUrl ? [s.imageUrl] : [])));
}

export async function createStory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = schema.safeParse({ body: formData.get("body") ?? "", bg: formData.get("bg") ?? "green" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const files = pickFiles(formData, "image");
  if (files.length > 1) return { error: "A story can have one photo." };
  if (files[0] && !files[0].type.startsWith("image/")) return { error: "Stories can only use a photo." };
  if (!parsed.data.body && files.length === 0) return { error: "Write something or add a photo." };

  const active = await db.story.count({ where: { authorId: userId, expiresAt: { gt: new Date() } } });
  if (active >= 10) return { error: "You have 10 stories live. Wait for one to expire or delete one." };

  const upload = await tryUpload(files, "stories", userId);
  if (!upload.ok) return { error: upload.error };

  await db.story.create({
    data: {
      authorId: userId,
      body: parsed.data.body,
      bg: parsed.data.bg,
      imageUrl: upload.files[0]?.url ?? null,
      expiresAt: new Date(Date.now() + STORY_HOURS * 60 * 60 * 1000),
    },
  });
  await purgeExpired();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Called when a story is shown to someone other than its author. */
export async function markStorySeen(storyId: string) {
  const userId = await requireUserId();
  const story = await db.story.findFirst({
    where: { id: storyId, authorId: { not: userId }, ...(await storyWhere(userId)) },
    select: { id: true },
  });
  if (!story) return;
  await db.storyView.upsert({
    where: { storyId_userId: { storyId, userId } },
    create: { storyId, userId },
    update: {},
  });
}

export async function deleteStory(formData: FormData) {
  const userId = await requireUserId();
  const storyId = String(formData.get("storyId") ?? "");
  const story = await db.story.findUnique({ where: { id: storyId }, select: { authorId: true, imageUrl: true } });
  if (!story || story.authorId !== userId) return;

  await db.story.delete({ where: { id: storyId } });
  if (story.imageUrl) await deleteBlobs([story.imageUrl]);
  revalidatePath("/", "layout");
  redirect("/");
}

/** Reacts to someone else's story. Tapping the same emoji again removes it; a different one replaces it. */
export async function reactToStory(storyId: string, emoji: string) {
  const userId = await requireUserId();
  if (!(REACTIONS as readonly string[]).includes(emoji)) return;

  const story = await db.story.findFirst({
    where: { id: storyId, authorId: { not: userId }, ...(await storyWhere(userId)) },
    select: { id: true, authorId: true },
  });
  if (!story) return;

  const key = { storyId_userId: { storyId, userId } };
  const existing = await db.storyReaction.findUnique({ where: key });
  if (existing?.emoji === emoji) {
    await db.storyReaction.delete({ where: key });
    return;
  }
  await db.storyReaction.upsert({ where: key, create: { storyId, userId, emoji }, update: { emoji } });

  const me = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  await createNotification({
    userId: story.authorId,
    type: "STORY",
    text: `${me?.name ?? "Someone"} reacted ${emoji} to your story`,
    href: `/stories/${story.authorId}`,
  });
}

/** Sends a private reply to someone's story as a direct message. Blocks and message settings apply. */
export async function replyToStory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const storyId = String(formData.get("storyId") ?? "");

  const reply = z.string().trim().min(1, "Write a reply first.").max(500, "Replies can be up to 500 characters.").safeParse(formData.get("body"));
  if (!reply.success) return { error: reply.error.issues[0].message };

  const story = await db.story.findFirst({
    where: { id: storyId, authorId: { not: userId }, ...(await storyWhere(userId)) },
    select: { authorId: true },
  });
  if (!story) return { error: "This story is no longer available." };
  if (!(await canMessage(userId, story.authorId))) return { error: "You can't message this person." };

  const thread = await findOrCreateDirectThread(userId, story.authorId);
  await db.message.create({
    data: { threadId: thread.id, senderId: userId, body: `↩️ Replied to your story: ${reply.data}` },
  });
  after(() => notifyNewMessage(thread.id, userId));
  revalidatePath("/", "layout");
  return { ok: true };
}
