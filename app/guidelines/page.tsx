import Link from "next/link";

export const metadata = { title: "Community guidelines | Homecoming" };

export default function GuidelinesPage() {
  return (
    <main className="doc">
      <h1>Community guidelines</h1>
      <p className="muted">
        Homecoming is a community for returned missionaries. It is independent and not affiliated with or endorsed
        by The Church of Jesus Christ of Latter-day Saints.
      </p>

      <h2>Be kind and honest</h2>
      <ul>
        <li>Treat everyone with respect. No harassment, bullying, threats or hate.</li>
        <li>Be who you say you are. Don&apos;t pretend to be someone else or claim a mission you did not serve.</li>
        <li>Keep content appropriate for a community of returned missionaries and their friends.</li>
      </ul>

      <h2>Protect people&apos;s privacy</h2>
      <ul>
        <li>Don&apos;t share anyone&apos;s private details, photos or messages without their permission.</li>
        <li>Don&apos;t contact people who have asked you to stop. Blocking is always available.</li>
      </ul>

      <h2>Keep it useful</h2>
      <ul>
        <li>No spam, scams or unrequested selling.</li>
        <li>Job posts should be real openings or referrals you can stand behind.</li>
        <li>Mentoring requests should be specific, and a no or no reply is fine.</li>
      </ul>

      <h2>Reporting and what happens next</h2>
      <p>
        Use the Report button on a post, comment, message, job or profile. Moderators see the reported item and
        your note, not your other messages. Depending on what they find, they may dismiss the report, remove the
        content or suspend the member. To appeal, contact [homecomingrm@gmail.com].
      </p>

      <p>
        <Link href="/privacy">Privacy summary</Link> · <Link href="/">Back to Homecoming</Link>
      </p>
    </main>
  );
}
