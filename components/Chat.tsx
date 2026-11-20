import { Attachments } from "./Attachments";
import { AutoRefresh } from "./AutoRefresh";
import { CallBanner } from "./CallBanner";
import { ChatForm } from "./ChatForm";
import { ChatLog } from "./ChatLog";
import { ReactionBar } from "./ReactionBar";
import { timeAgo } from "@/lib/format";
import { summarize } from "@/lib/reactions";
import type { MessageWithMeta } from "@/lib/queries";

export function Chat({
  threadId,
  messages,
  viewerId,
  showNames,
}: {
  threadId: string;
  messages: MessageWithMeta[];
  viewerId: string;
  showNames: boolean;
}) {
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AutoRefresh seconds={5} />
      <CallBanner threadId={threadId} />
      <ChatLog count={messages.length}>
        {messages.length === 0 && <p className="muted">No messages yet. Say hello.</p>}
        {messages.map((m) => {
          const mine = m.senderId === viewerId;

          if (m.kind === "CALL") {
            const who = mine ? "You" : m.sender.name;
            const what = m.body.charAt(0).toLowerCase() + m.body.slice(1);
            return (
              <div key={m.id} className="call-note">
                <span aria-hidden="true">📞</span> {who} {what} · {timeAgo(m.createdAt)}
              </div>
            );
          }

          return (
            <div key={m.id} className={`msg${mine ? " mine" : ""}`}>
              {!mine && showNames && <span className="muted">{m.sender.name}</span>}
              <div className={`bubble${mine ? " me" : ""}`}>
                {m.body && <span style={{ whiteSpace: "pre-wrap" }}>{m.body}</span>}
                <Attachments items={m.attachments} />
              </div>
              <ReactionBar target="message" id={m.id} summary={summarize(m.reactions, viewerId)} />
              <span className="muted" style={{ fontSize: 12 }}>{timeAgo(m.createdAt)}</span>
            </div>
          );
        })}
      </ChatLog>
      <ChatForm threadId={threadId} />
    </div>
  );
}
