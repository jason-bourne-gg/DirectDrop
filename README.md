# DirectDrop

Send a file **straight to another browser** — no upload, no server, no account.
Pick a file, get a link, share it; the file streams **peer-to-peer over WebRTC**
directly to whoever opens the link.

**Stack:** Vite · TypeScript · [Trystero](https://github.com/dmotz/trystero) (WebRTC over serverless Nostr signaling). No backend.

## How it works

1. **Sender** picks a file → the app creates a room and a shareable link (`?room=CODE`).
2. **Receiver** opens the link → the two browsers connect directly over WebRTC.
3. The file is sent as **auto-chunked binary** with live progress; the receiver
   reassembles it in memory and the browser downloads it.

There is **no server in the middle** — Trystero uses public Nostr relays only to
introduce the two peers (signaling); the file bytes travel directly between the
browsers and are DTLS-encrypted in transit by WebRTC.

```
src/
├── main.ts       # boot + ?room routing; wires UI ↔ transfer
├── room.ts       # Trystero room join + code/link helpers   (the connection seam)
├── transfer.ts   # sendFile() / receiveFile()               (the bytes)
├── ui.ts         # screens, drag-drop, progress bar          (the DOM)
├── format.ts     # bytes / speed / ETA helpers               (pure, testable)
└── style.css
```

## Develop

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle → dist/
npm run preview    # serve the production build
```

**Try a real transfer locally:** open the dev URL, pick a file, copy the link,
and paste it into a second browser window (or another device on your network).

## Deploy (Vercel)

It's a static site. Import the repo on Vercel once (framework preset auto-detects
Vite: build `npm run build`, output `dist`), and every push to `main` auto-deploys.
Cloudflare Pages works the same way.

## Scope (v1) & limits

**In:** one sender → one receiver, single file, link-based rooms, live progress,
in-memory receive.

**Known limits (deliberate v1 trade-offs):**
- **~1 GB practical ceiling** — the receiver assembles the file in memory.
  Streaming to disk (File System Access API) is the v2 upgrade for huge files.
- **No TURN relay** — a small share of strict/corporate networks can't establish
  a direct peer connection. Adding a TURN server is the fix.
- **Both peers must be online at once** — P2P has no store-and-forward.
- One file at a time; one-way. Multiple files / two-way are easy follow-ups.

## License

[MIT](LICENSE) © Aniket Ravindra Charjan
