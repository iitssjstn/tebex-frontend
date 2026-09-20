import { getCatalog } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { ProductsManager, type ProductRow } from "./ProductsManager";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  requireUser("store");
  const catalog = await getCatalog({ includeHidden: true });
  const rows: ProductRow[] = catalog.categories.flatMap((c) =>
    c.products.map((p) => ({
      id: p.id,
      demoId: p.id.startsWith("demo-") ? Number(p.id.slice(5)) : null,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      currency: p.currency,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      image: p.image,
      description: p.description,
      featured: p.featured,
      homepage: p.homepage,
      visible: p.visible,
      badge: p.badge,
      sortOrder: p.sortOrder,
      displayDescription: p.displayDescription,
    }))
  );
  return <ProductsManager rows={rows} source={catalog.source} error={catalog.error} categories={catalog.categories.map((c) => ({ id: c.id, name: c.name }))} />;
}
