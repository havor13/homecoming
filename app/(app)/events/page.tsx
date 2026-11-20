import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createEvent, toggleRsvp } from "@/lib/actions/community";

const dateFmt = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function EventsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const events = await db.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: {
      host: true,
      rsvps: { where: { userId }, select: { userId: true } },
      _count: { select: { rsvps: true } },
    },
  });

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Reunions and events</h1>
        <p className="muted">Gatherings for your mission, your area and your career.</p>
      </div>
      <div className="two">
        <div className="wide stack">
          {events.length === 0 && <p className="muted">No upcoming events. Host the first one.</p>}
          {events.map((e) => {
            const going = e.rsvps.length > 0;
            return (
              <article key={e.id} className="card">
                <div className="row">
                  <div className="grow">
                    <h2>{e.title}</h2>
                    <div className="muted">
                      {dateFmt.format(e.startsAt)} · {e.location} · Hosted by {e.host.name} · {e._count.rsvps} going
                    </div>
                  </div>
                  <form action={toggleRsvp.bind(null, e.id)}>
                    <button className={going ? "on" : "primary"}>{going ? "You are going" : "RSVP"}</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
        <form action={createEvent} className="rail card">
          <h2>Host an event</h2>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="location">Where</label>
            <input id="location" name="location" required />
          </div>
          <div className="field">
            <label htmlFor="startsAt">When</label>
            <input id="startsAt" name="startsAt" type="datetime-local" required />
          </div>
          <button className="primary">Create event</button>
        </form>
      </div>
    </>
  );
}
