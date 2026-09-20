"use client";

import { useId } from "react";
import type { FieldDef } from "@/lib/fields";
import { Field } from "./ui";
import { ImageField } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";
import { SortableList } from "./SortableList";

type Obj = Record<string, unknown>;

export function FormFields({ fields, value, onChange }: { fields: FieldDef[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
    <>
      {fields.map((f) => (
        <FieldInput key={f.name} field={f} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />
      ))}
    </>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId();
  switch (field.type) {
    case "checkbox":
      return (
        <div className="f">
          <label className="chk"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{field.label}</label>
          {field.help ? <small>{field.help}</small> : null}
        </div>
      );
    case "textarea":
      return (
        <Field label={field.label} help={field.help} id={id}>
          <textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
        </Field>
      );
    case "select":
      return (
        <Field label={field.label} help={field.help} id={id}>
          <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      );
    case "number":
      return (
        <Field label={field.label} help={field.help} id={id}>
          <input id={id} type="number" min={field.min} max={field.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
      );
    case "color": {
      const v = String(value ?? "");
      return (
        <Field label={field.label} help={field.help} id={id}>
          <div className="color">
            <input type="color" aria-label={`${field.label} picker`} value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"} onChange={(e) => onChange(e.target.value)} />
            <input id={id} type="text" value={v} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB" maxLength={7} />
            {v ? <button type="button" className="b s" onClick={() => onChange("")}>Clear</button> : null}
          </div>
        </Field>
      );
    }
    case "image":
      return (
        <Field label={field.label} help={field.help}>
          <ImageField value={String(value ?? "")} onChange={(u) => onChange(u)} />
        </Field>
      );
    case "richtext":
      return (
        <Field label={field.label} help={field.help} id={id}>
          <RichTextEditor id={id} value={String(value ?? "")} onChange={onChange} />
        </Field>
      );
    case "list":
      return (
        <div className="f">
          <span className="lbl">{field.label}</span>
          <ListField field={field} value={(value as Obj[]) ?? []} onChange={onChange} />
        </div>
      );
    default:
      return (
        <Field label={field.label} help={field.help} id={id}>
          <input id={id} type={field.type === "url" ? "text" : "text"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
        </Field>
      );
  }
}

function ListField({ field, value, onChange }: { field: FieldDef; value: Obj[]; onChange: (v: unknown) => void }) {
  const sub = field.fields ?? [];
  const titleKey = field.itemTitle ?? sub[0]?.name;
  return (
    <div>
      <SortableList<Obj>
        items={value}
        onChange={onChange}
        title={(it, i) => String(it[titleKey ?? ""] || `Item ${i + 1}`)}
        headerExtra={(it, _i, update) => (sub.some((s) => s.name === "enabled") ? <label className="chk" style={{ fontWeight: 500 }}><input type="checkbox" checked={it.enabled !== false} onChange={(e) => update({ enabled: e.target.checked })} />On</label> : null)}
        body={(it, _i, update) => <FormFields fields={sub.filter((s) => s.name !== "enabled")} value={it} onChange={(v) => update(v)} />}
        empty="Nothing here yet."
      />
      <button type="button" className="b s" onClick={() => onChange([...value, JSON.parse(JSON.stringify(field.newItem ?? {}))])}>{field.addLabel ?? "Add item"}</button>
    </div>
  );
}
