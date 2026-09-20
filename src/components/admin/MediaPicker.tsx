"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaItem = { id: string; file: string; url: string; original_name: string; alt: string; width: number; height: number; size: number };

export function MediaModal({ onPick, onClose }: { onPick: (url: string, alt: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ext, setExt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string) => {
    const r = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}`);
    if (r.ok) setItems((await r.json()).items);
    else setErr("Could not load the media library.");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(q), 200);
    return () => clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("file", f));
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) setErr(j.error ?? "Upload failed.");
    else {
      await load(q);
      if (j.items?.length === 1) onPick(j.items[0].url, j.items[0].alt ?? "");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Choose an image">
        <header>
          <b>Choose an image</b>
          <button type="button" className="b s" onClick={onClose}>Close</button>
        </header>
        <div>
          <div className="row" style={{ marginBottom: ".9rem" }}>
            <input type="search" placeholder="Search images" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: "16rem" }} aria-label="Search images" />
            <label className="b p" style={{ cursor: "pointer" }}>
              {busy ? "Uploading..." : "Upload"}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={(e) => upload(e.target.files)} />
            </label>
            <span className="row" style={{ marginLeft: "auto", gap: ".4rem" }}>
              <input type="url" placeholder="or paste https://... image address" value={ext} onChange={(e) => setExt(e.target.value)} style={{ width: "16rem" }} aria-label="Image address" />
              <button type="button" className="b" disabled={!/^https:\/\//i.test(ext)} onClick={() => onPick(ext, "")}>Use</button>
            </span>
          </div>
          {err ? <p className="notice bad">{err}</p> : null}
          {items === null ? <p>Loading...</p> : items.length === 0 ? <div className="empty-a">No images yet. Upload PNG, JPG, WebP or GIF files up to 8 MB.</div> : (
            <div className="media-grid">
              {items.map((m) => (
                <button type="button" key={m.id} className="media-tile" onClick={() => onPick(m.url, m.alt)} title={m.original_name}>
                  <img src={m.url} alt={m.alt} loading="lazy" />
                  <span>{m.original_name || m.file}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageField({ value, onChange, label = "image" }: { value: string; onChange: (url: string, alt?: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="img-field">
      {value ? <img className="thumb" src={value} alt="" /> : <span className="thumb" />}
      <button type="button" className="b s" onClick={() => setOpen(true)}>{value ? `Change ${label}` : `Choose ${label}`}</button>
      {value ? <button type="button" className="b s d" onClick={() => onChange("")}>Remove</button> : null}
      {open ? <MediaModal onClose={() => setOpen(false)} onPick={(u, a) => { onChange(u, a); setOpen(false); }} /> : null}
    </div>
  );
}
