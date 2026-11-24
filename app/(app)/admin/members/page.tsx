import Link from "next/link";
import { db } from "@/lib/db";
import { isModeratorEmail, requireModerator } from "@/lib/moderation";
import { confirmMember, suspendMember, unsuspendMember } from "@/lib/actions/members";
import { Avatar } from "@/components/Avatar";

const FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "pending", label: "Waiting for confirmation" },
  { key: "suspended", label: "Suspended" },
] as const;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  await requireModerator();
  const { q = "", show = "all" } = await searchParams;
  const query = q.trim().slice(0, 80);

  const where = {
    ...(show === "pending" ? { status: "PENDING" as const, suspendedAt: null } : {}),
    ...(show === "suspended" ? { suspendedAt: { not: null } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { missionName: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, pending, suspended, members] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "PENDING", suspendedAt: null } }),
    db.user.count({ where: { suspendedAt: { not: null } } }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        missionName: true,
        status: true,
        suspendedAt: true,
        createdAt: true,
        invitedBy: { select: { name: true } },
      },
    }),
  ]);

  const href = (s: string) => `/admin/members?show=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Members</h1>
        <p className="muted">
          {total} members. {pending} waiting for confirmation. {suspended} suspended. You see names, missions and
          status only, not messages or email addresses.
        </p>
      </div>

      <form method="get" className="row" style={{ maxWidth: 760 }}>
        <input type="hidden" name="show" value={show} />
        <label className="sr-only" htmlFor="member-q">Search members</label>
        <input id="member-q" name="q" defaultValue={query} placeholder="Search by name or mission" className="grow" />
        <button className="primary">Search</button>
      </form>

      <nav className="row" aria-label="Filter members">
        {FILTERS.map((f) => (
          <Link key={f.key} href={href(f.key)} className={show === f.key ? "chip" : "chip amber"} aria-current={show === f.key ? "page" : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="stack" style={{ maxWidth: 760 }}>
        {members.length === 0 && <p className="card muted">No members match.</p>}
        {members.map((m) => {
          const moderator = isModeratorEmail(m.email);
          return (
            <article key={m.id} className="card">
              <div className="row">
                <Avatar name={m.name} url={m.avatarUrl} size={40} />
                <div className="grow">
                  <Link href={`/people/${m.id}`}><strong>{m.name}</strong></Link>
                  <div className="muted">
                    {m.missionName} · joined {m.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {m.invitedBy ? ` · invited by ${m.invitedBy.name}` : ""}
                  </div>
                </div>
                {moderator && <span className="chip">Moderator</span>}
                {m.suspendedAt ? (
                  <span className="chip amber">Suspended</span>
                ) : m.status === "PENDING" ? (
                  <span className="chip amber">Waiting</span>
                ) : (
                  <span className="chip">Confirmed</span>
                )}
              </div>
              {!moderator && (
                <div className="row">
                  {m.status === "PENDING" && !m.suspendedAt && (
                    <form action={confirmMember.bind(null, m.id)}>
                      <button>Confirm</button>
                    </form>
                  )}
                  {m.suspendedAt ? (
                    <form action={unsuspendMember.bind(null, m.id)}>
                      <button>Restore access</button>
                    </form>
                  ) : (
                    <form action={suspendMember.bind(null, m.id)}>
                      <button className="danger">Suspend</button>
                    </form>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {members.length === 100 && <p className="muted">Showing the 100 newest matches. Search to narrow it down.</p>}
      </div>
    </>
  );
}
