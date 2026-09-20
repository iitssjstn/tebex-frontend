"use client";

import { useRef, useState } from "react";
import { deleteMediaAction, setMediaAltAction } from "@/app/admin/actions";
import type { MediaItem } from "@/components/admin/MediaPicker";
import { Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/ui";

export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const up = useRef<HTMLInputElement>(null);
  const rep = useRef<HTMLInputElement>(null);

  async function reload(query = q) {
    const r = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}`);
    if (r.ok) setItems((await r.json()).items);
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) toast(j.error ?? "Upload failed.", "e"); else { toast("Uploaded"); await reload(); }
    if (up.current) up.current.value = "";
  }
  async function replace(files: FileList | null) {
    if (!files?.[0] || !sel) return;
    const fd = new FormData();
    fd.append("file", files[0]);
    const r = await fetch(`/api/admin/media?replace=${sel.id}`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) toast(j.error ?? "Replace failed.", "e"); else { toast("Replaced"); setSel(null); await reload(); location.reload(); }
    if (rep.current) rep.current.value = "";
  }

  return (
    <>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <input type="search" placeholder="Search images" value={q} onChange={(e) => { setQ(e.target.value); void reload(e.target.value); }} style={{ maxWidth: "16rem" }} aria-label="Search images" />
        <label className="b p" style={{ cursor: "pointer" }}>{busy ? "Uploading..." : "Upload images"}<input ref={up} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={(e) => upload(e.target.files)} /></label>
      </div>
      {items.length ? (
        <div className="media-grid">{items.map((m) => (
          <button key={m.id} type="button" className="media-tile" onClick={() => { setSel(m); setAlt(m.alt); }}><img src={m.url} alt={m.alt} loading="lazy" /><span>{m.original_name || m.file}</span></button>
        ))}</div>
      ) : <div className="empty-a">No images yet. Upload PNG, JPG, WebP or GIF files up to 8 MB.</div>}
      {sel ? (
        <Modal title={sel.original_name || sel.file} onClose={() => setSel(null)}>
          <img src={sel.url} alt={sel.alt} style={{ maxWidth: "100%", maxHeight: "16rem", marginBottom: "1rem" }} />
          <dl className="kv" style={{ marginBottom: "1rem" }}><dt>Address</dt><dd><code>{sel.url}</code></dd><dt>Size</dt><dd>{sel.width} x {sel.height}px, {(sel.size / 1024).toFixed(0)} KB</dd></dl>
          <div className="f"><label htmlFor="alt">Description (for screen readers)</label><input id="alt" type="text" value={alt} onChange={(e) => setAlt(e.target.value)} /></div>
          <div className="row between">
            <div className="row">
              <button className="b p" onClick={async () => { const r = await setMediaAltAction(sel.id, alt); if (r.ok) { toast("Saved"); setSel(null); await reload(); } else toast(r.error, "e"); }}>Save description</button>
              <button className="b" onClick={() => navigator.clipboard?.writeText(sel.url).then(() => toast("Address copied"))}>Copy address</button>
              <label className="b" style={{ cursor: "pointer" }}>Replace file<input ref={rep} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => replace(e.target.files)} /></label>
            </div>
            <button className="b d" onClick={async () => { if (!window.confirm("Delete this image? Places that use it will show a missing image.")) return; const r = await deleteMediaAction(sel.id); if (r.ok) { toast("Deleted"); setSel(null); await reload(); } else toast(r.error, "e"); }}>Delete</button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
