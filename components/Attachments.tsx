"use client";

import { useEffect, useRef, useState } from "react";
import { formatSize } from "@/lib/format";

type Item = { id: string; url: string; name: string; contentType: string; size: number };

const TEXT_TYPES = ["text/plain", "text/csv", "text/markdown", "application/json"];
const MAX_TEXT_BYTES = 100 * 1024;

function downloadUrl(url: string) {
  return url + (url.includes("?") ? "&" : "?") + "download=1";
}

function isImage(i: Item) {
  return i.contentType.startsWith("image/");
}
function isVideo(i: Item) {
  return i.contentType.startsWith("video/");
}
function isPdf(i: Item) {
  return i.contentType === "application/pdf";
}
function isAudio(i: Item) {
  return i.contentType.startsWith("audio/");
}
function isText(i: Item) {
  return TEXT_TYPES.includes(i.contentType) || i.contentType.startsWith("text/");
}

function TextPreview({ item }: { item: Item }) {
  const [state, setState] = useState<{ text?: string; error?: boolean; truncated?: boolean }>({});
  useEffect(() => {
    let cancelled = false;
    setState({});
    fetch(item.url)
      .then(async (r) => {
        if (!r.ok) throw new Error("bad");
        const text = await r.text();
        if (cancelled) return;
        const truncated = text.length > MAX_TEXT_BYTES;
        setState({ text: truncated ? text.slice(0, MAX_TEXT_BYTES) : text, truncated });
      })
      .catch(() => !cancelled && setState({ error: true }));
    return () => {
      cancelled = true;
    };
  }, [item.url]);

  if (state.error) return <p className="muted viewer-msg">Couldn&rsquo;t load a preview. Use Download instead.</p>;
  if (state.text === undefined) return <p className="muted viewer-msg">Loading&hellip;</p>;
  return (
    <>
      <pre className="viewer-text">{state.text}</pre>
      {state.truncated && <p className="muted viewer-msg">Preview shortened. Download for the full file.</p>}
    </>
  );
}

export function Attachments({ items }: { items: Item[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const images = items.filter(isImage);
  const videos = items.filter(isVideo);
  const files = items.filter((i) => !isImage(i) && !isVideo(i));

  // Items that can be opened in the viewer, in order, for next/previous.
  const viewable = [...images, ...files];
  const current = viewable.find((i) => i.id === openId) ?? null;
  const index = current ? viewable.findIndex((i) => i.id === current.id) : -1;

  function open(id: string) {
    setOpenId(id);
    requestAnimationFrame(() => {
      if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    });
  }
  function close() {
    dialogRef.current?.close();
    setOpenId(null);
  }
  function step(delta: number) {
    const n = viewable.length;
    if (n < 2 || index < 0) return;
    setOpenId(viewable[(index + delta + n) % n].id);
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {images.length > 0 && (
        <div className="gallery">
          {images.map((i) => (
            <button
              key={i.id}
              type="button"
              className="gallery-btn"
              onClick={() => open(i.id)}
              aria-label={`View ${i.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt={i.name} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {videos.map((v) => (
        <div key={v.id} className="stack" style={{ gap: 4 }}>
          <video controls preload="metadata" playsInline className="post-video" aria-label={v.name}>
            <source src={v.url} type={v.contentType} />
          </video>
          <a className="file-download" href={downloadUrl(v.url)} download={v.name}>
            Download video ({formatSize(v.size)})
          </a>
        </div>
      ))}

      {files.map((f) => (
        <div key={f.id} className="file-row">
          <button type="button" className="file grow" onClick={() => open(f.id)} aria-label={`View ${f.name}`}>
            <span className="grow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.name}
            </span>
            <span className="muted">{formatSize(f.size)}</span>
          </button>
          <a className="file-download" href={downloadUrl(f.url)} download={f.name} aria-label={`Download ${f.name}`}>
            Download
          </a>
        </div>
      ))}

      <dialog
        ref={dialogRef}
        className="viewer"
        aria-label={current ? current.name : "File viewer"}
        onClose={() => setOpenId(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {current && (
          <div className="viewer-inner">
            <div className="viewer-bar">
              <span className="viewer-title">
                {current.name} <span className="muted">· {formatSize(current.size)}</span>
              </span>
              <a className="btn-link" href={downloadUrl(current.url)} download={current.name}>
                Download
              </a>
              <button type="button" onClick={close} aria-label="Close viewer">
                Close
              </button>
            </div>

            <div className="viewer-body">
              {isImage(current) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.url} alt={current.name} className="viewer-img" />
              )}
              {isPdf(current) && <iframe src={current.url} title={current.name} className="viewer-frame" />}
              {isAudio(current) && <audio controls src={current.url} style={{ width: "100%" }} />}
              {isText(current) && <TextPreview item={current} />}
              {!isImage(current) && !isPdf(current) && !isAudio(current) && !isText(current) && (
                <p className="muted viewer-msg">
                  Preview isn&rsquo;t available for this type of file. Use Download to open it on your device.
                </p>
              )}
            </div>

            {viewable.length > 1 && (
              <div className="viewer-nav">
                <button type="button" onClick={() => step(-1)}>
                  Previous
                </button>
                <span className="muted">
                  {index + 1} of {viewable.length}
                </span>
                <button type="button" onClick={() => step(1)}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
