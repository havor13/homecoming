import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startDirectThread } from "@/lib/actions/chat";
import { deleteJob } from "@/lib/actions/careers";
import { JOB_TYPES, JOB_TYPE_LABEL } from "@/lib/careers";
import { timeAgo } from "@/lib/format";
import { hiddenUserIds } from "@/lib/privacy";
import { Avatar } from "@/components/Avatar";
import { ReportButton } from "@/components/ReportButton";
import { Attachments } from "@/components/Attachments";

const LISTING_DAYS = 60;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const jobType = JOB_TYPES.find((t) => t === type);

  const hidden = await hiddenUserIds(userId);

  const jobs = await db.job.findMany({
    where: {
      postedById: { notIn: hidden },
      createdAt: { gte: new Date(Date.now() - LISTING_DAYS * 24 * 60 * 60 * 1000) },
      ...(jobType ? { type: jobType } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      postedBy: { select: { id: true, name: true, avatarUrl: true, missionName: true } },
      attachments: true,
    },
  });

  return (
    <>
      <div className="row">
        <div className="grow stack" style={{ gap: 6 }}>
          <h1>Jobs and referrals</h1>
          <p className="muted">Leads shared by returned missionaries, for returned missionaries.</p>
        </div>
        <Link className="btn primary" href="/jobs/new">Post a job</Link>
      </div>

      <form role="search" className="row" style={{ maxWidth: 640, flexWrap: "nowrap" }}>
        <label htmlFor="q" className="sr-only">Search jobs</label>
        <input id="q" name="q" defaultValue={q ?? ""} placeholder="Search title, company or place" className="grow" />
        <label htmlFor="type" className="sr-only">Job type</label>
        <select id="type" name="type" defaultValue={jobType ?? ""} style={{ maxWidth: 160 }}>
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>{JOB_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <button>Search</button>
      </form>

      <div className="stack" style={{ maxWidth: 760 }}>
        {jobs.map((j) => (
          <article key={j.id} className="card">
            <div className="row">
              <div className="grow">
                <h2>{j.title}</h2>
                <div className="muted">
                  {j.company} · {j.location}{j.remote ? " · Remote possible" : ""}
                </div>
              </div>
              <span className="chip">{JOB_TYPE_LABEL[j.type]}</span>
              {j.canRefer && <span className="chip amber">Referral available</span>}
            </div>

            <details>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Read the details</summary>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{j.description}</p>
            </details>
            <Attachments items={j.attachments} />

            <div className="row">
              <Avatar name={j.postedBy.name} url={j.postedBy.avatarUrl} size={32} />
              <div className="grow muted">
                Shared by <Link href={`/people/${j.postedBy.id}`}>{j.postedBy.name}</Link>
                {j.postedBy.missionName ? ` · ${j.postedBy.missionName}` : ""} · {timeAgo(j.createdAt)}
              </div>
              {j.applyUrl && (
                <a className="btn primary" href={j.applyUrl} target="_blank" rel="noopener noreferrer nofollow">
                  Apply
                </a>
              )}
              {j.postedById !== userId ? (
                <>
                  <form action={startDirectThread.bind(null, j.postedById)}>
                    <button>{j.canRefer ? "Ask for a referral" : "Message"}</button>
                  </form>
                  <ReportButton targetType="JOB" targetId={j.id} />
                </>
              ) : (
                <>
                  <Link className="btn" href={`/jobs/${j.id}/edit`}>Edit</Link>
                  <form action={deleteJob.bind(null, j.id)}>
                    <button className="danger">Remove</button>
                  </form>
                </>
              )}
            </div>
          </article>
        ))}
        {jobs.length === 0 && (
          <p className="card muted">
            No listings match yet. Share a lead from your own workplace, since a referral from a member is the most
            valuable thing on this page.
          </p>
        )}
      </div>
    </>
  );
}
