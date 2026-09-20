import { getCatalog } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { CategoriesManager } from "./CategoriesManager";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  requireUser("store");
  const catalog = await getCatalog({ includeHidden: true });
  return (
    <CategoriesManager
      source={catalog.source}
      error={catalog.error}
      rows={catalog.categories.map((c) => ({ id: c.id, demoId: c.id.startsWith("demo-") ? Number(c.id.slice(5)) : null, name: c.name, slug: c.slug, description: c.description, image: c.image, visible: c.visible, sortOrder: c.order, count: c.products.length }))}
    />
  );
}
