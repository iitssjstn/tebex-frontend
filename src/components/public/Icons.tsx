import type { ReactElement } from "react";

const P = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const, "aria-hidden": true };

export function CartIcon({ name }: { name: string }): ReactElement {
  if (name === "cart")
    return (
      <svg {...P}>
        <path d="M2 3h3l2.5 12h11L21 7H6" />
        <path d="M9 20h.01M17 20h.01" />
      </svg>
    );
  if (name === "crate")
    return (
      <svg {...P}>
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
        <path d="M3 7l9 4 9-4M12 11v10" />
      </svg>
    );
  return (
    <svg {...P}>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export const SOCIAL_SHORT: Record<string, string> = { discord: "DC", youtube: "YT", tiktok: "TT", instagram: "IG", x: "X", twitch: "TV", website: "WWW", link: "URL" };
