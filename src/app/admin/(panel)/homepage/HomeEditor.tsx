"use client";

import { useState } from "react";
import { discardHomeDraftAction, publishHomeAction, saveHomeDraftAction } from "@/app/admin/actions";
import { FormFields } from "@/components/admin/FormFields";
import { SortableList } from "@/components/admin/SortableList";
import { SaveBar, Tag, useToast, useUnsavedGuard } from "@/components/admin/ui";
import { SECTION_LABELS, SECTION_TYPES, type SectionType } from "@/lib/constants";
import { SECTION_FIELDS } from "@/lib/fields";
import type { Section } from "@/lib/validators";

const newId = () => Math.random().toString(36).slice(2, 10);
const summary = (s: Section) => String((s.config.heading ?? s.config.title ?? s.config.text ?? "") || "");

export function HomeEditor({ draft, published }: { draft: Section[]; published: Section[] }) {
  const [sections, setSections] = useState<Section[]>(draft);
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [live, setLive] = useState(JSON.stringify(published));
  const [add, setAdd] = useState<SectionType>("text");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const dirty = JSON.stringify(sections) !== saved;
  const unpublished = JSON.stringify(sections) !== live;
  useUnsavedGuard(dirty);

  async function saveDraft(): Promise<boolean> {
    setBusy(true);
    setError("");
    const r = await saveHomeDraftAction(sections);
    setBusy(false);
    if (!r.ok) { setError(r.error); toast(r.error, "e"); return false; }
    const s = (r.data as { sections: Section[] }).sections;
    setSections(s);
    setSaved(JSON.stringify(s));
    return true;
  }

  async function preview() {
    const w = window.open("", "_blank");
    if (await saveDraft()) { toast("Draft saved"); if (w) w.location.href = "/?preview=1"; } else w?.close();
  }

  async function publish() {
    setBusy(true);
    setError("");
    const r = await publishHomeAction(sections);
    setBusy(false);
    if (!r.ok) { setError(r.error); return toast(r.error, "e"); }
    const s = (r.data as { sections: Section[] }).sections;
    setSections(s);
    setSaved(JSON.stringify(s));
    setLive(JSON.stringify(s));
    toast("Published");
  }

  async function discard() {
    if (!window.confirm("Discard your draft and go back to the published homepage?")) return;
    const r = await discardHomeDraftAction();
    if (!r.ok) return toast(r.error, "e");
    const s = (r.data as { sections: Section[] }).sections;
    setSections(s);
    setSaved(JSON.stringify(s));
    toast("Draft discarded");
  }

  return (
    <>
      <div className="row between"><h1>Homepage</h1>{unpublished ? <Tag kind="warn">Unpublished changes</Tag> : <Tag kind="ok">Published</Tag>}</div>
      <p className="lead">Drag sections to reorder them, switch them on or off, and open one to edit its content. Visitors see changes after you publish.</p>
      <SortableList<Section>
        items={sections}
        onChange={setSections}
        empty="No sections yet. Add one below."
        title={(s) => (
          <>
            <b>{SECTION_LABELS[s.type]}</b> {!s.enabled ? <Tag>Hidden</Tag> : null} <span className="sec-tag" style={{ color: "var(--mut)" }}>{summary(s)}</span>
          </>
        )}
        headerExtra={(s, _i, update) => <label className="chk" style={{ fontWeight: 500 }}><input type="checkbox" checked={s.enabled} onChange={(e) => update({ enabled: e.target.checked })} />On</label>}
        body={(s, _i, update) => <FormFields fields={SECTION_FIELDS[s.type]} value={s.config} onChange={(config) => update({ config })} />}
      />
      <div className="row" style={{ marginTop: ".8rem" }}>
        <select value={add} onChange={(e) => setAdd(e.target.value as SectionType)} aria-label="Section type" style={{ width: "auto" }}>
          {SECTION_TYPES.map((t) => <option key={t} value={t}>{SECTION_LABELS[t]}</option>)}
        </select>
        <button type="button" className="b" onClick={() => setSections([...sections, { id: newId(), type: add, enabled: true, config: {} }])}>Add section</button>
      </div>
      <SaveBar message={error || undefined} error={!!error} dirty={dirty}>
        {unpublished ? <button type="button" className="b d" onClick={discard} disabled={busy}>Discard draft</button> : null}
        <button type="button" className="b" onClick={async () => (await saveDraft()) && toast("Draft saved")} disabled={busy || !dirty}>Save draft</button>
        <button type="button" className="b" onClick={preview} disabled={busy}>Preview</button>
        <button type="button" className="b p" onClick={publish} disabled={busy || !unpublished}>Publish</button>
      </SaveBar>
    </>
  );
}
