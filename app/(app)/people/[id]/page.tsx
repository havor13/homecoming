import { currentStatus } from "@/lib/member-status";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { startDirectThread } from "@/lib/actions/chat";
import { toggleBlock } from "@/lib/actions/privacy";
import { hiddenUserIds } from "@/lib/privacy";
import { Avatar } from "@/components/Avatar";
import { ReportButton } from "@/components/ReportButton";
import { RequestMentoringForm } from "@/components/RequestMentoringForm";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const viewerId = session!.user.id;
  const isSelf = id === viewerId;

  // People you blocked, or who blocked you, simply do not exist as far as this page is concerned.
  if (!isSelf && (await hiddenUserIds(viewerId)).includes(id)) notFound();

  const person = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      missionName: true,
      language: true,
      yearsServed: true,
      homeCity: true,
      showHomeCity: true,
      profileVisibility: true,
      suspendedAt: true,
      avatarUrl: true,
      status: true,
      statusText: true,
      statusUpdatedAt: true,
      industry: true,
      jobTitle: true,
      employer: true,
      lookingForWork: true,
      openToMentor: true,
      mentorAbout: true,
    },
  });
  if (!person || (person.suspendedAt && !isSelf)) notFound();

  // Circles both people belong to. Private circle names only appear to members.
  const sharedCircles = isSelf
    ? []
    : await db.circle.findMany({
        where: {
          AND: [
            { members: { some: { userId: person.id, status: "ACTIVE" } } },
            { members: { some: { userId: viewerId, status: "ACTIVE" } } },
          ],
        },
        select: { id: true, name: true, slug: true },
      });

  const limited = !isSelf && person.profileVisibility === "CIRCLES" && sharedCircles.length === 0;

  if (limited) {
    return (
      <section className="card" style={{ maxWidth: 640, gap: 16 }}>
        <div className="row">
          <Avatar name={person.name} url={person.avatarUrl} size={96} />
          <div className="grow">
            <h1 style={{ fontSize: 28 }}>{person.name}</h1>
            <p className="muted">This member shares their profile only with people in their circles.</p>
          </div>
        </div>
        <div className="row">
          <form action={startDirectThread.bind(null, person.id)}>
            <button>Message</button>
          </form>
          <ReportButton targetType="USER" targetId={person.id} />
          <Link href="/people">All people</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="card" style={{ maxWidth: 640, gap: 16 }}>
        <div className="row">
          <Avatar name={person.name} url={person.avatarUrl} size={96} />
          <div className="grow">
            <h1 style={{ fontSize: 28 }}>{person.name}</h1>
            <span className={person.status === "VERIFIED" ? "chip" : "chip amber"}>
              {person.status === "VERIFIED" ? "Verified returned missionary" : "Waiting to be confirmed"}
            </span>
          </div>
        </div>

        {currentStatus(person) && <p className="status-line big">{currentStatus(person)}</p>}

        {person.bio && <p style={{ whiteSpace: "pre-wrap" }}>{person.bio}</p>}

        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px 16px" }}>
          <dt className="muted">Mission</dt><dd style={{ margin: 0 }}>{person.missionName ?? "-"}</dd>
          <dt className="muted">Language</dt><dd style={{ margin: 0 }}>{person.language ?? "-"}</dd>
          <dt className="muted">Served</dt><dd style={{ margin: 0 }}>{person.yearsServed ?? "-"}</dd>
          {(person.showHomeCity || isSelf) && (
            <>
              <dt className="muted">Home city</dt><dd style={{ margin: 0 }}>{person.homeCity ?? "-"}</dd>
            </>
          )}
        </dl>

        {(person.jobTitle || person.employer || person.industry || person.lookingForWork || person.openToMentor) && (
          <div className="stack" style={{ gap: 8 }}>
            <h2>Work</h2>
            {(person.jobTitle || person.employer) && (
              <p>{[person.jobTitle, person.employer].filter(Boolean).join(" at ")}</p>
            )}
            <div className="row">
              {person.industry && <span className="chip">{person.industry}</span>}
              {person.lookingForWork && <span className="chip amber">Open to work</span>}
              {person.openToMentor && <span className="chip">Offers mentoring</span>}
            </div>
            {person.openToMentor && person.mentorAbout && (
              <p style={{ whiteSpace: "pre-wrap" }}>{person.mentorAbout}</p>
            )}
            {person.openToMentor && !isSelf && (
              <RequestMentoringForm mentorId={person.id} mentorName={person.name} />
            )}
          </div>
        )}

        {sharedCircles.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <h2>Circles you share</h2>
            <div className="row">
              {sharedCircles.map((c) => (
                <Link key={c.id} className="chip" href={`/circles/${c.slug}`}>{c.name}</Link>
              ))}
            </div>
          </div>
        )}

        <div className="row">
          {isSelf ? (
            <Link className="btn primary" href="/profile">Edit my profile</Link>
          ) : (
            <>
              <form action={startDirectThread.bind(null, person.id)}>
                <button className="primary">Message</button>
              </form>
              <form action={toggleBlock.bind(null, person.id)}>
                <button>Block</button>
              </form>
              <ReportButton targetType="USER" targetId={person.id} />
            </>
          )}
          <Link href="/people">All people</Link>
        </div>
      </section>
    </>
  );
}
