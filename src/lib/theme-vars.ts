// Client-safe: turns theme + branding values into CSS variables and a Google Fonts URL.
import type { CSSProperties } from "react";
import { FONTS, type ColorKey } from "./constants";

type ThemeLike = Record<ColorKey, string>;
type BrandingLike = { radius: number; fontHeading: string; fontBody: string };

const stack = (name: string) => FONTS.find((f) => f.name === name)?.stack ?? FONTS[0].stack;

export function buildThemeVars(t: ThemeLike, b: BrandingLike): CSSProperties {
  return {
    "--c-primary": t.primary,
    "--c-secondary": t.secondary,
    "--c-bg": t.background,
    "--c-card": t.card,
    "--c-text": t.text,
    "--c-muted": t.muted,
    "--c-border": t.border,
    "--c-btn": t.buttonBg,
    "--c-btn-text": t.buttonText,
    "--c-nav": t.navBg,
    "--c-footer": t.footerBg,
    "--radius": `${b.radius}px`,
    "--font-heading": stack(b.fontHeading),
    "--font-body": stack(b.fontBody),
  } as CSSProperties;
}

export function googleFontsHref(names: string[]): string | null {
  const fams = [...new Set(names)]
    .map((n) => FONTS.find((f) => f.name === n))
    .filter((f): f is (typeof FONTS)[number] => !!f && !!f.weights)
    .map((f) => `family=${f.name.replace(/ /g, "+")}:wght@${f.weights}`);
  return fams.length ? `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap` : null;
}
