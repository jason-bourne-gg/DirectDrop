import { joinRoom } from "trystero/nostr";

// The connection seam. Everything about "how two browsers find each other"
// lives here. Trystero handles signaling over public infrastructure (Nostr
// relays) + WebRTC, so there is no server of our own to run.
export type RoomHandle = ReturnType<typeof joinRoom>;

const APP_ID = "directdrop-p2p-v1";

// Ambiguity-free alphabet (no O/0, I/1) for shareable codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(len = 6): string {
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < len; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

export function shareUrl(code: string): string {
  const u = new URL(location.href);
  u.search = "?room=" + code;
  u.hash = "";
  return u.toString();
}

// A room code from the URL means "you're the receiver". Sanitised so a junk
// query string can't do anything unexpected.
export function roomFromUrl(): string | null {
  const raw = new URLSearchParams(location.search).get("room");
  if (!raw) return null;
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return clean || null;
}

export function connect(code: string): RoomHandle {
  return joinRoom({ appId: APP_ID }, code);
}
