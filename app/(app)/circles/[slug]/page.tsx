import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureCircleThread } from "@/lib/access";
import { approveMember, makeAdmin, removeMember, toggleMembership } from "@/lib/actions/circles";
import { postInclude } from "@/lib/queries";
import { hiddenUserIds } from "@/lib/privacy";
import { circleMatches, hasRequirement, requirementLabel } from "@/lib/circle-match";
import { Avatar } from "@/components/Avatar";
import { CircleRequirementForm } from "@/components/CircleRequirementForm";
import { Chat } from "@/components/Chat";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";

const KIND_LABEL = {
  MISSION: "Mission",
  LANGUAGE: "Language",
  RETURN_YEAR: "Returned",
  INTEREST: "Interest",
} as const;

export default async function CirclePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "chat" || rawTab === "members" ? rawTab : "posts";

  const session = await auth();
  const userId = session!.user.id;

  const circle = await db.circle.findUnique({
    where: { slug },
    include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } },
  });
  if (!circle) notFound();

  const me = await db.membership.findUnique({
    where: { userId_circleId: { userId, circleId: circle.id } },
  });
  // Circles can be for a particular mission, language or return year. Others can still ask to join.
  const requirement = requirementLabel(circle);
  const viewer = !me && hasRequirement(circle)
    ? await db.user.findUnique({ where: { id: userId }, select: { missionName: true, language: true, yearsServed: true } })
    : null;
  const fitsProfile = !viewer || circleMatches(circle, viewer);
  const needsApproval = circle.visibility === "PRIVATE" || !fitsProfile;
  const isActive = me?.status === "ACTIVE";
  const isPending = me?.status === "PENDING";
  const isAdmin = me?.status === "ACTIVE" && me.role === "ADMIN";

  // The last admin has to hand over the role before leaving a circle that still has members.
  let mustHandOver = false;
  if (isAdmin) {
    const otherAdmins = await db.membership.count({
      where: { circleId: circle.id, role: "ADMIN", status: "ACTIVE", NOT: { userId } },
    });
    mustHandOver = otherAdmins === 0 && circle._count.members > 1;
  }

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "chat", label: "Chat" },
    { id: "members", label: "Members" },
  ];

  return (
    <>
      <section className="card" style={{ gap: 12 }}>
        <div className="row">
          <span className="chip">{KIND_LABEL[circle.kind]}</span>
          <span className={`chip${circle.visibility === "PRIVATE" ? " amber" : ""}`}>
            {circle.visibility === "PRIVATE" ? "Private" : "Public"}
          </span>
          {requirement && <span className="chip">{requirement}</span>}
          <span className="muted">{circle._count.members} {circle._count.members === 1 ? "member" : "members"}</span>
        </div>
        <h1>{circle.name}</h1>
        <p>{circle.description}</p>
        <div className="row">
          {!me && (
            <form action={toggleMembership.bind(null, circle.id)}>
              <button className="primary">{needsApproval ? "Request to join" : "Join circle"}</button>
            </form>
          )}
          {isPending && (
            <form action={toggleMembership.bind(null, circle.id)}>
              <button>Request sent. Cancel</button>
            </form>
          )}
          {isActive && (
            <form action={toggleMembership.bind(null, circle.id)}>
              <button disabled={mustHandOver}>Leave circle</button>
            </form>
          )}
          <Link href="/circles">All circles</Link>
        </div>
        {!me && !fitsProfile && (
          <p className="muted">
            This circle is for members who match: {requirement.toLowerCase()}. Your profile doesn&apos;t show that yet.
            You can still send a request, and an admin will decide. If your profile is out of date,{" "}
            <Link href="/profile">update it</Link> first.
          </p>
        )}
        {mustHandOver && (
          <p className="muted">You are the only admin. Make another member an admin before you leave.</p>
        )}
      </section>

      {isAdmin && circle.kind !== "INTEREST" && (
        <CircleRequirementForm circleId={circle.id} kind={circle.kind} current={circle.matchValue ?? ""} />
      )}

      {!isActive ? (
        <p className="card muted">
          {isPending
            ? "Your request is waiting for an admin to approve it. You will see the posts and chat once you are in."
            : "Join this circle to see its posts, chat and members."}
        </p>
      ) : (
        <>
          <nav className="tabs" aria-label="Circle sections">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/circles/${circle.slug}?tab=${t.id}`}
                className={t.id === tab ? "active" : ""}
                aria-current={t.id === tab ? "page" : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {tab === "posts" && <CirclePosts circleId={circle.id} userId={userId} isAdmin={isAdmin} />}
          {tab === "chat" && <CircleChat circleId={circle.id} userId={userId} />}
          {tab === "members" && <CircleMembers circleId={circle.id} userId={userId} isAdmin={isAdmin} />}
        </>
      )}
    </>
  );
}

async function CirclePosts({ circleId, userId, isAdmin }: { circleId: string; userId: string; isAdmin: boolean }) {
  const hidden = await hiddenUserIds(userId);
  const posts = await db.post.findMany({
    where: { circleId, authorId: { notIn: hidden } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude(hidden),
  });
  // Pinned posts first, most recently pinned first.
  posts.sort((a, b) => (b.pinnedAt?.getTime() ?? 0) - (a.pinnedAt?.getTime() ?? 0) || b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="stack" style={{ maxWidth: 700 }}>
      <PostComposer userId={userId} circles={[]} fixedCircleId={circleId} />
      {posts.map((p) => (
        <PostCard key={p.id} post={p} viewerId={userId} canModerate={isAdmin} canPin={isAdmin} />
      ))}
      {posts.length === 0 && <p className="muted">No posts in this circle yet.</p>}
    </div>
  );
}

async function CircleChat({ circleId, userId }: { circleId: string; userId: string }) {
  const thread = await ensureCircleThread(circleId);
  const recent = await db.message.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sender: true,
      attachments: true,
      reactions: { select: { emoji: true, userId: true } },
    },
  });
  const messages = recent.reverse();

  return (
    <section className="card" style={{ maxWidth: 760 }}>
      <h2>Circle chat</h2>
      <Chat threadId={thread.id} messages={messages} viewerId={userId} showNames />
    </section>
  );
}

async function CircleMembers({ circleId, userId, isAdmin }: { circleId: string; userId: string; isAdmin: boolean }) {
  const memberships = await db.membership.findMany({
    where: { circleId },
    include: { user: true },
    orderBy: [{ role: "desc" }, { joinedAt: "asc" }],
  });
  const active = memberships.filter((m) => m.status === "ACTIVE");
  const pending = memberships.filter((m) => m.status === "PENDING");

  return (
    <div className="stack" style={{ maxWidth: 700 }}>
      {isAdmin && pending.length > 0 && (
        <section className="card">
          <h2>Requests to join</h2>
          {pending.map((m) => (
            <div key={m.userId} className="row">
              <Avatar name={m.user.name} url={m.user.avatarUrl} size={40} />
              <div className="grow">
                <Link href={`/people/${m.userId}`}><strong>{m.user.name}</strong></Link>
                <div className="muted">{m.user.missionName}</div>
              </div>
              <form action={approveMember.bind(null, circleId, m.userId)}>
                <button className="primary">Approve</button>
              </form>
              <form action={removeMember.bind(null, circleId, m.userId)}>
                <button>Decline</button>
              </form>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Members</h2>
        {active.map((m) => (
          <div key={m.userId} className="row">
            <Avatar name={m.user.name} url={m.user.avatarUrl} size={40} />
            <div className="grow">
              <Link href={`/people/${m.userId}`}><strong>{m.user.name}</strong></Link>
              {m.userId === userId && <span className="muted"> (you)</span>}
              <div className="muted">{m.user.missionName}</div>
            </div>
            {m.role === "ADMIN" && <span className="chip">Admin</span>}
            {isAdmin && m.userId !== userId && m.role === "MEMBER" && (
              <>
                <form action={makeAdmin.bind(null, circleId, m.userId)}>
                  <button>Make admin</button>
                </form>
                <form action={removeMember.bind(null, circleId, m.userId)}>
                  <button className="danger">Remove</button>
                </form>
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
