// Shared by server and client code, so it must not import anything server-only.

export const REPORT_TARGETS = ["STORY", "POST", "COMMENT", "MESSAGE", "USER", "JOB"] as const;
export type ReportTargetType = (typeof REPORT_TARGETS)[number];

export const REPORT_REASONS = ["SPAM", "HARASSMENT", "INAPPROPRIATE", "FALSE_IDENTITY", "PRIVACY", "OTHER"] as const;

export const REASON_LABEL: Record<(typeof REPORT_REASONS)[number], string> = {
  SPAM: "Spam or selling",
  HARASSMENT: "Harassment or bullying",
  INAPPROPRIATE: "Inappropriate content",
  FALSE_IDENTITY: "Pretending to be someone else, or not a returned missionary",
  PRIVACY: "Shares someone's private information",
  OTHER: "Something else",
};

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  STORY: "Story",
  POST: "Post",
  COMMENT: "Comment",
  MESSAGE: "Message",
  USER: "Member",
  JOB: "Job",
};
