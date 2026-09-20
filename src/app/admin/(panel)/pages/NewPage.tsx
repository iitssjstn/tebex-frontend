"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPageAction } from "@/app/admin/actions";
import { useToast } from "@/components/admin/ui";

export function NewPage() {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  return (
    <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!title.trim()) return; setBusy(true); const r = await createPageAction(title); setBusy(false); if (r.ok) router.push(`/admin/pages/${r.data!.id}`); else toast(r.error, "e"); }}>
      <label htmlFor="np" className="sr-only">Page title</label>
      <input id="np" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New page title, for example Rules" style={{ maxWidth: "22rem" }} />
      <button className="b p" disabled={busy || !title.trim()}>Create page</button>
    </form>
  );
}
