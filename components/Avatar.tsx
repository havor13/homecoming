import { initials } from "@/lib/format";

export function Avatar({ name, url, size = 44 }: { name: string; url?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="avatar" style={style} loading="lazy" />;
  }
  return (
    <div className="avatar" style={style} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
