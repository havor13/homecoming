// Shared by server and client code, so it must not import anything server-only.

export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Education",
  "Business and finance",
  "Engineering",
  "Law and government",
  "Marketing and media",
  "Skilled trades",
  "Nonprofit and service",
  "Science and research",
  "Other",
] as const;

export const JOB_TYPES = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"] as const;

export const JOB_TYPE_LABEL: Record<(typeof JOB_TYPES)[number], string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

export function isIndustry(value: string) {
  return (INDUSTRIES as readonly string[]).includes(value);
}
