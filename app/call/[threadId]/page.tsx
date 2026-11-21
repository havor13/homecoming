import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { canAccessThread } from "@/lib/access";
import { createCallToken, livekitConfigured, livekitUrl } from "@/lib/livekit";
import { CallRoom } from "@/components/CallRoom";

export default async function CallPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { threadId } = await params;
  const { mode } = await searchParams;

  const userId = await requireUserId();

  // Same rule as the chat itself: only people in the chat (or the circle) can join its call.
  if (!(await canAccessThread(userId, threadId))) notFound();

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    include: { circle: true, members: { include: { user: true } } },
  });
  if (!thread) notFound();

  const title =
    thread.circle?.name ??
    thread.title ??
    (thread.members.filter((m) => m.userId !== userId).map((m) => m.user.name).join(", ") || "Call");

  const backHref = thread.circle ? `/circles/${thread.circle.slug}?tab=chat` : `/messages?t=${thread.id}`;

  if (!livekitConfigured()) {
    return (
      <div className="call-page">
        <h1>Calls are not set up yet</h1>
        <p className="muted">
          Add <code>NEXT_PUBLIC_LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code> and{" "}
          <code>LIVEKIT_API_SECRET</code> to the environment, then restart the app.{" "}
          <Link href={backHref}>Back to the chat</Link>
        </p>
      </div>
    );
  }

  const me = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  const token = await createCallToken(threadId, userId, me?.name ?? "Member");

  return (
    <div className="call-page">
      <div className="row">
        <h1 className="grow" style={{ fontSize: 24 }}>{title}</h1>
        <Link className="btn" href={backHref}>Back to chat</Link>
      </div>
      <CallRoom token={token} serverUrl={livekitUrl()} withVideo={mode !== "audio"} backHref={backHref} />
    </div>
  );
}
