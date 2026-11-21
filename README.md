# Homecoming

A community platform for returned missionaries. Independent project, not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints.

Stack: Next.js 15 (App Router, Server Actions), Prisma + Postgres (Neon), Auth.js v5 (credentials), Vercel Blob for uploads.

## What works

- **Invite-only sign-up.** Every account needs an invite code. Codes issued by a verified member leave the new account "pending" until that member confirms them on their profile page. The first code (no issuer) verifies directly.
- **Profiles.** Profile picture, bio, mission, language, years served and home city. Every member also has a public profile page.
- **People.** Search members by name, mission, language or home city, and message them.
- **Feed.** Post text, photos and files to everyone or to a circle. React with emojis, comment, and delete your own posts and comments.
- **Mission circles.** Anyone verified can create a circle, public (anyone can join) or private (admins approve each request). Each circle has posts, its own chat and a member list. Admins approve or decline requests, remove members, promote other admins and delete any post or comment in the circle.
- **Messages.** Direct messages, group chats you create with a name and members, and a chat for every circle. Photos and files can be sent in all of them. Chats refresh every few seconds.
- **Calls.** Start a video or voice call from any chat: direct messages, group chats and circle chats. Everyone in the chat sees a "Call in progress" banner with a Join button, and a note is added to the chat when a call starts. Powered by LiveKit Cloud.
- **Jobs and referrals.** Verified members post job leads (with an optional apply link and a "I can give a referral" flag). Anyone can search by title, company, place or type and message the poster. Listings disappear after 60 days, and each person can post up to 5 a day.
- **Mentors.** Members can list themselves as mentors with a short note on what they can help with. Others browse by industry or search, and send a first message through a request form (at most 5 requests a day, and one per mentor per week).
- **Career profiles.** Job title, employer, industry, "open to work" and "offers mentoring" show on profiles and in People search, which also has an Open to work filter.
- **Reunions and events.** Host an event, RSVP.

## Run it

```bash
npm install
vercel env pull .env        # DATABASE_URL, DATABASE_URL_UNPOOLED, BLOB_READ_WRITE_TOKEN
# add AUTH_SECRET to .env (any long random string)
npm run db:push             # create or update tables
npm run db:seed             # circles + first invite code (HOME-START)
npm run dev
```

Open http://localhost:3000/join and sign up with `HOME-START`. Set `FIRST_INVITE_CODE` before seeding to choose your own.

### Updating an existing database

This version adds columns and tables (avatars, comments, attachments, circle visibility and roles, circle chat). They are all additive and have defaults, so `npm run db:push` upgrades an existing database without losing data.

### Uploads (Vercel Blob)

1. In the Vercel dashboard, open the project's **Storage** tab, create a **Blob** store and connect it to the project.
2. `vercel env pull .env` brings `BLOB_READ_WRITE_TOKEN` down for local use.

Limits: up to 4 files and 4 MB in total per post or message (Vercel Functions accept request bodies of about 4.5 MB). Allowed types: JPG, PNG, WebP, GIF, PDF, TXT and Word, Excel and PowerPoint files. SVG is blocked on purpose. Without the token the app still runs and shows a clear message when someone tries to attach a file.

### Calls (LiveKit Cloud)

1. Create a free project at https://cloud.livekit.io.
2. In the project's Settings, copy the project URL (it starts with `wss://`) and create an API key. Copy the key and its secret.
3. Add them to `.env` and to the Vercel project's environment variables:

```
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."
```

4. Restart the app. The Video call and Voice call buttons appear above every chat once these are set. Without them the buttons stay hidden.

Only people who can read a chat can join its call. The server checks this before it hands out a call pass, and the pass expires after 2 hours. Browsers only allow camera and microphone access on https or localhost.

## Deploy

Vercel works. With the Neon integration (leave its Auth and Realtime options off), Vercel sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Add `AUTH_SECRET` yourself and connect a Blob store, then run `npx prisma db push` and `npm run db:seed` once against the database.

## Next steps

1. Larger uploads and video: upload straight from the browser to Blob instead of through a server action.
2. True real-time chat (Pusher, Ably or Neon Realtime) in place of the 5-second refresh.
3. Notifications and unread counts.
4. Reporting and a site-wide moderator role.
5. Rate limiting on login, sign-up and posting.
6. Circle settings (edit, archive, transfer ownership) and event comments.
7. Ringing: a push or email nudge when someone starts a call.

## Moderation and privacy

- **Reports.** Every post, comment, message, job and profile has a Report button. Reports go to a queue at `/admin/reports`.
- **Moderators.** Set `MODERATOR_EMAILS` (comma-separated) in `.env` and in Vercel. Moderators see only what was reported. They can dismiss a report, remove the content, or suspend the member. Suspended members cannot sign in and can be restored from the same page.
- **Blocking.** Blocking someone hides their posts, comments, jobs and profile from you and stops direct messages either way. Messages from a blocked person still appear inside group chats you share.
- **Privacy settings** (`/settings`): who can see your profile (everyone or only people in your circles), who can message you, and whether your home city is shown.
- **Your data.** `/settings` has a JSON export and permanent account deletion (removes your content and uploaded files).
- **Public pages.** `/guidelines` and `/privacy` are plain-language drafts. Replace every `[YOUR CONTACT EMAIL]` and have the text reviewed before launch. They are not legal advice.
- After pulling this update run `npm run db:push` (additive: new columns and the Report and Block tables).

## Stories

- Members can share a photo or a short text on a coloured background from Home ("Add story"). Stories disappear after 24 hours.
- Who can see a story follows the profile privacy setting. Blocked people never see each other's stories.
- Authors see who watched each story and can delete it. Anyone else can report it; moderators can remove it.
- Expired stories are hidden straight away and their rows and photos are deleted the next time anyone posts a story.
- After updating run `npm run db:push` (adds the Story and StoryView tables and a STORY report type).

## Videos on posts

Posts can include one video (MP4, WebM or MOV, up to 50 MB). The browser uploads it straight to Vercel Blob using a short-lived token from `/api/blob/upload`, so the 4 MB server limit does not apply. The post then verifies the file is in the member's own folder before saving it. Deleting a post, or the account, deletes the video.

## Email: password reset and notifications

- **Password reset:** "Forgot your password?" on the sign-in page emails a one-hour, single-use link. The form gives the same answer whether or not the email has an account. Up to 3 links an hour per account, and a "your password was changed" email is sent afterwards.
- **Notifications:** new messages in direct and group chats (at most one email per conversation every 30 minutes), comments on your posts, and mentoring requests. Circle chats never send email. Each person can turn these off in Settings. Emails contain who wrote and a link, never the text.
- **Setup with Gmail:** turn on 2-Step Verification for the Gmail account, create an App Password, and set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (plus `APP_URL`). Run `npm install` for the new package. Gmail allows about 500 emails a day.
- **Setup with Resend:** create a Resend account, verify your sending domain, and set `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL` in `.env` and in Vercel. Run `npm run db:push` for the new columns and table.
- Without `RESEND_API_KEY` (for example locally) the email is printed in the terminal, including the reset link.
