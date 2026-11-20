import type { Prisma } from "@prisma/client";

export const postInclude = (_userId: string) =>
  ({
    author: true,
    circle: true,
    attachments: true,
    reactions: { select: { emoji: true, userId: true } },
    comments: {
      orderBy: { createdAt: "asc" as const },
      take: 20,
      include: { author: true },
    },
    _count: { select: { comments: true } },
  }) satisfies Prisma.PostInclude;

export type PostWithMeta = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export type MessageWithMeta = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    attachments: true;
    reactions: { select: { emoji: true; userId: true } };
  };
}>;
