import Link from "next/link";
import { startCall } from "@/lib/actions/calls";
import { livekitConfigured, participantCount } from "@/lib/livekit";

/** Sits above a chat: start a call, or join the one that is already running. */
export async function CallBanner({ threadId }: { threadId: string }) {
  // Hidden until LiveKit is set up, so nobody sees a button that cannot work.
  if (!livekitConfigured()) return null;

  const inCall = await participantCount(threadId);

  if (inCall > 0) {
    return (
      <div className="call-banner live" role="status">
        <span className="grow">
          <strong>Call in progress</strong> · {inCall} {inCall === 1 ? "person" : "people"} in it
        </span>
        <Link className="btn primary" href={`/call/${threadId}?mode=video`}>Join call</Link>
        <Link className="btn" href={`/call/${threadId}?mode=audio`}>Join voice only</Link>
      </div>
    );
  }

  return (
    <div className="call-banner">
      <span className="grow muted">Talk it over</span>
      <form action={startCall.bind(null, threadId, "video")}>
        <button>Video call</button>
      </form>
      <form action={startCall.bind(null, threadId, "audio")}>
        <button>Voice call</button>
      </form>
    </div>
  );
}
