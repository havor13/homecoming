"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { headers } from "next/headers";
import { isModeratorEmail } from "@/lib/moderation";
import { clientIp, joinBlocked, recordFailure } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export type FormState = { error?: string } | undefined;

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Enter your invite code."),
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  missionName: z.string().trim().min(2, "Enter your mission name."),
  language: z.string().trim().optional(),
  yearsServed: z.string().trim().optional(),
});

export async function join(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const ip = clientIp(await headers());
  if (await joinBlocked(ip)) return { error: "Too many wrong invite codes. Please try again in an hour." };

  const invite = await db.invite.findUnique({
    where: { code: data.inviteCode.toUpperCase() },
    include: { issuer: { select: { email: true } } },
  });
  if (!invite || invite.usedById || invite.useCount >= invite.maxUses) {
    await recordFailure("JOIN", null, ip);
    return { error: "That invite code is not valid or has already been used." };
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { error: "That invite code has expired. Ask the person who invited you for a new one." };
  }
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    await db.$transaction(async (tx) => {
      // Claim a use first so a code can never be used more times than allowed, even at the same moment.
      const now = new Date();
      const claimed = await tx.invite.updateMany({
        where: {
          id: invite.id,
          usedById: null,
          useCount: { lt: invite.maxUses },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { usedAt: now, useCount: { increment: 1 } },
      });
      if (claimed.count !== 1) throw new Error("INVITE_TAKEN");

      const user = await tx.user.create({
        data: {
          email,
          name: data.name,
          passwordHash,
          missionName: data.missionName,
          language: data.language || null,
          yearsServed: data.yearsServed || null,
          invitedById: invite.issuerId,
          joinedViaId: invite.id,
          // A member who invites someone vouches for them. Seed and moderator invites verify directly.
          status: invite.issuerId && !isModeratorEmail(invite.issuer?.email) ? "PENDING" : "VERIFIED",
        },
      });
      // Single-use codes also record who used them, which older screens rely on.
      if (invite.maxUses === 1) await tx.invite.update({ where: { id: invite.id }, data: { usedById: user.id } });

      // Put the new member in the circle that matches their mission, if one exists.
      const slug = data.missionName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const circle = await tx.circle.findUnique({ where: { slug } });
      if (circle) {
        await tx.membership.create({ data: { userId: user.id, circleId: circle.id } });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVITE_TAKEN") {
      return { error: "That invite code has already been used." };
    }
    throw e;
  }

  if (invite.issuerId) {
    await createNotification({
      userId: invite.issuerId,
      type: "INVITE",
      text: `${data.name} joined with your invite. Confirm them when you are ready.`,
      href: "/invites",
    });
  }

  try {
    await signIn("credentials", { email, password: data.password, redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created, but sign-in failed. Try logging in." };
    throw e; // Next.js redirect
  }
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email or password is incorrect. After 5 wrong tries, sign-in is paused for 15 minutes." };
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
