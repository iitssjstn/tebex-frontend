import sanitizeHtml from "sanitize-html";

const TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "img", "span", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption", "details", "summary", "iframe"];

const options: sanitizeHtml.IOptions = {
  allowedTags: TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "allowfullscreen", "title", "loading"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"], iframe: ["https"] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return { tagName, attribs: { ...attribs, ...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {}) } };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
};

/** Sanitises rich text and custom content. Scripts, inline styles, event handlers and unsafe URLs are removed. */
export function cleanHtml(html: string): string {
  return sanitizeHtml(html ?? "", options);
}

/** Strips every tag; used for values that must stay plain text. */
export function plainText(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}
