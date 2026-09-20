import { PageView, pageMetadata } from "@/components/public/PageView";

export const dynamic = "force-dynamic";
export const generateMetadata = () => pageMetadata("terms");

export default function Page({ searchParams }: { searchParams: { preview?: string } }) {
  return <PageView slug="terms" preview={searchParams.preview === "1"} />;
}
