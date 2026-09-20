import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { ThemeEditor } from "./ThemeEditor";

export const metadata = { title: "Theme" };

export default function ThemePage() {
  requireUser("content");
  return (
    <>
      <h1>Theme</h1>
      <p className="lead">Pick a preset, then adjust any colour. The preview updates as you go, and the store changes as soon as you save.</p>
      <ThemeEditor initial={getSetting("theme")} branding={getSetting("branding")} />
    </>
  );
}
