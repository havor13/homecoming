import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Everyone this person has blocked, plus everyone who has blocked them. */
export async function hiddenUserIds(userId: string): Promise<string[]> {
  const rows = await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  return [...ids];
}

/**
 * Filter for member lists. Hides suspended members, and members who limited their profile
 * to people they share a circle with, unless the viewer is one of those people.
 */
export function visibleTo(viewerId: string): Prisma.UserWhereInput {
  return {
    suspendedAt: null,
    OR: [
      { profileVisibility: "EVERYONE" },
      { id: viewerId },
      {
        memberships: {
          some: {
            status: "ACTIVE",
            circle: { members: { some: { userId: viewerId, status: "ACTIVE" } } },
          },
        },
      },
    ],
  };
}

export async function sharesActiveCircle(a: string, b: string) {
  const count = await db.circle.count({
    where: {
      AND: [
        { members: { some: { userId: a, status: "ACTIVE" } } },
        { members: { some: { userId: b, status: "ACTIVE" } } },
      ],
    },
  });
  return count > 0;
}

async function isBlockedEitherWay(a: string, b: string) {
  const row = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return Boolean(row);
}

/** Whether `senderId` may start a conversation with `recipientId`. */
export async function canMessage(senderId: string, recipientId: string) {
  if (senderId === recipientId) return false;
  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { whoCanMessage: true, suspendedAt: true },
  });
  if (!recipient || recipient.suspendedAt) return false;
  if (await isBlockedEitherWay(senderId, recipientId)) return false;
  if (recipient.whoCanMessage === "CIRCLES") return sharesActiveCircle(senderId, recipientId);
  return true;
}

/** True when this is a one-to-one chat and one of the two people has blocked the other. */
export async function directThreadBlocked(threadId: string, userId: string) {
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: { title: true, circleId: true, members: { select: { userId: true } } },
  });
  if (!thread || thread.title || thread.circleId) return false;
  const other = thread.members.find((m) => m.userId !== userId);
  return other ? isBlockedEitherWay(userId, other.userId) : false;
}
