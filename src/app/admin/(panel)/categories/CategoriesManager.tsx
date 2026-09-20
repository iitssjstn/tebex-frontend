"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDemoCategoryAction, saveCategoryOverrideAction, saveDemoCategoryAction, syncTebexAction } from "@/app/admin/actions";
import { ImageField } from "@/components/admin/MediaPicker";
import { Modal } from "@/components/admin/Modal";
import { Tag, useToast } from "@/components/admin/ui";

type Row = { id: string; demoId: number | null; name: string; slug: string; description: string; image: string; visible: boolean; sortOrder: number; count: number };

export function CategoriesManager({ rows, source, error }: { rows: Row[]; source: "tebex" | "demo"; error?: string }) {
  const router = useRouter();
  const toast = useToast();
  const demo = source === "demo";
  const [edit, setEdit] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    const r = await syncTebexAction();
    setBusy(false);
    if (r.ok) { toast(`Synced ${r.data?.categories} categories`); router.refresh(); } else toast(r.error, "e");
  }

  return (
    <>
      <h1>Categories</h1>
      <p className="lead">{demo ? "Demo categories. Connect Tebex to use your real categories." : "Categories come from Tebex. Here you choose how they look in the store: visibility, order, image and description."}</p>
      {error ? <div className="notice bad">Tebex could not be reached ({error}). Showing the last known categories.</div> : null}
      <div className="row" style={{ marginBottom: "1rem" }}>
        {demo ? <button className="b p" onClick={() => setEdit({ id: "", demoId: null, name: "", slug: "", description: "", image: "", visible: true, sortOrder: rows.length, count: 0 })}>Add demo category</button> : <button className="b" onClick={sync} disabled={busy}>{busy ? "Syncing..." : "Sync with Tebex"}</button>}
      </div>
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t">
          <thead><tr><th></th><th>Category</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.image ? <img className="thumb" src={r.image} alt="" /> : <span className="thumb" style={{ display: "block" }} />}</td>
                <td><b>{r.name}</b>{!demo ? <div><Tag>Managed by Tebex</Tag></div> : null}</td>
                <td>{r.count}</td>
                <td>{r.sortOrder}</td>
                <td>{r.visible ? <Tag kind="ok">Visible</Tag> : <Tag kind="bad">Hidden</Tag>}</td>
                <td className="row end"><button className="b s" onClick={() => setEdit(r)}>Edit</button></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={6}><div className="empty-a">No categories yet.</div></td></tr> : null}
          </tbody>
        </table>
      </div>
      {edit ? <Editor row={edit} demo={demo} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} /> : null}
    </>
  );
}

function Editor({ row, demo, onClose, onSaved }: { row: Row; demo: boolean; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState(row);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function save() {
    setBusy(true);
    let id = row.id;
    if (demo) {
      const r = await saveDemoCategoryAction({ id: row.demoId ?? undefined, name: v.name, description: v.description, sortOrder: v.sortOrder });
      if (!r.ok) { setBusy(false); return toast(r.error, "e"); }
      id = `demo-${r.data!.id}`;
    }
    const r2 = await saveCategoryOverrideAction(id, { visible: v.visible, sortOrder: v.sortOrder, imageUrl: v.image, displayDescription: demo ? "" : v.description });
    setBusy(false);
    if (!r2.ok) return toast(r2.error, "e");
    toast("Saved");
    onSaved();
  }
  async function remove() {
    if (!row.demoId || !window.confirm("Delete this category? Its demo products become uncategorised.")) return;
    const r = await deleteDemoCategoryAction(row.demoId);
    if (r.ok) { toast("Deleted"); onSaved(); } else toast(r.error, "e");
  }

  return (
    <Modal title={row.id ? row.name : "New demo category"} onClose={onClose}>
      {demo ? <div className="f"><label htmlFor="cn">Name</label><input id="cn" type="text" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div> : <p><b>{row.name}</b> <Tag>Managed by Tebex</Tag></p>}
      <div className="f"><label htmlFor="cd">Description</label><textarea id="cd" value={v.description} maxLength={2000} onChange={(e) => setV({ ...v, description: e.target.value })} />{!demo ? <small>Replaces the Tebex description in the store. Leave empty to keep it.</small> : null}</div>
      <div className="f"><span className="lbl">Image</span><ImageField value={v.image} onChange={(u) => setV({ ...v, image: u })} /></div>
      <div className="f"><label htmlFor="co">Sort order</label><input id="co" type="number" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })} /></div>
      <label className="chk f"><input type="checkbox" checked={v.visible} onChange={(e) => setV({ ...v, visible: e.target.checked })} />Visible in the store</label>
      <div className="row between">
        <button className="b p" onClick={save} disabled={busy || (demo && !v.name.trim())}>{busy ? "Saving..." : "Save"}</button>
        {demo && row.demoId ? <button className="b d" onClick={remove}>Delete</button> : null}
      </div>
    </Modal>
  );
}
