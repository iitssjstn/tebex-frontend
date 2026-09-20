import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { StoreView, type StoreSearch } from "../StoreView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { category: string } }) {
  const c = (await getCatalog()).categories.find((x) => x.slug === params.category);
  return { title: c?.name };
}

export default async function CategoryPage({ params, searchParams }: { params: { category: string }; searchParams: StoreSearch }) {
  const catalog = await getCatalog();
  if (!catalog.categories.some((c) => c.slug === params.category)) notFound();
  return <StoreView categorySlug={params.category} searchParams={searchParams} />;
}
