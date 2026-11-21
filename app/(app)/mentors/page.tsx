import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { INDUSTRIES, isIndustry } from "@/lib/careers";
import { hiddenUserIds, visibleTo } from "@/lib/privacy";
import { Avatar } from "@/components/Avatar";
import { RequestMentoringForm } from "@/components/RequestMentoringForm";

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string }>;
}) {
  const { q, industry } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const hidden = await hiddenUserIds(userId);

  const mentors = await db.user.findMany({
    where: {
      openToMentor: true,
      AND: [visibleTo(userId)],
      id: { not: userId, notIn: hidden },
      ...(industry && isIndustry(industry) ? { industry } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { jobTitle: { contains: q, mode: "insensitive" } },
              { employer: { contains: q, mode: "insensitive" } },
              { mentorAbout: { contains: q, mode: "insensitive" } },
              { missionName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 60,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      missionName: true,
      industry: true,
      jobTitle: true,
      employer: true,
      mentorAbout: true,
    },
  });

  const me = await db.user.findUnique({ where: { id: userId }, select: { openToMentor: true } });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Mentors</h1>
        <p className="muted">
          Returned missionaries who have offered to give advice. {me?.openToMentor ? "You are listed here." : (
            <>Want to help? <Link href="/profile">Turn on mentoring in your profile.</Link></>
          )}
        </p>
      </div>

      <form role="search" className="row" style={{ maxWidth: 640, flexWrap: "nowrap" }}>
        <label htmlFor="q" className="sr-only">Search mentors</label>
        <input id="q" name="q" defaultValue={q ?? ""} placeholder="Search by name, job, company or topic" className="grow" />
        <label htmlFor="industry" className="sr-only">Industry</label>
        <select id="industry" name="industry" defaultValue={industry ?? ""} style={{ maxWidth: 200 }}>
          <option value="">All industries</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <button>Search</button>
      </form>

      <div className="cards">
        {mentors.map((m) => (
          <article key={m.id} className="card">
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <Avatar name={m.name} url={m.avatarUrl} size={56} />
              <div className="grow">
                <Link href={`/people/${m.id}`}><strong>{m.name}</strong></Link>
                {(m.jobTitle || m.employer) && (
                  <div>{[m.jobTitle, m.employer].filter(Boolean).join(" at ")}</div>
                )}
                {m.missionName && <div className="muted">{m.missionName}</div>}
              </div>
            </div>
            {m.industry && <span className="chip" style={{ alignSelf: "flex-start" }}>{m.industry}</span>}
            {m.mentorAbout && <p style={{ whiteSpace: "pre-wrap" }}>{m.mentorAbout}</p>}
            <RequestMentoringForm mentorId={m.id} mentorName={m.name} />
          </article>
        ))}
        {mentors.length === 0 && <p className="muted">No mentors match that search yet.</p>}
      </div>
    </>
  );
}
