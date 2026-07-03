import { formatBytes } from "./format";

// All DOM lives here. Screens are rendered into #app; logic (main.ts) drives
// them through callbacks and the returned progress handle.

const app = (): HTMLElement => document.getElementById("app")!;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

const shell = (inner: string): string => `
  <main class="card">
    <h1 class="logo">Direct<span>Drop</span></h1>
    ${inner}
  </main>`;

export function renderPicker(onFile: (f: File) => void): void {
  app().innerHTML = shell(`
    <p class="tag">Send a file straight to another browser. No upload, no server — it goes peer&#8209;to&#8209;peer.</p>
    <label class="drop" id="drop">
      <input type="file" id="file" hidden />
      <div class="drop__icon">↑</div>
      <div class="drop__title">Choose a file or drop it here</div>
      <div class="drop__hint">Nothing is uploaded to a server — it streams directly to the other person.</div>
    </label>
    <p class="fineprint">Best for files up to ~1&nbsp;GB. Keep both tabs open during the transfer.</p>`);

  const input = document.getElementById("file") as HTMLInputElement;
  const drop = document.getElementById("drop") as HTMLElement;

  input.addEventListener("change", () => {
    if (input.files && input.files[0]) onFile(input.files[0]);
  });
  (["dragover", "dragenter"] as const).forEach((e) =>
    drop.addEventListener(e, (ev) => {
      ev.preventDefault();
      drop.classList.add("drop--over");
    }),
  );
  (["dragleave", "drop"] as const).forEach((e) =>
    drop.addEventListener(e, (ev) => {
      ev.preventDefault();
      drop.classList.remove("drop--over");
    }),
  );
  drop.addEventListener("drop", (ev) => {
    const f = (ev as DragEvent).dataTransfer?.files?.[0];
    if (f) onFile(f);
  });
}

export function renderWaiting(file: File, url: string, code: string): void {
  app().innerHTML = shell(`
    <div class="file"><span class="file__name">${esc(file.name)}</span><span class="file__size">${formatBytes(file.size)}</span></div>
    <p class="tag">Share this link with the person you're sending to:</p>
    <div class="linkrow">
      <input class="link" id="link" readonly value="${esc(url)}" />
      <button class="btn" id="copy">Copy</button>
    </div>
    <p class="code">or give them the code <strong>${esc(code)}</strong></p>
    <div class="status"><span class="spinner"></span> Waiting for them to open the link…</div>`);

  const copy = document.getElementById("copy") as HTMLButtonElement;
  const link = document.getElementById("link") as HTMLInputElement;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      link.select();
    }
    copy.textContent = "Copied!";
    setTimeout(() => (copy.textContent = "Copy"), 1500);
  });
}

export interface ProgressHandle {
  update(pct: number, sub: string): void;
}

export function renderTransfer(title: string, name: string): ProgressHandle {
  app().innerHTML = shell(`
    <div class="file"><span class="file__name">${esc(name)}</span></div>
    <p class="tag">${esc(title)}</p>
    <div class="bar"><div class="bar__fill" id="fill"></div></div>
    <div class="prog"><span id="pct">0%</span><span id="sub" class="prog__sub"></span></div>`);

  const fill = document.getElementById("fill") as HTMLElement;
  const pctEl = document.getElementById("pct") as HTMLElement;
  const subEl = document.getElementById("sub") as HTMLElement;
  return {
    update(pct, sub) {
      const p = Math.max(0, Math.min(100, Math.round(pct * 100)));
      fill.style.width = p + "%";
      pctEl.textContent = p + "%";
      subEl.textContent = sub;
    },
  };
}

export function renderDone(kind: "sent" | "saved", name: string, again: () => void): void {
  app().innerHTML = shell(`
    <div class="done">${kind === "sent" ? "Sent" : "Saved"} <span class="done__check">✓</span></div>
    <div class="file"><span class="file__name">${esc(name)}</span></div>
    <button class="btn btn--primary" id="again">Send another file</button>`);
  document.getElementById("again")!.addEventListener("click", again);
}

export function renderConnecting(): void {
  app().innerHTML = shell(`<div class="status"><span class="spinner"></span> Connecting to the sender…</div>`);
}

export function renderError(msg: string, onHome: () => void): void {
  app().innerHTML = shell(`
    <div class="error">${esc(msg)}</div>
    <button class="btn btn--primary" id="home">Start over</button>`);
  document.getElementById("home")!.addEventListener("click", onHome);
}
