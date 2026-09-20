import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { BrandingForm } from "./BrandingForm";

export const metadata = { title: "Branding" };

export default function BrandingPage() {
  requireUser("content");
  return (
    <>
      <h1>Branding</h1>
      <p className="lead">Your name, logo, fonts and button style. Colours are set under Theme.</p>
      <BrandingForm initial={getSetting("branding")} theme={getSetting("theme")} />
    </>
  );
}
