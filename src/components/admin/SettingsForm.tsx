"use client";

import { useState, type ReactNode } from "react";
import { saveSettingAction } from "@/app/admin/actions";
import type { FieldDef } from "@/lib/fields";
import type { SettingKey } from "@/lib/validators";
import { FormFields } from "./FormFields";
import { SaveBar, useToast, useUnsavedGuard } from "./ui";

type Obj = Record<string, unknown>;

/** Generic editor for one settings record: the form is generated from the field definitions. */
export function SettingsForm({ settingKey, initial, fields, preview, before }: { settingKey: SettingKey; initial: Obj; fields: FieldDef[]; preview?: (v: Obj) => ReactNode; before?: (v: Obj, set: (v: Obj) => void) => ReactNode }) {
  const [value, setValue] = useState<Obj>(initial);
  const [saved, setSaved] = useState<string>(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const dirty = JSON.stringify(value) !== saved;
  useUnsavedGuard(dirty);

  async function save() {
    setBusy(true);
    setError("");
    const r = await saveSettingAction(settingKey, value);
    setBusy(false);
    if (r.ok) {
      setValue(r.data as Obj);
      setSaved(JSON.stringify(r.data));
      toast("Saved");
    } else {
      setError(r.error);
      toast(r.error, "e");
    }
  }

  const form = (
    <div className="card">
      {before ? before(value, setValue) : null}
      <FormFields fields={fields} value={value} onChange={setValue} />
    </div>
  );

  return (
    <>
      {preview ? (
        <div className="split">
          {form}
          <div>{preview(value)}</div>
        </div>
      ) : (
        form
      )}
      <SaveBar message={error || undefined} error={!!error} dirty={dirty}>
        <button type="button" className="b p" onClick={save} disabled={busy || !dirty}>{busy ? "Saving..." : "Save changes"}</button>
      </SaveBar>
    </>
  );
}
