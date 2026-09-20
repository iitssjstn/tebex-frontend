import { db } from "./db";
import { RESERVED_SLUGS } from "./constants";
import { slugify } from "./utils";
import { PageContentSchema, type PageContent } from "./validators";

type Row = { id: number; slug: string; title: string; draft: string; published: string | null; status: "draft" | "published"; created_at: string; updated_at: string };
export type Page = { id: number; slug: string; title: string; draft: PageContent; published: PageContent | null; status: "draft" | "published"; updatedAt: string; hasUnpublished: boolean };

const parse = (raw: string | null): PageContent | null => {
  if (!raw) return null;
  try {
    return PageContentSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};

function toPage(r: Row): Page {
  const draft = parse(r.draft) ?? PageContentSchema.parse({ title: r.title });
  const published = parse(r.published);
  return { id: r.id, slug: r.slug, title: r.title, draft, published, status: r.status, updatedAt: r.updated_at, hasUnpublished: !!published && JSON.stringify(published) !== JSON.stringify(draft) };
}

export const listPages = (): Page[] => (db().prepare("SELECT * FROM pages ORDER BY title COLLATE NOCASE").all() as Row[]).map(toPage);
export const getPageById = (id: number): Page | null => {
  const r = db().prepare("SELECT * FROM pages WHERE id = ?").get(id) as Row | undefined;
  return r ? toPage(r) : null;
};
export const getPageBySlug = (slug: string): Page | null => {
  const r = db().prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as Row | undefined;
  return r ? toPage(r) : null;
};

export function checkSlug(slug: string, exceptId?: number): string | null {
  if (!slug) return "Enter a URL slug.";
  if (slug !== slugify(slug)) return "Use lowercase letters, numbers and dashes only.";
  if (RESERVED_SLUGS.includes(slug)) return "That address is used by the store itself. Pick another.";
  const taken = db().prepare("SELECT id FROM pages WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (taken && taken.id !== exceptId) return "Another page already uses that address.";
  return null;
}

export function createPage(title: string, slugInput?: string, blocks: PageContent["blocks"] = []): Page {
  const t = title.trim() || "Untitled page";
  let slug = slugify(slugInput || t) || "page";
  const base = slug;
  for (let i = 2; checkSlug(slug); i++) slug = `${base}-${i}`;
  const content = PageContentSchema.parse({ title: t, blocks });
  const r = db().prepare("INSERT INTO pages (slug, title, draft) VALUES (?, ?, ?)").run(slug, t, JSON.stringify(content));
  return getPageById(Number(r.lastInsertRowid))!;
}

export function saveDraft(id: number, input: unknown, slug: string): { ok: true; page: Page } | { ok: false; error: string } {
  const current = getPageById(id);
  if (!current) return { ok: false, error: "Page not found." };
  const slugError = checkSlug(slug, id);
  if (slugError) return { ok: false, error: slugError };
  const content = PageContentSchema.parse(input);
  db().prepare("UPDATE pages SET slug = ?, title = ?, draft = ?, updated_at = datetime('now') WHERE id = ?").run(slug, content.title, JSON.stringify(content), id);
  return { ok: true, page: getPageById(id)! };
}

export function publishPage(id: number): Page | null {
  const p = getPageById(id);
  if (!p) return null;
  db().prepare("UPDATE pages SET published = draft, status = 'published', updated_at = datetime('now') WHERE id = ?").run(id);
  return getPageById(id);
}
export function unpublishPage(id: number): void {
  db().prepare("UPDATE pages SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(id);
}
export function deletePage(id: number): void {
  db().prepare("DELETE FROM pages WHERE id = ?").run(id);
}
