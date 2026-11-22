import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { Chat } from "@/components/Chat";
import { unreadThreadIds } from "@/lib/unread";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; notice?: string }>;
}) {
  const { t, notice } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  // Direct messages and group chats. Circle chats live on each circle's page.
  const threads = await db.thread.findMany({
    where: { circleId: null, members: { some: { userId } } },
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  threads.sort(
    (a, b) =>
      (b.messages[0]?.createdAt.getTime() ?? b.createdAt.getTime()) -
      (a.messages[0]?.createdAt.getTime() ?? a.createdAt.getTime()),
  );

  const nameOf = (th: (typeof threads)[number]) =>
    th.title ?? (th.members.filter((m) => m.userId !== userId).map((m) => m.user.name).join(", ") || "Conversation");
  const avatarOf = (th: (typeof threads)[number]) =>
    th.title ? null : th.members.find((m) => m.userId !== userId)?.user;

  const active = threads.find((th) => th.id === t) ?? threads[0];
  const recent = active
    ? await db.message.findMany({
        where: { threadId: active.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          sender: true,
          attachments: true,
          reactions: { select: { emoji: true, userId: true } },
        },
      })
    : [];
  const messages = recent.reverse();

  // Which other conversations have new messages, then mark the open one as read.
  const unread = new Set(await unreadThreadIds(userId));
  if (active) {
    unread.delete(active.id);
    await db.threadMember.updateMany({ where: { threadId: active.id, userId }, data: { lastReadAt: new Date() } });
  }

  return (
    <>
      <div className="row">
        <h1 className="grow">Messages</h1>
        <Link className="btn" href="/messages/new">New group chat</Link>
        <Link className="btn primary" href="/people">Find people</Link>
      </div>
      {notice === "unavailable" && (
        <p className="card error" role="alert">
          That member isn&apos;t accepting messages from you.
        </p>
      )}
      <div className="two">
        <nav className="rail card" aria-label="Conversations">
          {threads.length === 0 && (
            <p className="muted">No conversations yet. Use Message on a post or a profile, or start a group chat.</p>
          )}
          {threads.map((th) => {
            const other = avatarOf(th);
            return (
              <Link
                key={th.id}
                href={`/messages?t=${th.id}`}
                className={`thread-link${th.id === active?.id ? " active" : ""}`}
              >
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <Avatar name={nameOf(th)} url={other?.avatarUrl} />
                  <div className="grow">
                    <strong>{nameOf(th)}</strong>
                    {unread.has(th.id) && <span className="unread-dot" role="img" aria-label="New messages" />}
                    {th.title && <span className="chip" style={{ marginLeft: 6 }}>Group</span>}
                    <div className="muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {th.messages[0]?.body || (th.messages[0] ? "Sent an attachment" : "No messages yet")}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {active && (
          <section className="wide card">
            <h2>{nameOf(active)}</h2>
            {active.title && (
              <p className="muted">{active.members.map((m) => m.user.name).join(", ")}</p>
            )}
            <Chat threadId={active.id} messages={messages} viewerId={userId} showNames={Boolean(active.title)} />
          </section>
        )}
      </div>
    </>
  );
}
