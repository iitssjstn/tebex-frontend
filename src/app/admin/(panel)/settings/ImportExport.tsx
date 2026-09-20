"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/admin/ui";

export function ImportExport() {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function run(file: File) {
    if (!window.confirm("Import this store export? Settings, pages, presentation options and images from the file replace or merge with the current ones. Admin users and Tebex keys are not touched.")) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/import", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (r.ok) { toast(`Imported ${j.imported.settings} settings, ${j.imported.pages} pages, ${j.imported.media} images`); setTimeout(() => location.reload(), 800); } else toast(j.error ?? "Import failed.", "e");
    if (ref.current) ref.current.value = "";
  }
  return (
    <div className="card" style={{ marginTop: "1.5rem" }}>
      <h2>Export and import</h2>
      <p className="lead" style={{ marginBottom: "1rem" }}>Move your look and content to another server. Admin users, sessions and Tebex keys are never included.</p>
      <div className="row">
        <a className="b" href="/api/admin/export">Export store</a>
        <label className="b" style={{ cursor: "pointer" }}>{busy ? "Importing..." : "Import store"}<input ref={ref} type="file" accept=".zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} /></label>
      </div>
    </div>
  );
}
