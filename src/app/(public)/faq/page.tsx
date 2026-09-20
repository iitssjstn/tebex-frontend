import type { Metadata } from "next";
import { FaqList } from "@/components/public/FaqList";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Metadata => ({ title: getSetting("faq").title });

export default function FaqPage() {
  const faq = getSetting("faq");
  const items = faq.items.filter((i) => i.enabled);
  return (
    <div className="container" style={{ paddingBlock: "2.5rem 4rem", maxWidth: "50rem" }}>
      <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>{faq.title}</h1>
      {faq.intro ? <p className="muted" style={{ margin: ".8rem 0 1.6rem" }}>{faq.intro}</p> : <div style={{ height: "1.5rem" }} />}
      {items.length ? <FaqList items={items} /> : null}
    </div>
  );
}
