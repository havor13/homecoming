import Link from "next/link";

export const metadata = { title: "Privacy | Homecoming" };

export default function PrivacyPage() {
  return (
    <main className="doc">
      <h1>Privacy summary</h1>
      <p className="muted">
        A plain-language summary of how Homecoming handles your information. Questions: [sampsonhavor43@gmail.com].
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Your account: name, email and a password stored only as a one-way hash.</li>
        <li>Your profile: mission, language, years served, home city, job details, bio and picture.</li>
        <li>What you post: posts, comments, reactions, jobs, events, messages and files you upload.</li>
        <li>Safety records: reports you make or that are made about you, and who you have blocked.</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>Members can see your profile. You can limit it to people who share a circle with you in Settings, and hide your home city.</li>
        <li>Posts in a circle are visible to that circle&apos;s members. Posts to everyone are visible to all members.</li>
        <li>Messages are visible to the people in that conversation.</li>
        <li>Moderators see a reported item, the reason and any note. They do not browse private messages.</li>
        <li>Messages are not end-to-end encrypted. The people who run Homecoming can technically reach the database.</li>
        <li>Your email is never shown to other members.</li>
      </ul>

      <h2>Services we use</h2>
      <ul>
        <li>Neon for the database, Vercel for hosting and uploaded files, and LiveKit for voice and video calls.</li>
        <li>Calls are connected through LiveKit. Homecoming does not record them.</li>
      </ul>

      <h2>Your controls</h2>
      <ul>
        <li>Change who can see and message you, and block people, in <Link href="/settings">Settings</Link>.</li>
        <li>Download your data, or delete your account and everything you posted, from the same page.</li>
        <li>Backups kept by our providers may hold deleted data for a short time before they expire.</li>
      </ul>

      <p>
        <Link href="/guidelines">Community guidelines</Link> · <Link href="/">Back to Homecoming</Link>
      </p>
    </main>
  );
}
