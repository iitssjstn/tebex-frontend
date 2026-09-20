// Recovery for a locked-out owner:  docker compose exec storefront node scripts/reset-password.mjs <username> <new-password>
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 10) {
  console.error("Usage: node scripts/reset-password.mjs <username> <new-password (10+ characters)>");
  process.exit(1);
}
const dir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
const db = new Database(path.join(dir, "storefront.db"));
const r = db.prepare("UPDATE admin_users SET password_hash = ?, disabled = 0 WHERE username = ?").run(bcrypt.hashSync(password, 12), username);
if (!r.changes) { console.error("No such user."); process.exit(1); }
db.prepare("DELETE FROM sessions WHERE user_id = (SELECT id FROM admin_users WHERE username = ?)").run(username);
console.log(`Password reset for ${username}. Existing sessions were signed out.`);
