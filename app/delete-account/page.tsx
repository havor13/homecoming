import Link from "next/link";

export const metadata = { title: "Delete your account | Homecoming" };

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "[homecomingrm@gmail.com]";

export default function DeleteAccountPage() {
  return (
    <main className="doc">
      <h1>Delete your Homecoming account</h1>
      <p className="muted">Homecoming is an independent community and is not affiliated with The Church of Jesus Christ of Latter-day Saints.</p>

      <h2>Delete it yourself (fastest)</h2>
      <ol>
        <li><Link href="/login">Sign in</Link> to Homecoming.</li>
        <li>Open <strong>Privacy and settings</strong>.</li>
        <li>Scroll to <strong>Delete my account</strong>, enter your password, tick the confirmation box and press <strong>Delete my account</strong>.</li>
      </ol>
      <p>Deletion happens immediately. It cannot be undone. You can download a copy of your data from the same page first.</p>

      <h2>Can&apos;t sign in?</h2>
      <p>
        Email <a href={`mailto:${contact}`}>{contact}</a> from the address you joined with, with the subject
        &quot;Delete my account&quot;. We will delete the account within 14 days and confirm by email.
      </p>

      <h2>What is deleted</h2>
      <ul>
        <li>Your profile, profile picture and settings.</li>
        <li>Your posts, comments, reactions, stories, jobs, events you created and RSVPs.</li>
        <li>Messages you sent, and files you uploaded in posts, stories and chats.</li>
        <li>Your invite codes, and your memberships in circles.</li>
      </ul>

      <h2>What may be kept</h2>
      <ul>
        <li>
          A short text excerpt in a safety report that another member made about you or your content may be kept
          without your name attached, so moderators can protect other members.
        </li>
        <li>Backups made by our database provider may take up to 30 days to be overwritten.</li>
      </ul>

      <p><Link href="/privacy">Read the privacy summary</Link></p>
    </main>
  );
}
