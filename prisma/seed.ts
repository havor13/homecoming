import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const circles = [
  { slug: "ghana-cape-coast-mission", name: "Ghana Cape Coast Mission", kind: "MISSION", description: "Everyone who served in the mission, across every year." },
  { slug: "philippines-cebu-mission", name: "Philippines Cebu Mission", kind: "MISSION", description: "Find your companions and the families who hosted you." },
  { slug: "spanish-speakers", name: "Spanish speakers", kind: "LANGUAGE", description: "Keep your language alive with conversation nights." },
  { slug: "home-within-the-last-year", name: "Home within the last year", kind: "RETURN_YEAR", description: "Adjusting to school, work and everyday life after the mission." },
  { slug: "jobs-and-careers", name: "Jobs and careers", kind: "INTEREST", description: "Leads, referrals and advice in every field." },
  { slug: "study-and-scripture", name: "Study and scripture", kind: "INTEREST", description: "Weekly study groups and quiet places to keep learning together." },
] as const;

async function main() {
  for (const c of circles) {
    await db.circle.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  // First invite code. It has no issuer, so the person who uses it is verified directly.
  const code = process.env.FIRST_INVITE_CODE ?? "HOME-START";
  await db.invite.upsert({ where: { code }, update: {}, create: { code } });
  console.log(`Seeded ${circles.length} circles. First invite code: ${code}`);
}

main().finally(() => db.$disconnect());
