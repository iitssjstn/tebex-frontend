import { redirect } from "next/navigation";
import { adminCount, getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  if (adminCount() === 0) redirect("/setup");
  if (getCurrentUser()) redirect("/admin");
  return (
    <main className="login">
      <div className="card">
        <h1>Sign in</h1>
        <p className="lead" style={{ marginBottom: "1rem" }}>Manage your store.</p>
        <LoginForm />
      </div>
    </main>
  );
}
