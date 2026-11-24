import Link from "next/link";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { isModeratorEmail } from "@/lib/moderation";
import { requireUserId } from "@/lib/session";
import { revokeInvite } from "@/lib/actions/invites";
import { verifyMember } from "@/lib/actions/community";
import { CopyButton } from "@/components/CopyButton";
import { InviteForm } from "@/components/InviteForm";
import { timeAgo } from "@/lib/format";

export default async function InvitesPage() {
  const userId = await requireUserId();
  const me = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      status: true,
      email: true,
      invitesIssued: { orderBy: { createdAt: "desc" }, include: { usedBy: { select: { name: true, status: true } }, members: { select: { id: true, name: true, status: true } } } },
      invitees: { where: { status: "PENDING" }, select: { id: true, name: true, missionName: true } },
    },
  });
  const moderator = isModeratorEmail(me.email);
  const canInvite = me.status === "VERIFIED" || moderator;
  const base = appUrl();

  const shareText = (code: string) =>
    `I'd like to invite you to Homecoming, a private community for returned missionaries. It is independent and not run by the Church. Join here: ${base}/join?code=${code}  (your invite code is ${code})`;

  const now = new Date();
  const isActive = (i: (typeof me.invitesIssued)[number]) =>
    !i.usedBy && i.useCount < i.maxUses && (!i.expiresAt || i.expiresAt > now);
  const unused = me.invitesIssued.filter((i) => isActive(i) || (!i.usedBy && i.useCount === 0));
  // Everyone who joined, whether through a single-use or a shared code.
  const joined = me.invitesIssued.flatMap((i) => {
    const people = i.members.length > 0 ? i.members : i.usedBy ? [{ id: i.id, ...i.usedBy }] : [];
    return people.map((p) => ({ key: `${i.id}-${p.id}`, code: i.code, name: p.name, status: p.status }));
  });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Invite members</h1>
        <p className="muted">
          Homecoming is invite-only. Invite returned missionaries you know. You vouch for the people you invite, and
          you confirm them once they have joined.
        </p>
      </div>

      {canInvite ? (
        <InviteForm moderator={moderator} />
      ) : (
        <p className="card" style={{ maxWidth: 560 }}>
          You can invite others once the member who invited you has confirmed you.
        </p>
      )}

      {me.invitees.length > 0 && (
        <section className="card" style={{ maxWidth: 560 }}>
          <h2>Confirm people you invited</h2>
          {me.invitees.map((u) => (
            <form key={u.id} action={verifyMember.bind(null, u.id)} className="row">
              <div className="grow">
                <strong>{u.name}</strong>
                <div className="muted">{u.missionName}</div>
              </div>
              <button className="primary">Confirm</button>
            </form>
          ))}
        </section>
      )}

      <section className="stack" style={{ maxWidth: 560 }}>
        <h2>Active codes ({unused.length})</h2>
        {unused.length === 0 && <p className="muted">No unused codes. Create one above.</p>}
        {unused.map((i) => (
          <div key={i.id} className="card">
            <div className="row">
              <code style={{ fontSize: 18 }}>{i.code}</code>
              {i.note && <span className="muted">for {i.note}</span>}
              {i.maxUses > 1 && <span className="chip">{i.useCount} of {i.maxUses} used</span>}
              {i.expiresAt && (
                <span className={i.expiresAt > now ? "muted" : "chip amber"}>
                  {i.expiresAt > now ? `valid until ${i.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Expired"}
                </span>
              )}
              <span className="muted" style={{ marginLeft: "auto" }}>{timeAgo(i.createdAt)}</span>
            </div>
            <div className="row">
              <CopyButton text={shareText(i.code)} label="Copy invitation message" />
              <CopyButton text={`${base}/join?code=${i.code}`} label="Copy link" />
              <form action={revokeInvite} style={{ marginLeft: "auto" }}>
                <input type="hidden" name="inviteId" value={i.id} />
                <button className="link">Remove</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      {joined.length > 0 && (
        <section className="stack" style={{ maxWidth: 560 }}>
          <h2>Joined ({joined.length})</h2>
          {joined.map((i) => (
            <div key={i.key} className="row">
              <code>{i.code}</code>
              <span>{i.name}</span>
              <span className={i.status === "VERIFIED" ? "chip" : "chip amber"}>
                {i.status === "VERIFIED" ? "Confirmed" : "Waiting for confirmation"}
              </span>
            </div>
          ))}
        </section>
      )}

      <p className="muted">
        Only invite people you know served a mission. See the <Link href="/guidelines">community guidelines</Link>.
      </p>
    </>
  );
}
