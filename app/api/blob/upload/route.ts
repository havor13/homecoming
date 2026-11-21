import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MAX_VIDEO_BYTES, VIDEO_FOLDER, VIDEO_TYPES } from "@/lib/upload-config";

// Hands the browser a short-lived token so it can upload one video straight to Vercel Blob.
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId }, select: { suspendedAt: true } });
  if (!user || user.suspendedAt) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Videos must live under the person's own folder, so the post can verify them later.
        if (!pathname.startsWith(`${VIDEO_FOLDER}/${userId}/`)) throw new Error("Bad upload path.");
        return {
          allowedContentTypes: [...VIDEO_TYPES],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
      // Nothing to do here: the post itself records the file when it is created.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
