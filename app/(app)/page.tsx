import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postInclude } from "@/lib/queries";
import { hiddenUserIds } from "@/lib/privacy";
import { PostCard } from "@/components/PostCard";
import { StoryTray } from "@/components/StoryTray";
import { StatusForm } from "@/components/StatusForm";
import { currentStatus } from "@/lib/member-status";
import { PostComposer } from "@/components/PostComposer";

export default async function FeedPage() {
  const session = await auth();
  const userId = session!.user.id;

  const memberships = await db.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { circle: true },
    orderBy: { circle: { name: "asc" } },
  });
  const circles = memberships.map((m) => m.circle);
  const adminCircleIds = new Set(memberships.filter((m) => m.role === "ADMIN").map((m) => m.circleId));

  const hidden = await hiddenUserIds(userId);
  const meRow = await db.user.findUnique({ where: { id: userId }, select: { statusText: true, statusUpdatedAt: true } });

  const posts = await db.post.findMany({
    // Posts for everyone, plus posts in circles the person has joined. Blocked members are left out.
    where: {
      authorId: { notIn: hidden },
      OR: [
        { circleId: null },
        { circle: { members: { some: { userId, status: "ACTIVE" } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude(hidden),
  });

  return (
    <>
      <h1>Home</h1>
      <StoryTray viewerId={userId} />
      <div className="two">
        <div className="wide stack">
          <PostComposer userId={userId} circles={circles.map((c) => ({ id: c.id, name: c.name }))} />

          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              viewerId={userId}
              canModerate={p.circleId !== null && adminCircleIds.has(p.circleId)}
            />
          ))}
          {posts.length === 0 && <p className="muted">No posts yet. Be the first to share.</p>}
        </div>

        <aside className="rail stack">
          <StatusForm initial={meRow ? currentStatus(meRow) ?? "" : ""} />
          <section className="card">
            <h2>Your circles</h2>
            {circles.length === 0 && <p className="muted">You have not joined any circles yet.</p>}
            {circles.map((c) => (
              <Link key={c.id} href={`/circles/${c.slug}`}>{c.name}</Link>
            ))}
            <Link className="btn" href="/circles">Find more circles</Link>
          </section>
        </aside>
      </div>
    </>
  );
}
