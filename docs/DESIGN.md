# DirectDrop — Design

_Approved design from the brainstorming session. Newest decisions win._

## Goal

Send a single file directly from one browser to another over WebRTC, with a
shareable link, live progress, and no backend to run.

## Decisions (v1)

| Question | Decision |
| --- | --- |
| How do peers connect? | **Link/code rooms** (`?room=CODE`), like Road Clash |
| Direction / count | **One-way, 1 → 1** (creator sends, joiner receives) |
| Large files | **In-memory** reassembly on the receiver (~1 GB ceiling) |
| Files per transfer | **Single file** |
| Transport | **Trystero (nostr)** — reuses the Road Clash stack; native binary send + auto-chunking + progress |
| Framework | **None** — vanilla TS + Vite |

## Architecture (clean seams)

- **`room.ts`** — the connection seam. Room join, 6-char code, share URL,
  `?room=` parsing. Trystero handles signaling (public Nostr relays) + WebRTC.
- **`transfer.ts`** — the bytes. `makeSender` reads the file to an ArrayBuffer
  and sends it with metadata `{name, size, type}`; Trystero auto-chunks and
  reports progress. `makeReceiver` reassembles a Blob and reports meta/progress/done.
- **`ui.ts`** — the DOM. Picker (drag-drop), waiting (link + code), transfer
  (progress bar + %/speed/ETA), done, connecting, error. All untrusted strings
  are HTML-escaped.
- **`main.ts`** — orchestration. `?room` in the URL → receiver; otherwise sender.
- **`format.ts`** — pure bytes/speed/ETA helpers.

## Flow

**Sender:** pick file → create room → show link + code, "waiting…" → on peer
join, send with progress → "Sent ✓".

**Receiver:** open link → connect → first metadata renders the transfer screen →
progress → on complete, download the assembled Blob → "Saved ✓".

## Error handling

- Receiver can't reach a peer within 25 s → "link no longer active / couldn't
  connect" (covers stale links and strict-NAT-without-TURN).
- Peer leaves mid-transfer → "the other person disconnected."
- Huge-file guidance shown up front (in-memory limit).

## Non-goals (v2+)

TURN relay · multiple files · two-way · resume · stream-to-disk · accounts.

## Testing

Manual, two clients (tabs/devices): send a file, confirm it opens intact.
`format.ts` is pure and unit-testable. Full P2P can't be unit-tested (needs two
live clients).
