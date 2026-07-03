import "./style.css";
import { connect, makeRoomCode, roomFromUrl, shareUrl } from "./room";
import { makeReceiver, makeSender, type FileMeta } from "./transfer";
import { formatBytes, formatEta, formatSpeed } from "./format";
import * as ui from "./ui";

// If we can't even reach the sender within this window, the link is stale or
// the network is blocking a direct connection (no TURN relay in v1).
const RECEIVE_TIMEOUT_MS = 25_000;

function goHome(): void {
  location.href = location.pathname;
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Turn a 0..1 fraction into "12.3 MB of 40 MB · 5.1 MB/s · 6s left".
function progressSub(pct: number, size: number, startedAt: number): string {
  const elapsed = (performance.now() - startedAt) / 1000;
  const done = pct * size;
  const speed = elapsed > 0.3 ? done / elapsed : 0;
  const eta = speed > 0 ? (size - done) / speed : Infinity;
  return `${formatBytes(done)} of ${formatBytes(size)} · ${speed ? formatSpeed(speed) : "…"} · ${formatEta(eta)} left`;
}

// --- Sender: pick a file, hand out a link, push it when someone joins. ---
function startSender(): void {
  ui.renderPicker((file) => {
    const code = makeRoomCode();
    ui.renderWaiting(file, shareUrl(code), code);

    const room = connect(code);
    const sender = makeSender(room);
    let sending = false;
    let finished = false;

    room.onPeerJoin(async (peerId) => {
      if (sending) return; // one receiver, one transfer
      sending = true;
      const bar = ui.renderTransfer("Sending…", file.name);
      const startedAt = performance.now();
      try {
        await sender.send(file, peerId, (pct) => bar.update(pct, progressSub(pct, file.size, startedAt)));
        finished = true;
        ui.renderDone("sent", file.name, goHome);
      } catch {
        ui.renderError("The transfer didn't finish — the other person may have closed their tab.", goHome);
      }
    });

    room.onPeerLeave(() => {
      if (sending && !finished) {
        ui.renderError("The other person disconnected before the transfer finished.", goHome);
      }
    });
  });
}

// --- Receiver: open a link, wait for the file, save it. ---
function startReceiver(code: string): void {
  ui.renderConnecting();

  const room = connect(code);
  let meta: FileMeta | null = null;
  let bar: ui.ProgressHandle | null = null;
  let startedAt = 0;
  let done = false;

  const timeout = window.setTimeout(() => {
    if (!meta && !done) {
      ui.renderError("This link is no longer active, or we couldn't connect. Ask the sender for a fresh link.", goHome);
    }
  }, RECEIVE_TIMEOUT_MS);

  makeReceiver(room, {
    onMeta: (m) => {
      window.clearTimeout(timeout);
      meta = m;
      startedAt = performance.now();
      bar = ui.renderTransfer("Receiving…", m.name);
    },
    onProgress: (pct) => {
      if (bar && meta) bar.update(pct, progressSub(pct, meta.size, startedAt));
    },
    onDone: (blob, m) => {
      done = true;
      window.clearTimeout(timeout);
      const name = m.name || meta?.name || "download";
      download(blob, name);
      ui.renderDone("saved", name, goHome);
    },
  });

  room.onPeerLeave(() => {
    if (!done) ui.renderError("The sender disconnected before the transfer finished.", goHome);
  });
}

// --- Boot: a room code in the URL means "you're receiving". ---
const incoming = roomFromUrl();
if (incoming) startReceiver(incoming);
else startSender();
