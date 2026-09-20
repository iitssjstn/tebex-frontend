import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="adm">{children}</div>;
}
