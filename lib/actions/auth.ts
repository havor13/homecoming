"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { isModeratorEmail } from "@/lib/moderation";

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

  const invite = await db.invite.findUnique({
    where: { code: data.inviteCode.toUpperCase() },
    include: { issuer: { select: { email: true } } },
  });
  if (!invite || invite.usedById) {
    return { error: "That invite code is not valid or has already been used." };
  }
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    await db.$transaction(async (tx) => {
      // Claim the invite first so two people can never use the same code.
      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, usedById: null },
        data: { usedAt: new Date() },
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
          // A member who invites someone vouches for them. Seed and moderator invites verify directly.
          status: invite.issuerId && !isModeratorEmail(invite.issuer?.email) ? "PENDING" : "VERIFIED",
        },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { usedById: user.id } });

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
    if (e instanceof AuthError) return { error: "Email or password is incorrect." };
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
