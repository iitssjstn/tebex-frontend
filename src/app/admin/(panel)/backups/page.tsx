import { requireUser } from "@/lib/auth";
import { listBackups } from "@/lib/backup";
import { BackupsPanel } from "./BackupsPanel";

export const metadata = { title: "Backups" };

export default function BackupsPage() {
  requireUser("system");
  return (
    <>
      <h1>Backups</h1>
      <p className="lead">A backup contains the whole database and every uploaded image. Store copies somewhere safe.</p>
      <BackupsPanel items={listBackups()} />
    </>
  );
}
