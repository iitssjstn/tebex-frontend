import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminCount } from "@/lib/auth";
import { CURRENCIES, TIMEZONES } from "@/lib/constants";
import "../admin/admin.css";
import { SetupWizard } from "./SetupWizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your store", robots: { index: false, follow: false } };

export default function SetupPage() {
  if (adminCount() > 0) redirect("/admin/login");
  return (
    <div className="adm">
      <main className="login" style={{ background: "var(--bg)" }}>
        <div className="card" style={{ width: "min(34rem,100%)" }}>
          <SetupWizard timezones={[...TIMEZONES]} currencies={[...CURRENCIES]} />
        </div>
      </main>
    </div>
  );
}
