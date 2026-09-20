import { requireUser } from "@/lib/auth";
import { AccountForm } from "./AccountForm";

export const metadata = { title: "My account" };

export default function AccountPage() {
  const u = requireUser();
  return (
    <>
      <h1>My account</h1>
      <p className="lead">Signed in as {u.username} ({u.role}).</p>
      <AccountForm />
    </>
  );
}
