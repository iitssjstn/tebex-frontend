import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPageById } from "@/lib/pages";
import { PageEditor } from "./PageEditor";

export const metadata = { title: "Edit page" };

export default function EditPage({ params }: { params: { id: string } }) {
  requireUser("content");
  const page = getPageById(Number(params.id));
  if (!page) notFound();
  return <PageEditor page={{ id: page.id, slug: page.slug, status: page.status, hasUnpublished: page.hasUnpublished, content: page.draft }} />;
}
