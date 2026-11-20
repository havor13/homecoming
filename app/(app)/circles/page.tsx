import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleMembership } from "@/lib/actions/circles";

const KIND_LABEL = {
  MISSION: "Mission",
  LANGUAGE: "Language",
  RETURN_YEAR: "Returned",
  INTEREST: "Interest",
} as const;

export default async function CirclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const circles = await db.circle.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: {
      members: { where: { userId }, select: { status: true } },
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
  });

  return (
    <>
      <div className="row">
        <div className="grow stack" style={{ gap: 6 }}>
          <h1>Mission circles</h1>
          <p className="muted">Groups by mission, language, return date and shared interests.</p>
        </div>
        <Link className="btn primary" href="/circles/new">Create a circle</Link>
      </div>

      <form role="search" className="row" style={{ maxWidth: 520, flexWrap: "nowrap" }}>
        <label htmlFor="q" className="sr-only">Search circles</label>
        <input id="q" name="q" defaultValue={q ?? ""} placeholder="Search circles" className="grow" />
        <button>Search</button>
      </form>

      <div className="cards">
        {circles.map((c) => {
          const status = c.members[0]?.status;
          return (
            <section key={c.id} className="card">
              <div className="row">
                <span className="chip">{KIND_LABEL[c.kind]}</span>
                {c.visibility === "PRIVATE" && <span className="chip amber">Private</span>}
              </div>
              <h2>{c.name}</h2>
              <p className="muted">{c.description}</p>
              <p className="muted">{c._count.members} {c._count.members === 1 ? "member" : "members"}</p>
              {status === "ACTIVE" ? (
                <Link className="btn on" href={`/circles/${c.slug}`}>Open circle</Link>
              ) : status === "PENDING" ? (
                <form action={toggleMembership.bind(null, c.id)}>
                  <button style={{ width: "100%" }}>Request sent. Cancel</button>
                </form>
              ) : (
                <form action={toggleMembership.bind(null, c.id)}>
                  <button className="primary" style={{ width: "100%" }}>
                    {c.visibility === "PRIVATE" ? "Request to join" : "Join circle"}
                  </button>
                </form>
              )}
            </section>
          );
        })}
        {circles.length === 0 && <p className="muted">No circles match that search.</p>}
      </div>
    </>
  );
}
