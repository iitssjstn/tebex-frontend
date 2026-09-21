import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/public/ProductCard";
import { allProducts, collapseGroups, getCatalog } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import { plainText } from "@/lib/sanitize";
import { StoreControls } from "./StoreControls";

export type StoreSearch = { q?: string; sort?: string; page?: string };

export async function StoreView({ categorySlug, searchParams }: { categorySlug?: string; searchParams: StoreSearch }) {
  const store = getSetting("store");
  const labels = getSetting("labels");
  const catalog = await getCatalog();
  const category = categorySlug ? catalog.categories.find((c) => c.slug === categorySlug) : undefined;
  const sort = ["featured", "price-asc", "price-desc", "name"].includes(searchParams.sort ?? "") ? (searchParams.sort as string) : store.defaultSort;
  const q = (searchParams.q ?? "").trim().toLowerCase().slice(0, 80);

  let entries = collapseGroups(category ? category.products : allProducts(catalog));
  if (q) entries = entries.filter((e) => e.name.toLowerCase().includes(q) || e.options.some((p) => p.name.toLowerCase().includes(q) || plainText(p.displayDescription || p.description).toLowerCase().includes(q)));
  entries = [...entries];
  if (sort === "price-asc") entries.sort((a, b) => a.fromPrice - b.fromPrice);
  else if (sort === "price-desc") entries.sort((a, b) => b.fromPrice - a.fromPrice);
  else if (sort === "name") entries.sort((a, b) => a.name.localeCompare(b.name));
  else entries.sort((a, b) => Number(b.featured) - Number(a.featured));

  const per = store.productsPerPage;
  const pages = Math.max(1, Math.ceil(entries.length / per));
  const page = Math.min(pages, Math.max(1, Number(searchParams.page) || 1));
  const shown = entries.slice((page - 1) * per, page * per);
  const qs = (n: number) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.sort) sp.set("sort", searchParams.sort);
    if (n > 1) sp.set("page", String(n));
    return sp.toString() ? `?${sp}` : "";
  };
  const base = category ? `/store/${category.slug}` : "/store";

  return (
    <div className="container">
      <div className="store-head">
        <h1>{category ? category.name : store.title}</h1>
        {category?.description ? <p className="muted" style={{ maxWidth: "40rem", marginTop: ".6rem" }}>{category.description}</p> : null}
      </div>
      {catalog.source === "demo" ? <p className="notice">{labels.demoNotice}</p> : null}
      {catalog.error ? <p className="notice" role="status">{labels.errorText}</p> : null}
      <div className="store-bar">
        <nav className="tabs" aria-label="Categories">
          <Link className="tab" href="/store" aria-current={!category ? "page" : undefined}>{labels.allCategories}</Link>
          {catalog.categories.filter((c) => c.products.length).map((c) => (
            <Link key={c.id} className="tab" href={`/store/${c.slug}`} aria-current={category?.id === c.id ? "page" : undefined}>{c.name}</Link>
          ))}
        </nav>
        <Suspense fallback={null}>
          <StoreControls enableSearch={store.enableSearch} sort={sort} labels={labels} />
        </Suspense>
      </div>
      {shown.length ? (
        <div className="grid" data-style={store.productStyle}>{shown.map((e) => <ProductCard key={e.key} entry={e} showCategory={!category} />)}</div>
      ) : (
        <p className="empty">{q ? labels.noResults : labels.emptyCategory}</p>
      )}
      {pages > 1 ? (
        <nav className="pager" aria-label="Pages">
          {page > 1 ? <Link className="btn btn-ghost btn-sm" href={`${base}${qs(page - 1)}`}>{labels.previous}</Link> : null}
          <span className="muted">{page} / {pages}</span>
          {page < pages ? <Link className="btn btn-ghost btn-sm" href={`${base}${qs(page + 1)}`}>{labels.next}</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}
