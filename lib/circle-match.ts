// Decides whether a member's profile fits a circle. Profile fields are free text, so the match is
// forgiving: case, punctuation and the word "mission" are ignored.

type CircleRule = { kind: "MISSION" | "LANGUAGE" | "RETURN_YEAR" | "INTEREST"; matchValue: string | null };
type Profile = { missionName: string | null; language: string | null; yearsServed: string | null };

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\bmission\b/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function hasRequirement(circle: CircleRule) {
  return circle.kind !== "INTEREST" && !!circle.matchValue && normalize(circle.matchValue) !== "";
}

/** True when the circle is open to everyone, or the profile fits it. */
export function circleMatches(circle: CircleRule, profile: Profile) {
  if (!hasRequirement(circle)) return true;
  const want = normalize(circle.matchValue!);
  const raw = circle.kind === "MISSION" ? profile.missionName : circle.kind === "LANGUAGE" ? profile.language : profile.yearsServed;
  if (!raw) return false;
  const have = normalize(raw);
  if (!have) return false;
  if (circle.kind === "RETURN_YEAR") return have.split(" ").includes(want) || have.includes(want);
  return have.includes(want) || (have.length >= 3 && want.includes(have));
}

/** A short phrase for the circle's card, for example "Served in Ghana Accra". */
export function requirementLabel(circle: CircleRule) {
  if (!hasRequirement(circle)) return "";
  const v = circle.matchValue!.trim();
  if (circle.kind === "MISSION") return `Served in ${v}`;
  if (circle.kind === "LANGUAGE") return `Speaks ${v}`;
  return `Returned ${v}`;
}
