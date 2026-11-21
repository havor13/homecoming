// Values the browser needs for file inputs. Kept apart from lib/upload.ts, which uses
// server-only packages and must not be imported into client components.
export const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export const IMAGE_ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";

// Videos go straight from the browser to Blob (they are too big for a server action).
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const VIDEO_ACCEPT_ATTR = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const VIDEO_FOLDER = "post-videos";
