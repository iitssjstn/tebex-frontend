import { PageView, pageMetadata } from "@/components/public/PageView";

export const dynamic = "force-dynamic";
export const generateMetadata = () => pageMetadata("privacy");

export default function Page({ searchParams }: { searchParams: { preview?: string } }) {
  return <PageView slug="privacy" preview={searchParams.preview === "1"} />;
}
