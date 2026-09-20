"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePageAction, savePageAction, unpublishPageAction } from "@/app/admin/actions";
import { FormFields } from "@/components/admin/FormFields";
import { SortableList } from "@/components/admin/SortableList";
import { SaveBar, Tag, useToast, useUnsavedGuard } from "@/components/admin/ui";
import { BLOCK_LABELS, BLOCK_TYPES, type BlockType } from "@/lib/constants";
import { BLOCK_FIELDS } from "@/lib/fields";
import type { PageContent } from "@/lib/validators";

type Block = PageContent["blocks"][number];
const newId = () => Math.random().toString(36).slice(2, 10);
const pathFor = (slug: string) => (["terms", "privacy", "refunds"].includes(slug) ? `/${slug}` : `/pages/${slug}`);
const preview = (b: Block) => String(b.props.text ?? b.props.alt ?? b.props.caption ?? "").slice(0, 60) || String(b.props.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 60);

export function PageEditor({ page }: { page: { id: number; slug: string; status: "draft" | "published"; hasUnpublished: boolean; content: PageContent } }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(page.content.title);
  const [slug, setSlug] = useState(page.slug);
  const [blocks, setBlocks] = useState<Block[]>(page.content.blocks);
  const [seoTitle, setSeoTitle] = useState(page.content.seoTitle);
  const [seoDescription, setSeoDescription] = useState(page.content.seoDescription);
  const [add, setAdd] = useState<BlockType>("text");
  const [status, setStatus] = useState(page.status);
  const [pending, setPending] = useState(page.hasUnpublished);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const snapshot = JSON.stringify({ title, slug, blocks, seoTitle, seoDescription });
  const [saved, setSaved] = useState(snapshot);
  const dirty = snapshot !== saved;
  useUnsavedGuard(dirty);

  async function save(publish: boolean): Promise<boolean> {
    setBusy(true);
    setError("");
    const r = await savePageAction(page.id, slug, { title, blocks, seoTitle, seoDescription }, publish);
    setBusy(false);
    if (!r.ok) { setError(r.error); toast(r.error, "e"); return false; }
    setSlug(r.data!.slug);
    setSaved(JSON.stringify({ title, slug: r.data!.slug, blocks, seoTitle, seoDescription }));
    if (publish) { setStatus("published"); setPending(false); } else if (status === "published") setPending(true);
    return true;
  }

  async function previewPage() {
    const w = window.open("", "_blank");
    if (await save(false)) { if (w) w.location.href = `${pathFor(slug)}?preview=1`; } else w?.close();
  }

  return (
    <>
      <div className="row between"><h1>{title || "Untitled page"}</h1>{status === "published" ? (pending ? <Tag kind="warn">Published, changes pending</Tag> : <Tag kind="ok">Published</Tag>) : <Tag>Draft</Tag>}</div>
      <div className="card">
        <div className="grid2">
          <div className="f"><label htmlFor="pt">Title</label><input id="pt" type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="f"><label htmlFor="ps">Address</label><input id="ps" type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} /><small>Visitors open {pathFor(slug || "...")}</small></div>
        </div>
      </div>

      <h2>Content</h2>
      <SortableList<Block>
        items={blocks}
        onChange={setBlocks}
        empty="This page is empty. Add a heading or some text below."
        title={(b) => (<><b>{BLOCK_LABELS[b.type]}</b> <span className="sec-tag" style={{ color: "var(--mut)" }}>{preview(b)}</span></>)}
        body={(b, _i, update) => (BLOCK_FIELDS[b.type].length ? <FormFields fields={BLOCK_FIELDS[b.type]} value={b.props} onChange={(props) => update({ props })} /> : <p className="lead" style={{ margin: 0 }}>Nothing to edit.</p>)}
      />
      <div className="row" style={{ margin: ".8rem 0 1.4rem" }}>
        <select value={add} onChange={(e) => setAdd(e.target.value as BlockType)} aria-label="Block type" style={{ width: "auto" }}>{BLOCK_TYPES.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}</select>
        <button type="button" className="b" onClick={() => setBlocks([...blocks, { id: newId(), type: add, props: {} }])}>Add block</button>
      </div>

      <div className="card">
        <h2>Search engines</h2>
        <div className="f"><label htmlFor="st">SEO title</label><input id="st" type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title} /></div>
        <div className="f"><label htmlFor="sd">SEO description</label><textarea id="sd" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></div>
      </div>

      <SaveBar message={error || undefined} error={!!error} dirty={dirty}>
        <button type="button" className="b d" disabled={busy} onClick={async () => { if (!window.confirm("Delete this page? This cannot be undone.")) return; const r = await deletePageAction(page.id); if (r.ok) router.push("/admin/pages"); else toast(r.error, "e"); }}>Delete</button>
        {status === "published" ? <button type="button" className="b" disabled={busy} onClick={async () => { const r = await unpublishPageAction(page.id); if (r.ok) { setStatus("draft"); toast("Unpublished"); } else toast(r.error, "e"); }}>Unpublish</button> : null}
        <button type="button" className="b" disabled={busy} onClick={previewPage}>Preview</button>
        <button type="button" className="b" disabled={busy || !dirty} onClick={async () => (await save(false)) && toast("Draft saved")}>Save draft</button>
        <button type="button" className="b p" disabled={busy || (status === "published" && !pending && !dirty)} onClick={async () => (await save(true)) && toast("Published")}>Publish</button>
      </SaveBar>
    </>
  );
}
