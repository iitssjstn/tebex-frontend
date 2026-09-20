import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

export default function Success({ searchParams }: { searchParams: { demo?: string } }) {
  const labels = getSetting("labels");
  return (
    <div className="container center-page">
      <ClearCart />
      <h1>{labels.checkoutSuccessTitle}</h1>
      <p className="muted" style={{ maxWidth: "32rem", margin: "0 auto 1.6rem" }}>{searchParams.demo ? labels.demoNotice : labels.checkoutSuccessText}</p>
      <Link className="btn" href="/store">{labels.backToStore}</Link>
    </div>
  );
}
