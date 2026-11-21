"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { deleteBlobs } from "@/lib/upload";
import type { FormState } from "@/lib/types";

const settingsSchema = z.object({
  profileVisibility: z.enum(["EVERYONE", "CIRCLES"]),
  whoCanMessage: z.enum(["EVERYONE", "CIRCLES"]),
});

export async function updatePrivacy(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Pick one of the options." };

  await db.user.update({
    where: { id: userId },
    data: {
      profileVisibility: parsed.data.profileVisibility,
      whoCanMessage: parsed.data.whoCanMessage,
      showHomeCity: formData.get("showHomeCity") === "on",
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Blocks the person, or unblocks them if already blocked. */
export async function toggleBlock(targetId: string) {
  const userId = await requireUserId();
  if (targetId === userId) return;

  const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) return;

  const key = { blockerId_blockedId: { blockerId: userId, blockedId: targetId } };
  const existing = await db.block.findUnique({ where: key });
  if (existing) await db.block.delete({ where: key });
  else await db.block.create({ data: { blockerId: userId, blockedId: targetId } });

  revalidatePath("/", "layout");
}

/** Permanently deletes the account and everything the person posted. */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  if (formData.get("confirm") !== "on") return { error: "Tick the box to confirm." };

  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true, avatarUrl: true } });
  if (!user) return { error: "Account not found." };

  const password = String(formData.get("password") ?? "");
  if (!(await bcrypt.compare(password, user.passwordHash))) return { error: "That password is not right." };

  // Collect the uploaded files first, because the rows that point to them are about to go.
  const stories = await db.story.findMany({ where: { authorId: userId, imageUrl: { not: null } }, select: { imageUrl: true } });
  const [postFiles, messageFiles] = await Promise.all([
    db.attachment.findMany({ where: { post: { authorId: userId } }, select: { url: true } }),
    db.attachment.findMany({ where: { message: { senderId: userId } }, select: { url: true } }),
  ]);
  const urls = [...postFiles, ...messageFiles].map((a) => a.url);
  if (user.avatarUrl) urls.push(user.avatarUrl);
  for (const s of stories) if (s.imageUrl) urls.push(s.imageUrl);

  // Posts, comments, messages, reactions, memberships, jobs and events cascade from the user.
  await db.user.delete({ where: { id: userId } });
  await deleteBlobs(urls);

  await signOut({ redirectTo: "/login" });
  return { ok: true };
}
