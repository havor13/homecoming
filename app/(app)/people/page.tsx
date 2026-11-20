import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startDirectThread } from "@/lib/actions/chat";
import { Avatar } from "@/components/Avatar";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; work?: string }>;
}) {
  const { q, work } = await searchParams;
  const openToWork = work === "1";
  const session = await auth();
  const userId = session!.user.id;

  const people = await db.user.findMany({
    where: {
      ...(openToWork ? { lookingForWork: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { missionName: { contains: q, mode: "insensitive" } },
              { language: { contains: q, mode: "insensitive" } },
              { homeCity: { contains: q, mode: "insensitive" } },
              { jobTitle: { contains: q, mode: "insensitive" } },
              { employer: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 60,
    select: {
      id: true,
      name: true,
      missionName: true,
      language: true,
      avatarUrl: true,
      status: true,
      jobTitle: true,
      employer: true,
      lookingForWork: true,
      openToMentor: true,
    },
  });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>People</h1>
        <p className="muted">Search by name, mission, language, home city, job or company.</p>
      </div>

      <form role="search" className="row" style={{ maxWidth: 640 }}>
        <label htmlFor="q" className="sr-only">Search people</label>
        <input id="q" name="q" defaultValue={q ?? ""} placeholder="For example, Cebu, Spanish or nurse" className="grow" />
        <label className="row" style={{ fontWeight: 400 }}>
          <input type="checkbox" name="work" value="1" defaultChecked={openToWork} style={{ width: 20, minHeight: 20 }} />
          Open to work
        </label>
        <button>Search</button>
      </form>

      <div className="cards">
        {people.map((p) => (
          <article key={p.id} className="card">
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <Avatar name={p.name} url={p.avatarUrl} size={56} />
              <div className="grow">
                <Link href={`/people/${p.id}`}><strong>{p.name}</strong></Link>
                {p.id === userId && <span className="muted"> (you)</span>}
                {(p.jobTitle || p.employer) && (
                  <div>{[p.jobTitle, p.employer].filter(Boolean).join(" at ")}</div>
                )}
                <div className="muted">{p.missionName}</div>
                {p.language && <div className="muted">{p.language}</div>}
              </div>
            </div>
            <div className="row">
              {p.status === "VERIFIED" && <span className="chip">Verified</span>}
              {p.lookingForWork && <span className="chip amber">Open to work</span>}
              {p.openToMentor && <span className="chip">Mentor</span>}
            </div>
            <div className="row">
              <Link className="btn" href={`/people/${p.id}`}>View profile</Link>
              {p.id !== userId && (
                <form action={startDirectThread.bind(null, p.id)}>
                  <button className="primary">Message</button>
                </form>
              )}
            </div>
          </article>
        ))}
        {people.length === 0 && <p className="muted">Nobody matches that search.</p>}
      </div>
    </>
  );
}
