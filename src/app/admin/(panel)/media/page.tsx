import { requireUser } from "@/lib/auth";
import { listMedia, mediaUrl } from "@/lib/media";
import { MediaLibrary } from "./MediaLibrary";

export const metadata = { title: "Media" };

export default function MediaPage() {
  requireUser("content");
  return (
    <>
      <h1>Media</h1>
      <p className="lead">Upload images once and use them anywhere: homepage, products, categories, pages, logo and favicon.</p>
      <MediaLibrary initial={listMedia().map((m) => ({ ...m, url: mediaUrl(m.file) }))} />
    </>
  );
}
