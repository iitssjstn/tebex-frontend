import Link from "next/link";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/public/Blocks";
import { getCurrentUser } from "@/lib/auth";
import { getPageBySlug } from "@/lib/pages";

/** Renders a published page (or its draft for a signed-in admin previewing). */
export function PageView({ slug, preview }: { slug: string; preview: boolean }) {
  const page = getPageBySlug(slug);
  const admin = preview && !!getCurrentUser();
  if (!page) notFound();
  const content = admin ? page.draft : page.status === "published" ? page.published : null;
  if (!content) notFound();
  return (
    <>
      {admin ? <div className="notice container">Preview{page.status === "published" && !page.hasUnpublished ? "" : " of unpublished changes"}. <Link href={`/admin/pages/${page.id}`}>Back to the editor</Link></div> : null}
      <Blocks blocks={content.blocks} />
    </>
  );
}

export function pageMetadata(slug: string) {
  const page = getPageBySlug(slug);
  if (!page || page.status !== "published" || !page.published) return {};
  return { title: page.published.seoTitle || page.published.title, description: page.published.seoDescription || undefined };
}
