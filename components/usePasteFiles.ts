"use client";

import { useEffect, useState } from "react";
import type { ClipboardEvent } from "react";

const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Lets someone paste a copied image or screenshot into a text box. The image is added to the
 * form's file input, so it goes through the same checks as any attachment. Pasting text works as normal.
 */
export function usePasteFiles(fileInputId: string) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 4000);
    return () => clearTimeout(t);
  }, [note]);

  function onPaste(e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const pasted = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type in IMAGE_EXT);
    if (pasted.length === 0) return; // plain text paste: leave it alone

    const input = document.getElementById(fileInputId) as HTMLInputElement | null;
    if (!input) return;
    e.preventDefault();

    const dt = new DataTransfer();
    for (const f of Array.from(input.files ?? [])) dt.items.add(f);
    pasted.forEach((f, i) => {
      const ext = IMAGE_EXT[f.type];
      dt.items.add(new File([f], `pasted-image-${Date.now()}-${i + 1}.${ext}`, { type: f.type }));
    });
    input.files = dt.files;
    setNote(pasted.length === 1 ? "Pasted image added to your attachments." : `${pasted.length} pasted images added to your attachments.`);
  }

  return { onPaste, note };
}
