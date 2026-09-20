"use client";

import type { ColorKey } from "@/lib/constants";
import { buildThemeVars, googleFontsHref } from "@/lib/theme-vars";

type Props = {
  theme: Record<ColorKey, string>;
  branding: { storeName: string; logo: string; radius: number; fontHeading: string; fontBody: string; buttonStyle: string };
};

/** A small live sample of the storefront that reacts to the values being edited. */
export function MiniPreview({ theme, branding }: Props) {
  const fonts = googleFontsHref([branding.fontHeading, branding.fontBody]);
  return (
    <div className="preview-box" aria-label="Live preview">
      {fonts ? <link rel="stylesheet" href={fonts} /> : null}
      <div className="site" style={{ ...buildThemeVars(theme, branding), minHeight: 0 }} data-btn={branding.buttonStyle}>
        <div className="site-header" style={{ position: "static" }}>
          <div className="header-in" style={{ minHeight: "3.2rem", padding: "0 1rem", gap: ".8rem" }}>
            <span className="brand" style={{ fontSize: "1.05rem" }}>{branding.logo ? <img src={branding.logo} alt="" style={{ height: "1.8rem" }} /> : null}{branding.storeName}</span>
            <div className="nav" style={{ display: "flex", position: "static", padding: 0, border: 0, flexDirection: "row", background: "none", marginLeft: "auto" }}>
              <a aria-current="page" href="#preview" onClick={(e) => e.preventDefault()}>Store</a>
              <a href="#preview" onClick={(e) => e.preventDefault()}>FAQ</a>
            </div>
          </div>
        </div>
        <div style={{ padding: "1.2rem", background: "var(--c-bg)" }}>
          <h3 style={{ fontSize: "1.6rem" }}>{branding.storeName}</h3>
          <p style={{ color: "var(--c-muted)", margin: ".5rem 0 1rem" }}>Sample text in the body font. Prices, ranks and crates appear like this.</p>
          <div className="row" style={{ gap: ".6rem" }}>
            <button type="button" className="btn btn-sm">Add to cart</button>
            <button type="button" className="btn btn-ghost btn-sm">Details</button>
          </div>
          <div className="p-card" style={{ maxWidth: "14rem", marginTop: "1rem" }}>
            <div className="p-media" style={{ aspectRatio: "16/9" }}><span className="ph">A</span><span className="badge">Popular</span></div>
            <div className="p-body"><h3 style={{ fontSize: "1.05rem" }}>Sample product</h3><div className="price"><strong>&euro;9.99</strong></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
