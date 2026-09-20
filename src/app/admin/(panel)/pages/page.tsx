import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPages } from "@/lib/pages";
import { timeAgo } from "@/lib/utils";
import { NewPage } from "./NewPage";

export const metadata = { title: "Pages" };

export default function PagesAdmin() {
  requireUser("content");
  const pages = listPages();
  const url = (s: string) => (["terms", "privacy", "refunds"].includes(s) ? `/${s}` : `/pages/${s}`);
  return (
    <>
      <h1>Pages</h1>
      <p className="lead">Create pages such as About, Rules or Support. Link to them from the navigation or footer.</p>
      <div className="card"><NewPage /></div>
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t">
          <thead><tr><th>Page</th><th>Address</th><th>Status</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td><b>{p.title}</b></td>
                <td>{url(p.slug)}</td>
                <td>{p.status === "published" ? (p.hasUnpublished ? <span className="tag warn">Published, changes pending</span> : <span className="tag ok">Published</span>) : <span className="tag">Draft</span>}</td>
                <td>{timeAgo(p.updatedAt)}</td>
                <td className="row end"><Link className="b s" href={`/admin/pages/${p.id}`}>Edit</Link></td>
              </tr>
            ))}
            {!pages.length ? <tr><td colSpan={5}><div className="empty-a">No pages yet.</div></td></tr> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
