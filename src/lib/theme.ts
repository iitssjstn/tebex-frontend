import type { CSSProperties } from "react";
import { getSetting } from "./settings";
import { buildThemeVars, googleFontsHref } from "./theme-vars";

export const themeStyle = (): CSSProperties => buildThemeVars(getSetting("theme"), getSetting("branding"));

/** Google Fonts stylesheet for the two chosen fonts (null when only system fonts are used). */
export function fontsHref(): string | null {
  const b = getSetting("branding");
  return googleFontsHref([b.fontHeading, b.fontBody]);
}
