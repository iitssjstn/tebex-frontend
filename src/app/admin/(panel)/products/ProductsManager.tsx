"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDemoProductAction, saveDemoProductAction, saveProductOverrideAction, syncTebexAction } from "@/app/admin/actions";
import { ImageField } from "@/components/admin/MediaPicker";
import { Modal } from "@/components/admin/Modal";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Tag, useToast } from "@/components/admin/ui";
import { formatMoney } from "@/lib/utils";

export type ProductRow = {
  id: string; demoId: number | null; name: string; price: number; originalPrice: number | null; currency: string; categoryId: string; categoryName: string; image: string; description: string;
  featured: boolean; homepage: boolean; visible: boolean; badge: string; sortOrder: number; displayDescription: string;
};

const blank = (categoryId: string): ProductRow => ({ id: "", demoId: null, name: "", price: 4.99, originalPrice: null, currency: "", categoryId, categoryName: "", image: "", description: "", featured: false, homepage: false, visible: true, badge: "", sortOrder: 0, displayDescription: "" });

export function ProductsManager({ rows, source, error, categories }: { rows: ProductRow[]; source: "tebex" | "demo"; error?: string; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = source === "demo";
  const shown = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q));

  async function sync() {
    setBusy(true);
    const r = await syncTebexAction();
    setBusy(false);
    if (r.ok) {
      toast(r.data?.error ? `Could not reach Tebex: ${r.data.error}` : `Synced: ${r.data?.products} products in ${r.data?.categories} categories`, r.data?.error ? "e" : "ok");
      router.refresh();
    } else toast(r.error, "e");
  }

  return (
    <>
      <h1>Products</h1>
      <p className="lead">{demo ? "Tebex is not connected, so these are editable demo products." : "Names, prices and packages come from Tebex. Here you control how they are presented in the store."}</p>
      {demo ? <div className="notice warn">Demo mode. Connect Tebex under Integrations to sell real products. Demo products never reach Tebex.</div> : null}
      {error ? <div className="notice bad">Tebex could not be reached ({error}). Showing the last known products.</div> : null}
      <div className="row" style={{ marginBottom: "1rem" }}>
        <input type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: "18rem" }} aria-label="Search products" />
        {demo ? <button className="b p" onClick={() => setEditing(blank(categories[0]?.id ?? ""))} disabled={!categories.length}>Add demo product</button> : <button className="b" onClick={sync} disabled={busy}>{busy ? "Syncing..." : "Sync with Tebex"}</button>}
      </div>
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t">
          <thead><tr><th></th><th>Product</th><th>{demo ? "ID" : "Tebex package ID"}</th><th>Price</th><th>Category</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td>{r.image ? <img className="thumb" src={r.image} alt="" /> : <span className="thumb" style={{ display: "block" }} />}</td>
                <td><b>{r.name}</b>{r.badge ? <> <Tag kind="blue">{r.badge}</Tag></> : null}</td>
                <td>{r.id}</td>
                <td>{formatMoney(r.price, r.currency || "EUR")}{!demo ? <div><Tag>Managed by Tebex</Tag></div> : null}</td>
                <td>{r.categoryName}</td>
                <td>
                  {r.visible ? <Tag kind="ok">Visible</Tag> : <Tag kind="bad">Hidden</Tag>} {r.featured ? <Tag kind="warn">Featured</Tag> : null} {r.homepage ? <Tag kind="blue">Homepage</Tag> : null}
                </td>
                <td className="row end"><button className="b s" onClick={() => setEditing(r)}>Edit</button></td>
              </tr>
            ))}
            {!shown.length ? <tr><td colSpan={7}><div className="empty-a">{rows.length ? "No products match your search." : demo ? "No demo products yet." : "Tebex returned no products. Add packages in your Tebex panel, then press Sync."}</div></td></tr> : null}
          </tbody>
        </table>
      </div>
      {editing ? <Editor row={editing} demo={demo} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} /> : null}
    </>
  );
}

