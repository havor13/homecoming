import { formatSize } from "@/lib/format";

type Item = { id: string; url: string; name: string; contentType: string; size: number };

export function Attachments({ items }: { items: Item[] }) {
  if (items.length === 0) return null;
  const images = items.filter((i) => i.contentType.startsWith("image/"));
  const videos = items.filter((i) => i.contentType.startsWith("video/"));
  const files = items.filter((i) => !i.contentType.startsWith("image/") && !i.contentType.startsWith("video/"));

  return (
    <div className="stack" style={{ gap: 8 }}>
      {images.length > 0 && (
        <div className="gallery">
          {images.map((i) => (
            <a key={i.id} href={i.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt={i.name} loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {videos.map((v) => (
        <video key={v.id} controls preload="metadata" playsInline className="post-video" aria-label={v.name}>
          <source src={v.url} type={v.contentType} />
          <a href={v.url}>Download {v.name}</a>
        </video>
      ))}
      {files.map((f) => (
        <a key={f.id} className="file" href={f.url} target="_blank" rel="noopener noreferrer">
          <span className="grow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <span className="muted">{formatSize(f.size)}</span>
        </a>
      ))}
    </div>
  );
}
