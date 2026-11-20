import { db } from "@/lib/db";

/** The membership, only if the person is an active (approved) member of the circle. */
export async function activeMembership(userId: string, circleId: string) {
  const m = await db.membership.findUnique({
    where: { userId_circleId: { userId, circleId } },
  });
  return m && m.status === "ACTIVE" ? m : null;
}

/** The thread, only if this person may read and write in it. */
export async function canAccessThread(userId: string, threadId: string) {
  if (!threadId) return null;
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { id: true, circleId: true },
  });
  if (!thread) return null;

  if (thread.circleId) {
    return (await activeMembership(userId, thread.circleId)) ? thread : null;
  }
  const member = await db.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  return member ? thread : null;
}

/** The post, only if this person may see it (circle posts are for active members). */
export async function canViewPost(userId: string, postId: string) {
  if (!postId) return null;
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, circleId: true },
  });
  if (!post) return null;
  if (!post.circleId) return post;
  return (await activeMembership(userId, post.circleId)) ? post : null;
}

/** Every circle gets one chat thread, created the first time it is needed. */
export async function ensureCircleThread(circleId: string) {
  return db.thread.upsert({
    where: { circleId },
    update: {},
    create: { circleId },
  });
}
