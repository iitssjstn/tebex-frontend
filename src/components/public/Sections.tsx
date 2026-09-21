import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { allProducts, collapseGroups, getCatalog, type Catalog } from "@/lib/catalog";
import { cleanHtml } from "@/lib/sanitize";
import { getSetting } from "@/lib/settings";
import { isExternal, safeHref } from "@/lib/utils";
import { SECTION_CONFIG, type Section, type SectionConfig } from "@/lib/validators";
import { FaqList } from "./FaqList";
import { ProductCard } from "./ProductCard";
import { PlayerChip, StatusPanel, CopyIp } from "./ServerStatus";

type Style = { background: string; backgroundImage: string; overlay: number; align: string; paddingY: string; textColor: string };

function Shell({ cfg, id, children, className = "" }: { cfg: Style; id: string; children: ReactNode; className?: string }) {
  const hasImg = !!cfg.backgroundImage;
  const style: CSSProperties & Record<string, string | number> = {};
  if (cfg.background) style.background = cfg.background;
  if (hasImg) {
    style.backgroundImage = `url("${cfg.backgroundImage.replace(/"/g, "%22")}")`;
    style["--overlay"] = cfg.overlay / 100;
  }
  if (cfg.textColor) style.color = cfg.textColor;
  else if (hasImg) style.color = "#fff";
  return (
    <section id={`s-${id}`} className={`section ${hasImg ? "section-bg" : ""} ${className}`} data-align={cfg.align} data-pad={cfg.paddingY} data-tint={hasImg || !!cfg.textColor} style={style}>
      <div className="container">{children}</div>
    </section>
  );
}

function Head({ title, subtitle }: { title: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="section-head">
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function LinkBtn({ href, children, ghost }: { href: string; children: ReactNode; ghost?: boolean }) {
  const h = safeHref(href);
  const cls = `btn${ghost ? " btn-ghost" : ""}`;
  return isExternal(h) ? <a className={cls} href={h} target="_blank" rel="noopener noreferrer">{children}</a> : <Link className={cls} href={h}>{children}</Link>;
}

export async function HomeSections({ sections }: { sections: Section[] }) {
  const needsCatalog = sections.some((s) => s.enabled && (s.type === "featuredProducts" || s.type === "categories"));
  const catalog = needsCatalog ? await getCatalog() : null;
  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((s) => (
          <SectionView key={s.id} section={s} catalog={catalog} />
        ))}
    </>
  );
}

