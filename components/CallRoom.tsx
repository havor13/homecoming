"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useRouter } from "next/navigation";

export function CallRoom({
  token,
  serverUrl,
  withVideo,
  backHref,
}: {
  token: string;
  serverUrl: string;
  withVideo: boolean;
  backHref: string;
}) {
  const router = useRouter();

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={withVideo}
      data-lk-theme="default"
      onDisconnected={() => router.push(backHref)}
      style={{ height: "calc(100vh - 140px)", minHeight: 420, borderRadius: 16, overflow: "hidden" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
