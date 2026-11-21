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
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      // Only the author gets to see who watched.
      views: isOwn ? { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } } : false,
    },
  });

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
        viewers: isOwn && "views" in s && Array.isArray(s.views) ? s.views.map((v) => v.user.name) : [],
      }))}
    />
  );
}
