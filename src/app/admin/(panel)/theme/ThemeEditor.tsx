"use client";

import { MiniPreview } from "@/components/admin/MiniPreview";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { THEME_PRESETS, type ColorKey, type PresetKey } from "@/lib/constants";
import { COLOR_FIELDS } from "@/lib/fields";

type Obj = Record<string, unknown>;

export function ThemeEditor({ initial, branding }: { initial: Obj; branding: Obj }) {
  return (
    <SettingsForm
      settingKey="theme"
      initial={initial}
      fields={COLOR_FIELDS}
      before={(v, set) => (
        <div className="f">
          <span className="lbl">Presets</span>
          <div className="row">
            {(Object.keys(THEME_PRESETS) as PresetKey[]).map((k) => {
              const { label, ...colors } = THEME_PRESETS[k];
              const p = THEME_PRESETS[k];
              return (
                <button type="button" key={k} className="b" aria-pressed={v.preset === k} onClick={() => set({ ...v, ...colors, preset: k })} style={v.preset === k ? { borderColor: "var(--a)", boxShadow: "0 0 0 2px var(--a-soft)" } : undefined}>
                  <span aria-hidden style={{ display: "inline-flex" }}>{[p.background, p.card, p.primary, p.secondary].map((c) => <i key={c} style={{ width: 12, height: 18, background: c, display: "block" }} />)}</span>
                  {label}
                </button>
              );
            })}
          </div>
          <small>Pick a preset, then adjust any colour below.</small>
        </div>
      )}
      preview={(v) => <MiniPreview theme={v as Record<ColorKey, string>} branding={branding as never} />}
    />
  );
}
