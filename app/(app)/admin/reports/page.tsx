import Link from "next/link";
import { db } from "@/lib/db";
import { requireModerator } from "@/lib/moderation";
import { dismissReport, removeReportedContent, suspendReportedUser, unsuspendUser } from "@/lib/actions/moderation";
import { REASON_LABEL, TARGET_LABEL } from "@/lib/reports";
import { timeAgo } from "@/lib/format";

export default async function ReportsPage() {
  await requireModerator();

  const include = {
    reporter: { select: { id: true, name: true } },
    targetUser: { select: { id: true, name: true, suspendedAt: true } },
  } as const;

  const [open, resolved, suspended] = await Promise.all([
    db.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, include }),
    db.report.findMany({ where: { status: { not: "OPEN" } }, orderBy: { resolvedAt: "desc" }, take: 20, include }),
    db.user.findMany({
      where: { suspendedAt: { not: null } },
      orderBy: { suspendedAt: "desc" },
      select: { id: true, name: true, suspendedAt: true },
    }),
  ]);

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Reports</h1>
        <p className="muted">
          {open.length} open. You only see what was reported, not anyone&apos;s other messages.
        </p>
      </div>

      <div className="stack" style={{ maxWidth: 760 }}>
        {open.length === 0 && <p className="card muted">Nothing to review. 🎉</p>}
        {open.map((r) => (
          <article key={r.id} className="card">
            <div className="row">
              <span className="chip amber">{TARGET_LABEL[r.targetType]}</span>
              <strong className="grow">{REASON_LABEL[r.reason]}</strong>
              <span className="muted">{timeAgo(r.createdAt)}</span>
            </div>
            <blockquote className="quote">{r.snippet}</blockquote>
            {r.note && <p><span className="muted">Reporter&apos;s note:</span> {r.note}</p>}
            <p className="muted">
              Reported by <Link href={`/people/${r.reporter.id}`}>{r.reporter.name}</Link>
              {r.targetUser && (
                <> · About <Link href={`/people/${r.targetUser.id}`}>{r.targetUser.name}</Link>
                {r.targetUser.suspendedAt ? " (suspended)" : ""}</>
              )}
            </p>
            <div className="row">
              <form action={dismissReport.bind(null, r.id)}><button>Dismiss</button></form>
              {r.targetType !== "USER" && (
                <form action={removeReportedContent.bind(null, r.id)}><button className="danger">Remove content</button></form>
              )}
              {r.targetUser && !r.targetUser.suspendedAt && (
                <form action={suspendReportedUser.bind(null, r.id)}><button className="danger">Suspend member</button></form>
              )}
            </div>
          </article>
        ))}
      </div>

      {suspended.length > 0 && (
        <section className="card" style={{ maxWidth: 760 }}>
          <h2>Suspended members</h2>
          {suspended.map((u) => (
            <div key={u.id} className="row">
              <span className="grow">{u.name}</span>
              <span className="muted">{u.suspendedAt ? timeAgo(u.suspendedAt) : ""}</span>
              <form action={unsuspendUser.bind(null, u.id)}><button>Restore</button></form>
            </div>
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section className="card" style={{ maxWidth: 760 }}>
          <h2>Recently closed</h2>
          {resolved.map((r) => (
            <div key={r.id} className="row">
              <span className="chip">{TARGET_LABEL[r.targetType]}</span>
              <span className="grow">{REASON_LABEL[r.reason]}</span>
              <span className="muted">{r.status === "ACTIONED" ? "Action taken" : "Dismissed"}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
