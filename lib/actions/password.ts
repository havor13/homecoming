"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { after } from "next/server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { requireUserId } from "@/lib/session";
import { clientIp, loginBlocked, recordFailure } from "@/lib/rate-limit";
import { z } from "zod";
import { db } from "@/lib/db";
import { appUrl, layout, sendEmail } from "@/lib/email";
import type { FormState } from "@/lib/types";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const SAME_ANSWER = "If that email belongs to a Homecoming account, we have sent a link to reset the password. It works for 1 hour.";

/** Always gives the same answer, so nobody can use this form to find out who has an account. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().email("Enter a valid email.").safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };

  after(async () => {
    const user = await db.user.findUnique({
      where: { email: email.data.toLowerCase() },
      select: { id: true, email: true, name: true, suspendedAt: true },
    });
    if (!user || user.suspendedAt) return;

    const recent = await db.passwordReset.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= 3) return;

    const token = randomBytes(32).toString("hex");
    await db.passwordReset.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const url = `${appUrl()}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Homecoming password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password. It works for 1 hour:\n${url}\n\nIf you did not ask for this, you can ignore this email. Your password will not change.`,
      html: layout({
        heading: "Reset your password",
        body: `<p>Hi ${user.name.replace(/[<>&]/g, "")},</p><p>Use the button below to choose a new password. The link works for 1 hour.</p><p>If you did not ask for this, ignore this email. Your password will not change.</p>`,
        buttonLabel: "Choose a new password",
        buttonUrl: url,
      }),
    });
  });

  return { ok: true, message: SAME_ANSWER };
}

const resetSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two passwords do not match.", path: ["confirm"] });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const reset = await db.passwordReset.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { error: "This link has expired or was already used. Ask for a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.$transaction([
    // Raising sessionVersion signs the account out everywhere else.
    db.user.update({ where: { id: reset.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    // Any other unused links stop working.
    db.passwordReset.deleteMany({ where: { userId: reset.userId, usedAt: null, id: { not: reset.id } } }),
  ]);

  after(() =>
    sendEmail({
      to: reset.user.email,
      subject: "Your Homecoming password was changed",
      text: `Hi ${reset.user.name},\n\nYour password was just changed. If this was not you, reset it again right away and tell us at ${appUrl()}/privacy.`,
      html: layout({
        heading: "Your password was changed",
        body: "<p>Your Homecoming password was just changed. If this was not you, reset it again right away.</p>",
        buttonLabel: "Reset it again",
        buttonUrl: `${appUrl()}/forgot-password`,
      }),
    }),
  );

  return { ok: true };
}

const changeSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z.string().min(8, "The new password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two new passwords do not match.", path: ["confirm"] });

/** Change your password while signed in. Every other device is signed out; this one stays signed in. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = changeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, passwordHash: true },
  });
  if (!user) return { error: "Account not found." };

  const ip = clientIp(await headers());
  if (await loginBlocked(user.email, ip)) return { error: "Too many wrong passwords. Try again in 15 minutes." };
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    await recordFailure("LOGIN", user.email, ip);
    return { error: "Your current password is not correct." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });

  after(() =>
    sendEmail({
      to: user.email,
      subject: "Your Homecoming password was changed",
      text: `Hi ${user.name},\n\nYour password was just changed. If this was not you, reset it again right away: ${appUrl()}/forgot-password`,
      html: layout({
        heading: "Your password was changed",
        body: "<p>Your Homecoming password was just changed, and other devices were signed out. If this was not you, reset it again right away.</p>",
        buttonLabel: "Reset it again",
        buttonUrl: `${appUrl()}/forgot-password`,
      }),
    }),
  );

  // Sign this device in again with the new version, so only the other devices are signed out.
  try {
    await signIn("credentials", { email: user.email, password: parsed.data.password, redirectTo: "/settings?password=changed" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Password changed, but signing back in failed. Please sign in again." };
    throw e; // the redirect
  }
}

/** Signs this device and every other device out. */
export async function signOutEverywhere() {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
  await signOut({ redirectTo: "/login" });
}
