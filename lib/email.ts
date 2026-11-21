import nodemailer from "nodemailer";

// Sends email through Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) or, if those are not set, through
// Resend's HTTP API (RESEND_API_KEY). With neither, the email is printed to the server log.

export function appUrl() {
  const explicit = process.env.APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Mail = { to: string; subject: string; text: string; html: string };

export async function sendEmail(mail: Mail) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass.replace(/\s+/g, "") },
      });
      await transport.sendMail({
        from: process.env.EMAIL_FROM || `Homecoming <${gmailUser}>`,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    } catch (e) {
      console.error("Email failed:", e);
    }
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email not sent: no email service is set up]\nTo: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Homecoming <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });
    if (!res.ok) console.error("Email failed:", res.status, await res.text());
  } catch (e) {
    console.error("Email failed:", e);
  }
}

/** Wraps a short message in a plain, readable email layout. */
export function layout(opts: { heading: string; body: string; buttonLabel?: string; buttonUrl?: string; footer?: string }) {
  const button = opts.buttonUrl
    ? `<p style="margin:24px 0"><a href="${opts.buttonUrl}" style="background:#0a4f43;color:#ffffff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(opts.buttonLabel ?? "Open Homecoming")}</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#11231e;line-height:1.5">
<h1 style="font-family:Georgia,serif;font-size:22px;color:#0a4f43;margin:0 0 16px">${escapeHtml(opts.heading)}</h1>
<div style="font-size:16px">${opts.body}</div>
${button}
<p style="font-size:13px;color:#4a5c56;border-top:1px solid #d5e0db;padding-top:14px">${opts.footer ?? "Homecoming is an independent community, not affiliated with The Church of Jesus Christ of Latter-day Saints."}</p>
</div>`;
}
