import Link from "next/link";

// Set NEXT_PUBLIC_CONTACT_EMAIL in .env to show a contact link.
const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          <strong>Homecoming</strong> is an independent community for returned missionaries. It is not affiliated
          with, sponsored by, or endorsed by The Church of Jesus Christ of Latter-day Saints.
        </p>
        <nav aria-label="Footer" className="site-footer-links">
          <Link href="/guidelines">Community guidelines</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/delete-account">Delete your account</Link>
          {contact && <a href={`mailto:${contact}`}>Contact</a>}
        </nav>
        <p className="muted">© {new Date().getFullYear()} Homecoming</p>
      </div>
    </footer>
  );
}
