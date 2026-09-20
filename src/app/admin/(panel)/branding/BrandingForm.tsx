"use client";

import { MiniPreview } from "@/components/admin/MiniPreview";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { BRANDING_FIELDS } from "@/lib/fields";
import type { ColorKey } from "@/lib/constants";

type Branding = { storeName: string; logo: string; radius: number; fontHeading: string; fontBody: string; buttonStyle: string };

export function BrandingForm({ initial, theme }: { initial: Record<string, unknown>; theme: Record<string, unknown> }) {
  return (
    <SettingsForm
      settingKey="branding"
      initial={initial}
      fields={BRANDING_FIELDS}
      preview={(v) => <MiniPreview theme={theme as unknown as Record<ColorKey, string>} branding={v as unknown as Branding} />}
    />
  );
}
