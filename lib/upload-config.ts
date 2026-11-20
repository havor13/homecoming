// Values the browser needs for file inputs. Kept apart from lib/upload.ts, which uses
// server-only packages and must not be imported into client components.
export const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export const IMAGE_ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";
