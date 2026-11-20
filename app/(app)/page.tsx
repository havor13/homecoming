import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postInclude } from "@/lib/queries";
import { PostCard } from "@/components/PostCard";
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

  const posts = await db.post.findMany({
    // Posts for everyone, plus posts in circles the person has joined.
    where: {
      OR: [
        { circleId: null },
        { circle: { members: { some: { userId, status: "ACTIVE" } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude(userId),
  });

  return (
    <>
      <h1>Home</h1>
      <div className="two">
        <div className="wide stack">
          <PostComposer circles={circles.map((c) => ({ id: c.id, name: c.name }))} />

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
