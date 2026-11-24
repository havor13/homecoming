"use client";

import { useEffect, useState } from "react";
import { sendTestPush, subscribePush, unsubscribePush } from "@/lib/actions/push";

type Mode = "checking" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyToBytes(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushToggle() {
  const [mode, setMode] = useState<Mode>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      if (!KEY) return setMode("unconfigured");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setMode("unsupported");
      }
      if (Notification.permission === "denied") return setMode("denied");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setMode(sub ? "on" : "off");
      } catch {
        setMode("unsupported");
      }
    })();
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMode(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(KEY) as unknown as BufferSource,
        }));
      const json = sub.toJSON();
      const result = await subscribePush({
        endpoint: json.endpoint ?? "",
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if ("error" in result) {
        setMessage(result.error ?? "Something went wrong.");
        return;
      }
      setMode("on");
      setMessage("Alerts are on for this device.");
    } catch {
      setMessage("Could not turn alerts on. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setMode("off");
      setMessage("Alerts are off for this device.");
    } catch {
      setMessage("Could not turn alerts off. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    await sendTestPush();
    setMessage("Test sent. It should arrive in a few seconds.");
    setBusy(false);
  }

  return (
    <section className="card" style={{ maxWidth: 560 }}>
      <h2>Alerts on this device</h2>
      <p className="muted">
        Get a pop-up when someone messages you, comments on your post or asks for mentoring. Alerts never include what
        a message says. This setting is for this phone or browser only.
      </p>
      {mode === "checking" && <p className="muted">Checking...</p>}
      {mode === "unconfigured" && <p className="muted">Alerts have not been set up for this site yet.</p>}
      {mode === "unsupported" && (
        <p className="muted">
          This browser can&apos;t show alerts. On iPhone, first add Homecoming to your Home Screen, then open it from there.
        </p>
      )}
      {mode === "denied" && (
        <p className="muted">
          Alerts are blocked for this site. Allow notifications for Homecoming in your phone or browser settings, then
          come back here.
        </p>
      )}
      {mode === "off" && (
        <button className="primary" onClick={turnOn} disabled={busy}>
          {busy ? "Turning on..." : "Turn on alerts"}
        </button>
      )}
      {mode === "on" && (
        <div className="row">
          <button onClick={test} disabled={busy}>Send a test</button>
          <button onClick={turnOff} disabled={busy}>Turn off</button>
        </div>
      )}
      <p role="status" style={{ minHeight: 24, color: "var(--accent-dark)", fontWeight: 600 }}>{message}</p>
    </section>
  );
}
