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
