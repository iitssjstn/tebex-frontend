import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sf-test-"));
});

describe("sanitizer", () => {
  it("removes scripts, event handlers and javascript: links", async () => {
    const { cleanHtml } = await import("../src/lib/sanitize");
    const out = cleanHtml('<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>hi</p>");
  });
  it("only allows YouTube/Vimeo iframes", async () => {
    const { cleanHtml } = await import("../src/lib/sanitize");
    expect(cleanHtml('<iframe src="https://evil.example/x"></iframe>')).not.toContain("evil.example");
    expect(cleanHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toContain("youtube.com");
  });
});

describe("secrets", () => {
  it("round-trips and rejects tampering", async () => {
    const { encryptSecret, decryptSecret } = await import("../src/lib/crypto");
    const enc = encryptSecret("my-private-key");
    expect(enc).not.toContain("my-private-key");
    expect(decryptSecret(enc)).toBe("my-private-key");
    expect(decryptSecret(enc.slice(0, -4) + "AAAA")).toBe("");
  });
});

describe("urls", () => {
  it("blocks private and local addresses for admin-supplied API URLs", async () => {
    const { isSafePublicUrl, safeHref } = await import("../src/lib/utils");
    for (const u of ["http://localhost/x", "http://127.0.0.1/x", "http://10.0.0.5/x", "http://192.168.1.1/x", "http://169.254.169.254/x", "ftp://example.com"]) expect(isSafePublicUrl(u)).toBe(false);
    expect(isSafePublicUrl("https://api.mcstatus.io/v2/status/java/x")).toBe(true);
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("//evil.example")).toBe("#");
    expect(safeHref("/store")).toBe("/store");
  });
});

describe("validators", () => {
  it("rejects unsafe links and bad colours", async () => {
    const { FooterSchema, ThemeSchema } = await import("../src/lib/validators");
    expect(() => FooterSchema.parse({ legalLinks: [{ label: "x", url: "javascript:alert(1)" }] })).toThrow();
    expect(() => ThemeSchema.parse({ primary: "red" })).toThrow();
    expect(ThemeSchema.parse({}).primary).toBe("#FCD05C");
  });
  it("sanitises rich text inside homepage sections", async () => {
    const { HomeSchema } = await import("../src/lib/validators");
    const r = HomeSchema.parse({ sections: [{ type: "text", config: { body: "<p>a</p><script>x</script>" } }] });
    expect(JSON.stringify(r)).not.toContain("script");
  });
});

describe("catalog mapping", () => {
  it("uses Tebex prices and derives the original price from the discount", async () => {
    const { mapTebex } = await import("../src/lib/catalog");
    const cats = mapTebex([{ id: 1, name: "Ranks", packages: [{ id: 5, name: "VIP", total_price: 15, discount: 5 }] }], "EUR");
    expect(cats[0].products[0].price).toBe(15);
    expect(cats[0].products[0].originalPrice).toBe(20);
    expect(cats[0].products[0].currency).toBe("EUR");
  });
});

describe("migrations", () => {
  it("apply on an empty database and are idempotent", async () => {
    const { db, migrate } = await import("../src/lib/db");
    expect(db().prepare("SELECT COUNT(*) AS n FROM _migrations").get()).toEqual({ n: 1 });
    expect(migrate(db())).toEqual([]);
  });
});

describe("media", () => {
  it("rejects files that are not images", async () => {
    const { saveUpload } = await import("../src/lib/media");
    await expect(saveUpload(Buffer.from("<script>alert(1)</script>"), "x.png")).rejects.toThrow(/not a valid image/);
  });
  it("re-encodes images to WebP and strips the original file type", async () => {
    const sharp = (await import("sharp")).default;
    const { saveUpload } = await import("../src/lib/media");
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#f00" } }).png().toBuffer();
    const row = await saveUpload(png, "a b.png");
    expect(row.file).toMatch(/^[a-f0-9]{16}\.webp$/);
    expect(row.mime).toBe("image/webp");
  });
});