function Editor({ row, demo, categories, onClose, onSaved }: { row: ProductRow; demo: boolean; categories: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState(row);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const isNew = demo && !row.id;
  const set = <K extends keyof ProductRow>(k: K, val: ProductRow[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save() {
    setBusy(true);
    let id = row.id;
    if (demo) {
      const r = await saveDemoProductAction({
        id: row.demoId ?? undefined,
        categoryId: v.categoryId ? Number(v.categoryId.replace("demo-", "")) : null,
        name: v.name,
        description: v.description,
        price: v.price,
        originalPrice: v.originalPrice,
        imageUrl: v.image,
        sortOrder: v.sortOrder,
      });
      if (!r.ok) { setBusy(false); return toast(r.error, "e"); }
      id = `demo-${r.data!.id}`;
    }
    const r2 = await saveProductOverrideAction(id, { featured: v.featured, homepage: v.homepage, visible: v.visible, badge: v.badge, sortOrder: v.sortOrder, imageUrl: demo ? "" : v.image, displayDescription: demo ? "" : v.displayDescription });
    setBusy(false);
    if (!r2.ok) return toast(r2.error, "e");
    toast("Saved");
    onSaved();
  }

  async function remove() {
    if (!row.demoId || !window.confirm("Delete this demo product?")) return;
    const r = await deleteDemoProductAction(row.demoId);
    if (r.ok) { toast("Deleted"); onSaved(); } else toast(r.error, "e");
  }

  return (
    <Modal title={isNew ? "New demo product" : row.name} onClose={onClose} wide>
      <div className="grid2">
        <div>
          {demo ? (
            <>
              <div className="f"><label htmlFor="pn">Name</label><input id="pn" type="text" value={v.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="grid2">
                <div className="f"><label htmlFor="pp">Price</label><input id="pp" type="number" min={0} step="0.01" value={v.price} onChange={(e) => set("price", Number(e.target.value))} /></div>
                <div className="f"><label htmlFor="po">Original price</label><input id="po" type="number" min={0} step="0.01" value={v.originalPrice ?? ""} onChange={(e) => set("originalPrice", e.target.value === "" ? null : Number(e.target.value))} /><small>Shows a discount when higher than the price.</small></div>
              </div>
              <div className="f"><label htmlFor="pc">Category</label><select id="pc" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </>
          ) : (
            <dl className="kv" style={{ marginBottom: "1rem" }}>
              <dt>Name</dt><dd>{row.name} <Tag>Managed by Tebex</Tag></dd>
              <dt>Package ID</dt><dd>{row.id}</dd>
              <dt>Price</dt><dd>{formatMoney(row.price, row.currency)} <Tag>Managed by Tebex</Tag></dd>
              <dt>Category</dt><dd>{row.categoryName}</dd>
            </dl>
          )}
          <div className="f"><span className="lbl">Image{!demo ? " (overrides the Tebex image)" : ""}</span><ImageField value={v.image} onChange={(u) => set("image", u)} /></div>
          <div className="f"><label htmlFor="pb">Badge</label><input id="pb" type="text" value={v.badge} maxLength={24} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Popular" /></div>
          <div className="f"><label htmlFor="ps">Sort order</label><input id="ps" type="number" value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /><small>Lower numbers come first.</small></div>
          <label className="chk f"><input type="checkbox" checked={v.visible} onChange={(e) => set("visible", e.target.checked)} />Visible in the store</label>
          <label className="chk f"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} />Featured</label>
          <label className="chk f"><input type="checkbox" checked={v.homepage} onChange={(e) => set("homepage", e.target.checked)} />Show on the homepage</label>
        </div>
        <div>
          <div className="f"><span className="lbl">{demo ? "Description" : "Display description"}</span>
            <RichTextEditor value={demo ? v.description : v.displayDescription} onChange={(h) => (demo ? set("description", h) : set("displayDescription", h))} />
            {!demo ? <small>Leave empty to use the description from Tebex.</small> : null}
          </div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: ".5rem" }}>
        <div className="row">
          <button className="b p" onClick={save} disabled={busy || (demo && !v.name.trim())}>{busy ? "Saving..." : "Save"}</button>
          {row.id ? <a className="b" href={`/product/${row.id}`} target="_blank" rel="noopener">Preview</a> : null}
          {row.id ? <a className="b" href={`/store`} target="_blank" rel="noopener">View on store</a> : null}
        </div>
        {demo && row.demoId ? <button className="b d" onClick={remove}>Delete</button> : null}
      </div>
    </Modal>
  );
}
