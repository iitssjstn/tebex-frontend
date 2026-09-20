import Link from "next/link";
import { getSetting } from "@/lib/settings";

export default function NotFound() {
  const labels = getSetting("labels");
  return (
    <div className="container center-page">
      <h1>404</h1>
      <p className="muted" style={{ marginBottom: "1.6rem" }}>{labels.pageNotFound}</p>
      <Link className="btn" href="/">{labels.backToHome}</Link>
    </div>
  );
}
