import { PageView, pageMetadata } from "@/components/public/PageView";

export const dynamic = "force-dynamic";
export const generateMetadata = ({ params }: { params: { slug: string } }) => pageMetadata(params.slug);

export default function CustomPage({ params, searchParams }: { params: { slug: string }; searchParams: { preview?: string } }) {
  return <PageView slug={params.slug} preview={searchParams.preview === "1"} />;
}
