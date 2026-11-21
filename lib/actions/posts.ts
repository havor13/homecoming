"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { activeMembership, canViewPost } from "@/lib/access";
import { head } from "@vercel/blob";
import { deleteBlobs, pickFiles, tryUpload } from "@/lib/upload";
import { MAX_VIDEO_BYTES, VIDEO_FOLDER, VIDEO_TYPES } from "@/lib/upload-config";
import type { FormState } from "@/lib/types";

const textSchema = z.string().trim().max(2000, "That is longer than 2,000 characters.");

/** Checks that a video the browser says it uploaded really is in the person's own Blob folder. */
async function verifyVideo(userId: string, url: string, name: string) {
  let pathname: string;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
    pathname = decodeURIComponent(u.pathname).replace(/^\//, "");
  } catch {
    return null;
  }
  if (!pathname.startsWith(`${VIDEO_FOLDER}/${userId}/`)) return null;

  try {
    const info = await head(url);
    if (!(VIDEO_TYPES as readonly string[]).includes(info.contentType) || info.size > MAX_VIDEO_BYTES) {
      await deleteBlobs([url]);
      return null;
    }
    return { url, name: name || "video", contentType: info.contentType, size: info.size };
  } catch {
    return null;
  }
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const body = textSchema.safeParse(formData.get("body") ?? "");
  if (!body.success) return { error: body.error.issues[0].message };

  const files = pickFiles(formData, "files");
  const videoUrl = String(formData.get("videoUrl") ?? "");
  if (!body.data && files.length === 0 && !videoUrl) return { error: "Write something or attach a file." };

  let video: Awaited<ReturnType<typeof verifyVideo>> = null;
  if (videoUrl) {
    video = await verifyVideo(userId, videoUrl, String(formData.get("videoName") ?? ""));
    if (!video) return { error: "That video could not be verified. Please try uploading it again." };
  }

  const circleId = String(formData.get("circleId") ?? "") || null;
  if (circleId && !(await activeMembership(userId, circleId))) {
    return { error: "Join this circle to post in it." };
  }

  const upload = await tryUpload(files, "posts", userId);
  if (!upload.ok) {
    if (video) await deleteBlobs([video.url]);
    return { error: upload.error };
  }

  await db.post.create({
    data: { body: body.data, authorId: userId, circleId, attachments: { create: video ? [...upload.files, video] : upload.files } },
  });
  refresh();
  return { ok: true };
}

export async function toggleLike(postId: string) {
  const userId = await requireUserId();
  if (!(await canViewPost(userId, postId))) return;

  const key = { userId_postId: { userId, postId } };
  const existing = await db.like.findUnique({ where: key });
  if (existing) await db.like.delete({ where: key });
  else await db.like.create({ data: { userId, postId } });
  refresh();
}

export async function createComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const postId = String(formData.get("postId") ?? "");

  const body = z.string().trim().min(1, "Write a comment first.").max(1000, "Comments can be up to 1,000 characters.").safeParse(formData.get("body"));
  if (!body.success) return { error: body.error.issues[0].message };

  if (!(await canViewPost(userId, postId))) return { error: "You can't comment on this post." };

  await db.comment.create({ data: { body: body.data, postId, authorId: userId } });
  refresh();
  return { ok: true };
}

export async function deletePost(postId: string) {
  const userId = await requireUserId();
  const post = await db.post.findUnique({ where: { id: postId }, include: { attachments: true } });
  if (!post) return;

  let allowed = post.authorId === userId;
  if (!allowed && post.circleId) {
    const m = await activeMembership(userId, post.circleId);
    allowed = m?.role === "ADMIN";
  }
  if (!allowed) return;

  await db.post.delete({ where: { id: postId } });
  await deleteBlobs(post.attachments.map((a) => a.url));
  refresh();
}

export async function deleteComment(commentId: string) {
  const userId = await requireUserId();
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { authorId: true, circleId: true } } },
  });
  if (!comment) return;

  let allowed = comment.authorId === userId || comment.post.authorId === userId;
  if (!allowed && comment.post.circleId) {
    const m = await activeMembership(userId, comment.post.circleId);
    allowed = m?.role === "ADMIN";
  }
  if (!allowed) return;

  await db.comment.delete({ where: { id: commentId } });
  refresh();
}
