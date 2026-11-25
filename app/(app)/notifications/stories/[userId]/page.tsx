import Link from "next/link";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { storyWhere } from "@/lib/story-queries";
import { StoryViewer } from "@/components/StoryViewer";

export default async function StoriesPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: authorId } = await params;
  const viewerId = await requireUserId();
  const isOwn = authorId === viewerId;

  const stories = await db.story.findMany({
    where: { authorId, ...(await storyWhere(viewerId)) },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Only the author gets to see who watched.
  const views = isOwn && stories.length > 0
    ? await db.storyView.findMany({
        where: { storyId: { in: stories.map((s) => s.id) } },
        orderBy: { createdAt: "asc" },
        select: { storyId: true, user: { select: { name: true } } },
      })
    : [];

  // Reactions: the author sees who reacted with what; everyone else only needs their own.
  const reactions = stories.length > 0
    ? await db.storyReaction.findMany({
        where: { storyId: { in: stories.map((s) => s.id) }, ...(isOwn ? {} : { userId: viewerId }) },
        orderBy: { createdAt: "asc" },
        select: { storyId: true, userId: true, emoji: true, user: { select: { name: true } } },
      })
    : [];

  if (stories.length === 0) {
    return (
      <>
        <h1>Stories</h1>
        <p className="muted">There are no stories to show right now. Stories disappear after 24 hours.</p>
        <Link href="/">Back to Home</Link>
      </>
    );
  }

  return (
    <StoryViewer
      author={stories[0].author}
      isOwn={isOwn}
      stories={stories.map((s) => ({
        id: s.id,
        body: s.body,
        imageUrl: s.imageUrl,
        bg: s.bg,
        expiresAt: s.expiresAt.toISOString(),
        viewers: views.filter((v) => v.storyId === s.id).map((v) => v.user.name),
        myReaction: reactions.find((r) => r.storyId === s.id && r.userId === viewerId)?.emoji ?? null,
        reactions: isOwn ? reactions.filter((r) => r.storyId === s.id).map((r) => ({ name: r.user.name, emoji: r.emoji })) : [],
      }))}
    />
  );
}
