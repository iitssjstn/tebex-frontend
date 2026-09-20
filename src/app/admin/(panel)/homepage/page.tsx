import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { HomeEditor } from "./HomeEditor";

export const metadata = { title: "Homepage" };

export default function HomepagePage() {
  requireUser("content");
  return <HomeEditor draft={getSetting("home.draft").sections} published={getSetting("home.published").sections} />;
}
