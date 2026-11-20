import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

export function livekitConfigured() {
  return Boolean(url && apiKey && apiSecret);
}

export function livekitUrl() {
  return url ?? "";
}

/** Every chat (direct, group or circle) has one call room, named after its thread. */
export function roomFor(threadId: string) {
  return `thread-${threadId}`;
}

/** A short-lived pass that lets one signed-in person join one room. */
export async function createCallToken(threadId: string, identity: string, name: string) {
  const token = new AccessToken(apiKey!, apiSecret!, { identity, name, ttl: "2h" });
  token.addGrant({
    roomJoin: true,
    room: roomFor(threadId),
    canPublish: true,
    canSubscribe: true,
  });
  return token.toJwt();
}

/** How many people are in the call right now. Zero if nobody is, or if LiveKit cannot be reached. */
export async function participantCount(threadId: string) {
  if (!livekitConfigured()) return 0;
  try {
    const httpUrl = url!.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const client = new RoomServiceClient(httpUrl, apiKey!, apiSecret!);
    const participants = await client.listParticipants(roomFor(threadId));
    return participants.length;
  } catch {
    // A room that does not exist yet also lands here, which simply means "no call".
    return 0;
  }
}
