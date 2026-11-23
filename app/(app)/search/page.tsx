import Link from "next/link";
import { db } from "@/lib/db";
import { hiddenUserIds, visibleTo } from "@/lib/privacy";
import { requireUserId } from "@/lib/session";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";

const has = (q: string) => ({ contains: q, mode: "insensitive" as const });

function excerpt(text: string, q: string, length = 160) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, i - 40);
  const piece = text.slice(start, start + length);
  return (start > 0 ? "…" : "") + piece + (start + length < text.length ? "…" : "");
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim().slice(0, 60);
  const userId = await requireUserId();
  const searching = q.length >= 2;

  let people: Awaited<ReturnType<typeof findPeople>> = [];
  let circles: Awaited<ReturnType<typeof findCircles>> = [];
  let posts: Awaited<ReturnType<typeof findPosts>> = [];
  let jobs: Awaited<ReturnType<typeof findJobs>> = [];

  if (searching) {
    const hidden = await hiddenUserIds(userId);
    [people, circles, posts, jobs] = await Promise.all([
      findPeople(userId, hidden, q),
      findCircles(userId, q),
      findPosts(userId, hidden, q),
      findJobs(hidden, q),
    ]);
  }
  const total = people.length + circles.length + posts.length + jobs.length;

  return (
    <>
      <h1>Search</h1>
      <form action="/search" method="get" className="search-form" role="search">
        <label htmlFor="q" className="sr-only">Search Homecoming</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="People, circles, posts, jobs" autoFocus={!q} />
        <button className="primary">Search</button>
      </form>

      {!searching && (
        <p className="muted">
          Search by name, mission, language, city, job or topic. Type at least 2 letters. You only find what you are
          allowed to see.
        </p>
      )}
      {searching && total === 0 && <p className="card" style={{ maxWidth: 560 }}>No results for “{q}”. Try fewer or different words.</p>}

      {people.length > 0 && (
        <section className="card stack" style={{ maxWidth: 700 }}>
          <h2>People</h2>
          {people.map((p) => (
            <Link key={p.id} href={`/people/${p.id}`} className="result">
              <Avatar name={p.name} url={p.avatarUrl} size={40} />
              <span>
                <strong>{p.name}</strong>
                <span className="muted" style={{ display: "block" }}>
                  {[p.missionName, p.jobTitle && p.employer ? `${p.jobTitle} at ${p.employer}` : p.jobTitle ?? p.employer]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {circles.length > 0 && (
        <section className="card stack" style={{ maxWidth: 700 }}>
          <h2>Circles</h2>
          {circles.map((c) => (
            <Link key={c.id} href={`/circles/${c.slug}`} className="result">
              <span aria-hidden="true" style={{ fontSize: 24 }}>👥</span>
              <span>
                <strong>{c.name}</strong>
                {c.visibility === "PRIVATE" && <span className="chip" style={{ marginLeft: 6 }}>Private</span>}
                <span className="muted" style={{ display: "block" }}>{c.description.slice(0, 120)}</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {posts.length > 0 && (
        <section className="card stack" style={{ maxWidth: 700 }}>
          <h2>Posts</h2>
          {posts.map((p) => (
            <Link key={p.id} href={`/posts/${p.id}`} className="result">
              <Avatar name={p.author.name} url={p.author.avatarUrl} size={40} />
              <span>
                <strong>{p.author.name}</strong>
                <span className="muted"> · {timeAgo(p.createdAt)}{p.circle ? ` · ${p.circle.name}` : ""}</span>
                <span style={{ display: "block" }}>{excerpt(p.body, q)}</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {jobs.length > 0 && (
        <section className="card stack" style={{ maxWidth: 700 }}>
          <h2>Jobs</h2>
          {jobs.map((j) => (
            <Link key={j.id} href="/jobs" className="result">
              <span aria-hidden="true" style={{ fontSize: 24 }}>💼</span>
              <span>
                <strong>{j.title}</strong>
                <span className="muted" style={{ display: "block" }}>{j.company} · {j.location}</span>
              </span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

function findPeople(userId: string, hidden: string[], q: string) {
  return db.user.findMany({
    where: {
      AND: [visibleTo(userId)],
      id: { notIn: hidden },
      OR: [
        { name: has(q) },
        { missionName: has(q) },
        { language: has(q) },
        { jobTitle: has(q) },
        { employer: has(q) },
        { industry: has(q) },
        { AND: [{ showHomeCity: true }, { homeCity: has(q) }] },
      ],
    },
    select: { id: true, name: true, avatarUrl: true, missionName: true, jobTitle: true, employer: true },
    orderBy: { name: "asc" },
    take: 10,
  });
}

function findCircles(userId: string, q: string) {
  return db.circle.findMany({
    where: {
      AND: [
        { OR: [{ name: has(q) }, { description: has(q) }] },
        // Private circles only show up for their own members.
        { OR: [{ visibility: "PUBLIC" }, { members: { some: { userId, status: "ACTIVE" } } }] },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
  });
}

function findPosts(userId: string, hidden: string[], q: string) {
  return db.post.findMany({
    where: {
      body: has(q),
      authorId: { notIn: hidden },
      OR: [{ circleId: null }, { circle: { members: { some: { userId, status: "ACTIVE" } } } }],
    },
    include: { author: { select: { name: true, avatarUrl: true } }, circle: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

function findJobs(hidden: string[], q: string) {
  return db.job.findMany({
    where: {
      postedById: { notIn: hidden },
      OR: [{ title: has(q) }, { company: has(q) }, { location: has(q) }, { description: has(q) }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
