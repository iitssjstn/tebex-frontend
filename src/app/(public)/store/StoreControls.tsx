"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = { enableSearch: boolean; sort: string; labels: { search: string; searchPlaceholder: string; sortBy: string; sortFeatured: string; sortPriceAsc: string; sortPriceDesc: string; sortName: string } };

export function StoreControls({ enableSearch, sort, labels }: Props) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const push = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    sp.delete("page");
    router.replace(`${path}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  // Debounced: the store is only re-queried once typing pauses.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="controls">
      {enableSearch ? (
        <>
          <label className="sr-only" htmlFor="store-q">{labels.search}</label>
          <input id="store-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.searchPlaceholder} maxLength={80} />
        </>
      ) : null}
      <label className="sr-only" htmlFor="store-sort">{labels.sortBy}</label>
      <select id="store-sort" className="select" value={sort} onChange={(e) => push({ sort: e.target.value })}>
        <option value="featured">{labels.sortFeatured}</option>
        <option value="price-asc">{labels.sortPriceAsc}</option>
        <option value="price-desc">{labels.sortPriceDesc}</option>
        <option value="name">{labels.sortName}</option>
      </select>
    </div>
  );
}
