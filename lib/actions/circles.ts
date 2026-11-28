"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { activeMembership } from "@/lib/access";
import { slugify } from "@/lib/format";
import { createNotification } from "@/lib/notifications";
import { circleMatches } from "@/lib/circle-match";
import type { FormState } from "@/lib/types";

function refresh() {
  revalidatePath("/", "layout");
}

const circleSchema = z.object({
  name: z.string().trim().min(3, "Give the circle a name of at least 3 characters.").max(60),
  description: z.string().trim().min(10, "Describe the circle in at least 10 characters.").max(300),
  kind: z.enum(["MISSION", "LANGUAGE", "RETURN_YEAR", "INTEREST"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  matchValue: z.string().trim().max(60).optional(),
});

export async function createCircle(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  const me = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (me?.status !== "VERIFIED") {
    return { error: "You can create circles once the member who invited you has confirmed you." };
  }

  const parsed = circleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Interest circles are open to everyone, so there is nothing to match.
  const matchValue = data.kind === "INTEREST" ? null : data.matchValue || null;
  if (data.kind === "RETURN_YEAR" && matchValue && !/\b(19|20)\d{2}\b/.test(matchValue)) {
    return { error: "For a return-year circle, enter a year such as 2023." };
  }

  const base = slugify(data.name) || "circle";
  const taken = await db.circle.findUnique({ where: { slug: base } });
  const slug = taken ? `${base}-${randomBytes(2).toString("hex")}` : base;

  const circle = await db.circle.create({
    data: {
      slug,
      name: data.name,
      description: data.description,
      kind: data.kind,
      visibility: data.visibility,
      matchValue,
      createdById: userId,
      members: { create: { userId, role: "ADMIN", status: "ACTIVE" } },
      thread: { create: {} },
    },
  });
  refresh();
  redirect(`/circles/${circle.slug}`);
}

/** Join, request to join (private circles), cancel a request, or leave. */
export async function toggleMembership(circleId: string) {
  const userId = await requireUserId();
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    select: { visibility: true, kind: true, matchValue: true, slug: true, name: true },
  });
  if (!circle) return;

  const key = { userId_circleId: { userId, circleId } };
  const existing = await db.membership.findUnique({ where: key });

  if (existing) {
    if (existing.status === "ACTIVE" && existing.role === "ADMIN") {
      // The last admin must hand over before leaving a circle that still has members.
      const otherAdmins = await db.membership.count({
        where: { circleId, role: "ADMIN", status: "ACTIVE", NOT: { userId } },
      });
      const otherMembers = await db.membership.count({
        where: { circleId, status: "ACTIVE", NOT: { userId } },
      });
      if (otherAdmins === 0 && otherMembers > 0) return;
    }
    await db.membership.delete({ where: key });
  } else {
    // Public circles let matching members straight in. Private circles, and people whose profile
    // doesn't match the circle, send a request for an admin to decide.
    const me = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, missionName: true, language: true, yearsServed: true },
    });
    const walkIn = circle.visibility === "PUBLIC" && !!me && circleMatches(circle, me);
    await db.membership.create({
      data: { userId, circleId, status: walkIn ? "ACTIVE" : "PENDING" },
    });
    // Tell the circle's admins that someone is waiting.
    if (!walkIn) {
      const admins = await db.membership.findMany({
        where: { circleId, role: "ADMIN", status: "ACTIVE" },
        select: { userId: true },
      });
      for (const a of admins) {
        await createNotification({
          userId: a.userId,
          type: "INVITE",
          text: `${me?.name ?? "Someone"} asked to join ${circle.name}`,
          href: `/circles/${circle.slug}?tab=members`,
        });
      }
    }
  }
  refresh();
}

async function isAdmin(userId: string, circleId: string) {
  const m = await activeMembership(userId, circleId);
  return m?.role === "ADMIN";
}

export async function approveMember(circleId: string, targetId: string) {
  const userId = await requireUserId();
  if (!(await isAdmin(userId, circleId))) return;
  const result = await db.membership.updateMany({
    where: { circleId, userId: targetId, status: "PENDING" },
    data: { status: "ACTIVE" },
  });
  if (result.count > 0) {
    const circle = await db.circle.findUnique({ where: { id: circleId }, select: { slug: true, name: true } });
    if (circle) {
      await createNotification({
        userId: targetId,
        type: "CONFIRMED",
        text: `You can now join the conversation in ${circle.name}`,
        href: `/circles/${circle.slug}`,
      });
    }
  }
  refresh();
}

/** Decline a request or remove a member. Admins cannot be removed this way. */
export async function removeMember(circleId: string, targetId: string) {
  const userId = await requireUserId();
  if (!(await isAdmin(userId, circleId)) || targetId === userId) return;
  await db.membership.deleteMany({
    where: { circleId, userId: targetId, role: "MEMBER" },
  });
  refresh();
}

export async function makeAdmin(circleId: string, targetId: string) {
  const userId = await requireUserId();
  if (!(await isAdmin(userId, circleId))) return;
  const result = await db.membership.updateMany({
    where: { circleId, userId: targetId, status: "ACTIVE", role: "MEMBER" },
    data: { role: "ADMIN" },
  });
  if (result.count > 0) {
    const circle = await db.circle.findUnique({ where: { id: circleId }, select: { slug: true, name: true } });
    if (circle) {
      await createNotification({
        userId: targetId,
        type: "CONFIRMED",
        text: `You are now an admin of ${circle.name}`,
        href: `/circles/${circle.slug}`,
      });
    }
  }
  refresh();
}

/** Lets a circle's admin set, change or clear who the circle is for. */
export async function updateCircleRequirement(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const circleId = String(formData.get("circleId") ?? "");
  if (!(await isAdmin(userId, circleId))) return { error: "Only a circle admin can change this." };

  const circle = await db.circle.findUnique({ where: { id: circleId }, select: { kind: true } });
  if (!circle || circle.kind === "INTEREST") return { error: "Interest circles are open to everyone." };

  const value = z.string().trim().max(60, "Keep it under 60 characters.").safeParse(formData.get("matchValue") ?? "");
  if (!value.success) return { error: value.error.issues[0].message };
  if (circle.kind === "RETURN_YEAR" && value.data && !/\b(19|20)\d{2}\b/.test(value.data)) {
    return { error: "For a return-year circle, enter a year such as 2023." };
  }

  await db.circle.update({ where: { id: circleId }, data: { matchValue: value.data || null } });
  refresh();
  return { ok: true };
}

const editSchema = z.object({
  name: z.string().trim().min(3, "Give the circle a name of at least 3 characters.").max(60),
  description: z.string().trim().min(10, "Describe the circle in at least 10 characters.").max(300),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

/** Lets a circle's admin change its name, description and visibility. The address stays the same. */
export async function updateCircle(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const circleId = String(formData.get("circleId") ?? "");
  if (!(await isAdmin(userId, circleId))) return { error: "Only a circle admin can edit this circle." };

  const parsed = editSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.circle.update({ where: { id: circleId }, data: parsed.data });
  refresh();
  return { ok: true };
}
