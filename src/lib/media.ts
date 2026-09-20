import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { db, dataDir } from "./db";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
sharp.cache(false);

export type MediaRow = { id: string; file: string; original_name: string; mime: string; size: number; width: number; height: number; alt: string; created_at: string };

export const uploadsDir = () => {
  const dir = path.join(dataDir(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const FILE_RE = /^[a-f0-9]{16}\.(webp|gif)$/;
export const isMediaFile = (name: string) => FILE_RE.test(name);
export const mediaUrl = (file: string) => `/media/${file}`;
export const mediaPath = (file: string) => path.join(uploadsDir(), file);

/**
 * Validates the bytes with an image decoder (extension and content-type are never trusted), strips metadata by
 * re-encoding to WebP, and stores the result under a random name. Animated GIFs are kept as they are.
 */
export async function saveUpload(buf: Buffer, originalName: string): Promise<MediaRow> {
  if (buf.length === 0) throw new Error("The file is empty.");
  if (buf.length > MAX_UPLOAD_BYTES) throw new Error("The file is larger than 8 MB.");
  let meta: Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new Error("That file is not a valid image.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "gif"].includes(meta.format)) throw new Error("Upload a PNG, JPG, WebP or GIF image.");

  const id = crypto.randomBytes(8).toString("hex");
  let out: Buffer;
  let ext: "webp" | "gif";
  let width = meta.width ?? 0;
  let height = meta.height ?? 0;
  if (meta.format === "gif") {
    out = buf;
    ext = "gif";
  } else {
    const r = await sharp(buf, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    out = r.data;
    ext = "webp";
    width = r.info.width;
    height = r.info.height;
  }
  const file = `${id}.${ext}`;
  fs.writeFileSync(mediaPath(file), out);
  const row: MediaRow = {
    id,
    file,
    original_name: originalName.replace(/[^\w.\- ]+/g, "").slice(0, 120),
    mime: ext === "gif" ? "image/gif" : "image/webp",
    size: out.length,
    width,
    height,
    alt: "",
    created_at: new Date().toISOString(),
  };
  db()
    .prepare("INSERT INTO media (id, file, original_name, mime, size, width, height, alt, created_at) VALUES (@id, @file, @original_name, @mime, @size, @width, @height, @alt, @created_at)")
    .run(row);
  return row;
}

export function listMedia(query = ""): MediaRow[] {
  const q = `%${query.trim().replace(/[%_]/g, "")}%`;
  return db().prepare("SELECT * FROM media WHERE original_name LIKE ? OR alt LIKE ? ORDER BY created_at DESC LIMIT 500").all(q, q) as MediaRow[];
}

export function deleteMedia(id: string): void {
  const row = db().prepare("SELECT file FROM media WHERE id = ?").get(id) as { file: string } | undefined;
  if (!row) return;
  db().prepare("DELETE FROM media WHERE id = ?").run(id);
  try {
    fs.unlinkSync(mediaPath(row.file));
  } catch {
    /* file already gone */
  }
}

export function setMediaAlt(id: string, alt: string): void {
  db().prepare("UPDATE media SET alt = ? WHERE id = ?").run(alt.slice(0, 200), id);
}

/** Swaps the image behind an existing address, so every place that uses it updates. Same format only (WebP for WebP, GIF for GIF). */
export async function replaceUpload(id: string, buf: Buffer): Promise<MediaRow> {
  const old = db().prepare("SELECT * FROM media WHERE id = ?").get(id) as MediaRow | undefined;
  if (!old) throw new Error("Image not found.");
  const fresh = await saveUpload(buf, old.original_name);
  if (fresh.file.split(".")[1] !== old.file.split(".")[1]) {
    deleteMedia(fresh.id);
    throw new Error(old.file.endsWith(".gif") ? "Replace a GIF with another GIF." : "Replace this image with a PNG, JPG or WebP file (not a GIF).");
  }
  fs.renameSync(mediaPath(fresh.file), mediaPath(old.file));
  db().prepare("DELETE FROM media WHERE id = ?").run(fresh.id);
  db().prepare("UPDATE media SET size = ?, width = ?, height = ? WHERE id = ?").run(fresh.size, fresh.width, fresh.height, id);
  return { ...old, size: fresh.size, width: fresh.width, height: fresh.height };
}
