import { db } from "@/lib/db";

/** The one-to-one chat between two people, created the first time it is needed. */
export async function findOrCreateDirectThread(userId: string, otherUserId: string) {
  // A direct message is a thread with no title, no circle and exactly these two people.
  const existing = await db.thread.findFirst({
    where: {
      title: null,
      circleId: null,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
      members: { every: { userId: { in: [userId, otherUserId] } } },
    },
  });
  if (existing) return existing;

  return db.thread.create({
    data: { members: { create: [{ userId }, { userId: otherUserId }] } },
  });
}
