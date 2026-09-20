import { PageView, pageMetadata } from "@/components/public/PageView";

export const dynamic = "force-dynamic";
export const generateMetadata = () => pageMetadata("refunds");

export default function Page({ searchParams }: { searchParams: { preview?: string } }) {
  return <PageView slug="refunds" preview={searchParams.preview === "1"} />;
}