function SectionView({ section, catalog }: { section: Section; catalog: Catalog | null }) {
  const labels = getSetting("labels");
  const server = getSetting("server");
  const statusLabels = { online: labels.online, offline: labels.offline, statusUnavailable: labels.statusUnavailable, playersOnline: labels.playersOnline };

  switch (section.type) {
    case "hero": {
      const c: SectionConfig<"hero"> = SECTION_CONFIG.hero.parse(section.config);
      const style: CSSProperties & Record<string, string | number> = { "--overlay": c.overlay / 100 };
      if (c.backgroundImage) style.backgroundImage = `url("${c.backgroundImage.replace(/"/g, "%22")}")`;
      if (c.background) style.backgroundColor = c.background;
      if (c.textColor) style.color = c.textColor;
      return (
        <section className="hero" data-height={c.height} data-align={c.align} style={style} id={`s-${section.id}`}>
          <div className="container">
            <div className="hero-in">
              {c.logo ? <img className="hero-logo" src={c.logo} alt="" /> : null}
              <h1>{c.heading}</h1>
              {c.subtitle ? <p>{c.subtitle}</p> : null}
              {c.button1Text || c.button2Text ? (
                <div className="hero-actions">
                  {c.button1Text ? <LinkBtn href={c.button1Url}>{c.button1Text}</LinkBtn> : null}
                  {c.button2Text ? <LinkBtn href={c.button2Url} ghost>{c.button2Text}</LinkBtn> : null}
                </div>
              ) : null}
              {(c.showServerIp && server.ip) || c.showPlayerCount ? (
                <div className="hero-meta">
                  {c.showServerIp && server.ip ? <CopyIp ip={server.ip} copyLabel={labels.copyIp} copiedLabel={labels.copied} /> : null}
                  {c.showPlayerCount ? <PlayerChip labels={statusLabels} /> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      );
    }

    case "featuredProducts": {
      const c: SectionConfig<"featuredProducts"> = SECTION_CONFIG.featuredProducts.parse(section.config);
      const all = catalog ? allProducts(catalog) : [];
      const ranked = collapseGroups(all).sort((a, b) => Number(b.homepage || b.featured) - Number(a.homepage || a.featured));
      const items = ranked.slice(0, c.count);
      return (
        <Shell cfg={c} id={section.id}>
          <Head title={c.title} subtitle={c.subtitle} />
          {items.length ? (
            <div className="featured-grid">{items.map((e) => <ProductCard key={e.key} entry={e} showCategory />)}</div>
          ) : (
            <p className="empty">{labels.emptyCategory}</p>
          )}
          <p style={{ marginTop: "1.6rem" }}><LinkBtn href="/store" ghost>{labels.allCategories}</LinkBtn></p>
        </Shell>
      );
    }

    case "categories": {
      const c: SectionConfig<"categories"> = SECTION_CONFIG.categories.parse(section.config);
      const cats = (catalog?.categories ?? []).filter((x) => x.products.length > 0);
      return (
        <Shell cfg={c} id={section.id}>
          <Head title={c.title} subtitle={c.subtitle} />
          <div className="cat-grid">
            {cats.map((cat) => (
              <Link key={cat.id} href={`/store/${cat.slug}`} className="cat-tile" style={cat.image ? { backgroundImage: `url("${cat.image.replace(/"/g, "%22")}")` } : undefined}>
                <h3>{cat.name}</h3>
                <span>{cat.products.length}</span>
              </Link>
            ))}
          </div>
        </Shell>
      );
    }

    case "serverStatus": {
      const c: SectionConfig<"serverStatus"> = SECTION_CONFIG.serverStatus.parse(section.config);
      return (
        <Shell cfg={c} id={section.id}>
          <StatusPanel title={c.title} description={c.description} ip={server.ip} labels={statusLabels} />
        </Shell>
      );
    }

    case "discord": {
      const c: SectionConfig<"discord"> = SECTION_CONFIG.discord.parse(section.config);
      const d = getSetting("discord");
      if (!d.enabled || !d.url) return null;
      return (
        <Shell cfg={c} id={section.id}>
          <div className="discord-panel">
            <div>
              <h2>{d.sectionTitle}</h2>
              {d.sectionDescription ? <p>{d.sectionDescription}</p> : null}
            </div>
            <a className="btn" href={safeHref(d.url)} target="_blank" rel="noopener noreferrer">{d.buttonText}</a>
          </div>
        </Shell>
      );
    }

    case "promoBanner": {
      const c: SectionConfig<"promoBanner"> = SECTION_CONFIG.promoBanner.parse(section.config);
      const style: CSSProperties = {};
      if (c.background) style.background = c.background;
      if (c.textColor) style.color = c.textColor;
      return (
        <div className="promo" style={style} id={`s-${section.id}`}>
          <div className="container">
            <span>{c.text}</span>
            {c.buttonText ? <LinkBtn href={c.buttonUrl}>{c.buttonText}</LinkBtn> : null}
          </div>
        </div>
      );
    }

    case "imageBanner": {
      const c: SectionConfig<"imageBanner"> = SECTION_CONFIG.imageBanner.parse(section.config);
      if (!c.image) return null;
      const img = <img className="img-banner" data-h={c.height} src={c.image} alt={c.alt} loading="lazy" />;
      return <div id={`s-${section.id}`} style={c.background ? { background: c.background } : undefined}>{c.link ? <LinkBtnWrap href={c.link}>{img}</LinkBtnWrap> : img}</div>;
    }

    case "text": {
      const c: SectionConfig<"text"> = SECTION_CONFIG.text.parse(section.config);
      return (
        <Shell cfg={c} id={section.id}>
          <Head title={c.title} />
          <div className="prose" style={c.align === "center" ? { marginInline: "auto" } : c.align === "right" ? { marginLeft: "auto" } : undefined} dangerouslySetInnerHTML={{ __html: cleanHtml(c.body) }} />
        </Shell>
      );
    }

    case "faq": {
      const c: SectionConfig<"faq"> = SECTION_CONFIG.faq.parse(section.config);
      const faq = getSetting("faq");
      const items = faq.items.filter((i) => i.enabled);
      const shown = c.limit > 0 ? items.slice(0, c.limit) : items;
      if (!shown.length) return null;
      return (
        <Shell cfg={c} id={section.id}>
          <Head title={c.title || faq.title} />
          <FaqList items={shown} />
          {c.limit > 0 && items.length > c.limit ? <p style={{ marginTop: "1.2rem" }}><LinkBtn href="/faq" ghost>{faq.title}</LinkBtn></p> : null}
        </Shell>
      );
    }

    case "testimonials": {
      const c: SectionConfig<"testimonials"> = SECTION_CONFIG.testimonials.parse(section.config);
      if (!c.items.length) return null;
      return (
        <Shell cfg={c} id={section.id}>
          <Head title={c.title} />
          <div className="quotes">
            {c.items.map((t, i) => (
              <blockquote className="quote" key={i} style={{ margin: 0 }}>
                <p>{t.quote}</p>
                <footer>
                  {t.avatar ? <img src={t.avatar} alt="" loading="lazy" /> : null}
                  <span><b style={{ color: "var(--c-text)" }}>{t.name}</b>{t.role ? ` \u00b7 ${t.role}` : ""}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </Shell>
      );
    }

    case "customHtml": {
      const c: SectionConfig<"customHtml"> = SECTION_CONFIG.customHtml.parse(section.config);
      return (
        <Shell cfg={c} id={section.id}>
          <div className="prose" style={{ maxWidth: "none" }} dangerouslySetInnerHTML={{ __html: cleanHtml(c.html) }} />
        </Shell>
      );
    }

    default:
      return null;
  }
}

function LinkBtnWrap({ href, children }: { href: string; children: ReactNode }) {
  const h = safeHref(href);
  return isExternal(h) ? <a href={h} target="_blank" rel="noopener noreferrer">{children}</a> : <Link href={h}>{children}</Link>;
}
