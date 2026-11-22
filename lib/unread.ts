import { db } from "@/lib/db";

/** Ids of direct and group conversations that have messages from others you have not opened yet. */
export async function unreadThreadIds(userId: string): Promise<string[]> {
  const rows = await db.$queryRaw<{ threadId: string }[]>`
    SELECT DISTINCT tm."threadId" AS "threadId"
    FROM "ThreadMember" tm
    JOIN "Thread" t ON t."id" = tm."threadId"
    JOIN "Message" m ON m."threadId" = tm."threadId"
    WHERE tm."userId" = ${userId}
      AND t."circleId" IS NULL
      AND m."senderId" <> ${userId}
      AND m."kind" = 'TEXT'
      AND m."createdAt" > tm."lastReadAt"
  `;
  return rows.map((r) => r.threadId);
}
