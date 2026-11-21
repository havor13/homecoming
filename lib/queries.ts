import type { Prisma } from "@prisma/client";

/** `hidden` is the people this viewer has blocked or been blocked by, whose comments are left out. */
export const postInclude = (hidden: string[]) =>
  ({
    author: true,
    circle: true,
    attachments: true,
    reactions: { select: { emoji: true, userId: true } },
    comments: {
      where: { authorId: { notIn: hidden } },
      orderBy: { createdAt: "asc" as const },
      take: 20,
      include: { author: true },
    },
    _count: { select: { comments: { where: { authorId: { notIn: hidden } } } } },
  }) satisfies Prisma.PostInclude;

export type PostWithMeta = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export type MessageWithMeta = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    attachments: true;
    reactions: { select: { emoji: true; userId: true } };
  };
}>;
