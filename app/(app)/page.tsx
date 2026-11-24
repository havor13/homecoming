import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postInclude } from "@/lib/queries";
import { hiddenUserIds } from "@/lib/privacy";
import { PostCard } from "@/components/PostCard";
import { StoryTray } from "@/components/StoryTray";
import { StatusForm } from "@/components/StatusForm";
import { currentStatus } from "@/lib/member-status";
import { WelcomeChecklist } from "@/components/WelcomeChecklist";
import { PostComposer } from "@/components/PostComposer";
import { isModeratorEmail } from "@/lib/moderation";

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
  const meRow = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, statusText: true, statusUpdatedAt: true, avatarUrl: true, bio: true, welcomeDismissed: true },
  });
  const myPosts = meRow && !meRow.welcomeDismissed ? await db.post.count({ where: { authorId: userId } }) : 0;

  const isModerator = isModeratorEmail(meRow?.email);

  // Posts for everyone, plus posts in circles the person has joined. Blocked members are left out.
  const visible = {
    authorId: { notIn: hidden },
    OR: [{ circleId: null }, { circle: { members: { some: { userId, status: "ACTIVE" as const } } } }],
  };
  // Up to three pinned posts stay at the top. The rest follow, newest first.
  const pinned = await db.post.findMany({
    where: { ...visible, pinnedAt: { not: null } },
    orderBy: { pinnedAt: "desc" },
    take: 3,
    include: postInclude(hidden),
  });
  const rest = await db.post.findMany({
    where: { ...visible, id: { notIn: pinned.map((p) => p.id) } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude(hidden),
  });
  const posts = [...pinned, ...rest];

  return (
    <>
      <h1>Home</h1>
      <StoryTray viewerId={userId} />
      <div className="two">
        <div className="wide stack">
          {meRow && !meRow.welcomeDismissed && (
            <WelcomeChecklist
              steps={[
                { label: "Add a profile photo", hint: "People recognise each other faster with a face.", href: "/profile", done: !!meRow.avatarUrl },
                { label: "Tell people about yourself", hint: "A line or two about your mission and what you do now.", href: "/profile", done: !!meRow.bio },
                { label: "Join a mission circle", hint: "Find people from your mission, language or city.", href: "/circles", done: circles.length > 0 },
                { label: "Post a short hello", hint: "Introduce yourself in the box just below.", href: "/#post-body", done: myPosts > 0 },
              ]}
            />
          )}
          <PostComposer userId={userId} circles={circles.map((c) => ({ id: c.id, name: c.name }))} />

          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              viewerId={userId}
              canModerate={p.circleId !== null && adminCircleIds.has(p.circleId)}
              canPin={isModerator || (p.circleId !== null && adminCircleIds.has(p.circleId))}
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
