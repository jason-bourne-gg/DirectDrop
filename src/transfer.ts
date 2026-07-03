import type { RoomHandle } from "./room";

// What travels alongside the bytes so the receiver knows what it's getting.
export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

type ProgressCb = (pct: number) => void;

// Trystero's makeAction returns a tuple [send, receive, receiveProgress]. Its
// generics don't narrow cleanly to "send an ArrayBuffer with file metadata",
// so we cast at this single boundary — the rest of the app stays typed. The
// send call auto-chunks the buffer and reports progress; we never touch chunks.

export function makeSender(room: RoomHandle) {
  const [sendFile] = room.makeAction("file") as unknown as [
    (data: ArrayBuffer, to: string, meta: FileMeta, onProgress: ProgressCb) => Promise<unknown>,
  ];
  return {
    async send(file: File, to: string, onProgress: ProgressCb): Promise<void> {
      const buf = await file.arrayBuffer();
      const meta: FileMeta = {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      };
      await sendFile(buf, to, meta, onProgress);
    },
  };
}

export interface ReceiverHandlers {
  onMeta: (meta: FileMeta) => void; // fires as soon as we learn what's coming
  onProgress: (pct: number) => void; // 0..1 as chunks arrive
  onDone: (blob: Blob, meta: FileMeta) => void; // full file assembled
}

export function makeReceiver(room: RoomHandle, h: ReceiverHandlers): void {
  const action = room.makeAction("file") as unknown as [
    unknown,
    (cb: (data: ArrayBuffer | Blob, peer: string, meta?: FileMeta) => void) => void,
    (cb: (pct: number, peer: string, meta?: FileMeta) => void) => void,
  ];
  const getFile = action[1];
  const onReceiveProgress = action[2];

  let announced = false;
  onReceiveProgress((pct, _peer, meta) => {
    if (meta && !announced) {
      announced = true;
      h.onMeta(meta);
    }
    h.onProgress(pct);
  });

  getFile((data, _peer, meta) => {
    const m: FileMeta =
      meta ?? { name: "download", size: data instanceof Blob ? data.size : 0, type: "application/octet-stream" };
    const blob = data instanceof Blob ? data : new Blob([data], { type: m.type || "application/octet-stream" });
    h.onDone(blob, m);
  });
}
