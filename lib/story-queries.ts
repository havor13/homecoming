import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hiddenUserIds, visibleTo } from "@/lib/privacy";

/** Active stories the viewer is allowed to see: not expired, not blocked, respects profile privacy. */
export async function storyWhere(viewerId: string): Promise<Prisma.StoryWhereInput> {
  const hidden = await hiddenUserIds(viewerId);
  return {
    expiresAt: { gt: new Date() },
    author: { AND: [visibleTo(viewerId)], id: { notIn: hidden } },
  };
}

export type StoryGroup = {
  author: { id: string; name: string; avatarUrl: string | null };
  count: number;
  unseen: boolean;
  latest: Date;
};

/** One entry per person with an active story. You first, then people you haven't watched, then newest. */
export async function storyGroups(viewerId: string): Promise<StoryGroup[]> {
  const stories = await db.story.findMany({
    where: await storyWhere(viewerId),
    orderBy: { createdAt: "asc" },
    take: 300,
    select: {
      createdAt: true,
      author: { select: { id: true, name: true, avatarUrl: true } },
      views: { where: { userId: viewerId }, select: { userId: true } },
    },
  });

  const map = new Map<string, StoryGroup>();
  for (const s of stories) {
    const g = map.get(s.author.id) ?? { author: s.author, count: 0, unseen: false, latest: s.createdAt };
    g.count += 1;
    if (s.views.length === 0 && s.author.id !== viewerId) g.unseen = true;
    g.latest = s.createdAt;
    map.set(s.author.id, g);
  }

  return [...map.values()].sort((a, b) => {
    if (a.author.id === viewerId) return -1;
    if (b.author.id === viewerId) return 1;
    if (a.unseen !== b.unseen) return a.unseen ? -1 : 1;
    return b.latest.getTime() - a.latest.getTime();
  });
}
