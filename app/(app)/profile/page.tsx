import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyMember } from "@/lib/actions/community";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  const me = await db.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: {
      invitesIssued: { orderBy: { createdAt: "desc" }, include: { usedBy: true } },
      invitees: { where: { status: "PENDING" } },
    },
  });
  const verified = me.status === "VERIFIED";

  return (
    <>
      <div className="row">
        <h1 className="grow">My profile</h1>
        <Link href={`/people/${me.id}`}>See how others see it</Link>
      </div>
      <div className="two">
        <div className="wide stack">
          <span className={verified ? "chip" : "chip amber"} style={{ alignSelf: "flex-start" }}>
            {verified ? "Verified returned missionary" : "Waiting for the member who invited you to confirm"}
          </span>
          <ProfileForm
            profile={{
              name: me.name,
              missionName: me.missionName,
              language: me.language,
              yearsServed: me.yearsServed,
              homeCity: me.homeCity,
              bio: me.bio,
              industry: me.industry,
              jobTitle: me.jobTitle,
              employer: me.employer,
              lookingForWork: me.lookingForWork,
              openToMentor: me.openToMentor,
              mentorAbout: me.mentorAbout,
              avatarUrl: me.avatarUrl,
            }}
          />
        </div>

        <aside className="rail stack">
          {me.invitees.length > 0 && (
            <section className="card">
              <h2>Confirm new members</h2>
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
          <section className="card">
            <h2>Invite a returned missionary</h2>
            {verified ? (
              <Link href="/invites" className="button">Invite members</Link>
            ) : (
              <p className="muted">You can invite others once you are confirmed.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
