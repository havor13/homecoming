import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

// Vercel Functions accept request bodies up to 4.5 MB, so everything attached to one
// post or message has to fit inside this total. Larger files need direct-to-Blob client uploads.
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const MAX_FILES = 4;

// Allowed types and the file extensions each one may have. SVG is left out on purpose
// because it can carry scripts.
const ALLOWED: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
};

export class UploadError extends Error {}

export type UploadedFile = { url: string; name: string; contentType: string; size: number };

function extensionOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function pickFiles(formData: FormData, field: string): File[] {
  return formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
}

function validate(files: File[]) {
  if (files.length > MAX_FILES) {
    throw new UploadError(`You can attach up to ${MAX_FILES} files at a time.`);
  }
  let total = 0;
  for (const file of files) {
    const extensions = ALLOWED[file.type];
    if (!extensions || !extensions.includes(extensionOf(file.name))) {
      throw new UploadError(`"${file.name}" is not an allowed file type. Use images, PDFs, text or Office files.`);
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) {
    throw new UploadError("Attachments can total up to 4 MB.");
  }
}

export async function uploadFiles(files: File[], folder: string, userId: string): Promise<UploadedFile[]> {
  if (files.length === 0) return [];
  validate(files);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new UploadError("File uploads are not set up yet. Add a Vercel Blob store to the project.");
  }

  const done: UploadedFile[] = [];
  try {
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
      const blob = await put(`${folder}/${userId}/${randomUUID()}-${safeName}`, file, {
        access: "public",
        contentType: file.type,
      });
      done.push({ url: blob.url, name: file.name.slice(0, 200), contentType: file.type, size: file.size });
    }
  } catch {
    // Do not leave half of a batch behind.
    await deleteBlobs(done.map((d) => d.url));
    throw new UploadError("The upload failed. Please try again.");
  }
  return done;
}

/** Like uploadFiles, but returns a result instead of throwing for problems the person can fix. */
export async function tryUpload(
  files: File[],
  folder: string,
  userId: string,
): Promise<{ ok: true; files: UploadedFile[] } | { ok: false; error: string }> {
  try {
    return { ok: true, files: await uploadFiles(files, folder, userId) };
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function deleteBlobs(urls: string[]) {
  if (urls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(urls);
  } catch {
    // Best effort: a leftover file is not worth failing the request for.
  }
}
