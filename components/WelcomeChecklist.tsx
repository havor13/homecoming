import Link from "next/link";
import { dismissWelcome } from "@/lib/actions/welcome";

export type WelcomeStep = { label: string; hint: string; href: string; done: boolean };

export function WelcomeChecklist({ steps }: { steps: WelcomeStep[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;

  return (
    <section className="card" aria-labelledby="welcome-title">
      <div className="row">
        <h2 id="welcome-title" className="grow">Welcome home! Get started</h2>
        <span className="chip">{done} of {steps.length} done</span>
      </div>
      <progress value={done} max={steps.length} aria-label="Getting started progress" style={{ width: "100%" }} />
      <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 8 }}>
        {steps.map((s) => (
          <li key={s.label} className="row" style={{ flexWrap: "nowrap" }}>
            <span aria-hidden="true">{s.done ? "✅" : "⬜"}</span>
            <div className="grow">
              {s.done ? (
                <span className="muted" style={{ textDecoration: "line-through" }}>{s.label}</span>
              ) : (
                <Link href={s.href}><strong>{s.label}</strong></Link>
              )}
              {!s.done && <div className="muted">{s.hint}</div>}
              {s.done && <span className="sr-only"> (done)</span>}
            </div>
          </li>
        ))}
      </ul>
      <form action={dismissWelcome}>
        <button className="link">Hide this checklist</button>
      </form>
    </section>
  );
}
