import Link from "next/link";

export const metadata = { title: "Terms of use | Homecoming" };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "[homecoingrm@gmail.com]";

export default function TermsPage() {
  return (
    <main className="doc">
      <h1>Terms of use</h1>
      <p className="muted">
        A plain-language draft. These terms are not legal advice and should be reviewed before launch. Questions:{" "}
        {contact}. Last updated: [24/11/2026].
      </p>

      <h2>Who we are</h2>
      <p>
        Homecoming is an independent community for returned missionaries. It is not owned, run, sponsored or endorsed
        by The Church of Jesus Christ of Latter-day Saints, and nothing here is an official Church statement.
      </p>

      <h2>Who can join</h2>
      <ul>
        <li>You must be invited by a member, and you must have served a mission.</li>
        <li>You must be 18 or older.</li>
        <li>You must give true information about yourself and keep your password private. You are responsible for what happens on your account.</li>
      </ul>

      <h2>How to behave</h2>
      <p>
        You agree to follow the <Link href="/guidelines">community guidelines</Link>. In short: be kind, do not harass
        anyone, do not post spam, scams or anything illegal, and do not share other people&apos;s private information.
      </p>

      <h2>What you post</h2>
      <ul>
        <li>You own what you post. You allow Homecoming to store it and show it to the people you chose to share it with, so the service can work.</li>
        <li>Only post things you have the right to share. Do not post other people&apos;s photos or private messages without their permission.</li>
        <li>Posts and messages are written by members. Homecoming does not check them and is not responsible for them.</li>
      </ul>

      <h2>Moderation</h2>
      <p>
        Members can report content. Moderators may remove content, or suspend or remove a member, who breaks these
        terms or the guidelines. You can appeal by emailing {contact}.
      </p>

      <h2>Jobs, mentoring and advice</h2>
      <p>
        Job posts, referrals and mentoring come from other members. Homecoming does not guarantee any job or outcome,
        and you should check opportunities yourself before sharing money or personal details.
      </p>

      <h2>Leaving</h2>
      <p>
        You can delete your account at any time. See <Link href="/delete-account">how to delete your account</Link>.
      </p>

      <h2>Changes and availability</h2>
      <p>
        Homecoming is provided as is, and may change or be unavailable at times. To the extent the law allows,
        Homecoming and its organisers are not liable for losses from using the service. We may update these terms
        and will tell members about important changes.
      </p>

      <p>
        <Link href="/privacy">Privacy summary</Link> · <Link href="/guidelines">Community guidelines</Link> ·{" "}
        <Link href="/">Back to Homecoming</Link>
      </p>
    </main>
  );
}
