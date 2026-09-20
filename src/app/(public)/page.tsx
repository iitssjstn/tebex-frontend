import Link from "next/link";
import { HomeSections } from "@/components/public/Sections";
import { getCurrentUser } from "@/lib/auth";
import { getHome } from "@/lib/home";
import { getSetting } from "@/lib/settings";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { preview?: string } }) {
  const preview = searchParams.preview === "1" && !!getCurrentUser();
  const home = getHome(preview);
  const catalog = await getCatalog();
  const labels = getSetting("labels");
  return (
    <>
      {preview ? <div className="notice container">Preview of unpublished changes. <Link href="/admin/homepage">Back to the editor</Link></div> : null}
      {catalog.source === "demo" ? <div className="container"><p className="notice">{labels.demoNotice}</p></div> : null}
      <HomeSections sections={home.sections} />
    </>
  );
}
