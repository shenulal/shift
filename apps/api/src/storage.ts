import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Where uploaded files (images, PDFs) go. Swap LocalDiskStorage for S3Storage in multi-instance deployments. */
export interface FileStorage {
  /** Persist `body` and return the public URL to store in records (e.g. Branding.logoUrl, Plan.image). */
  put(file: { body: Buffer; contentType: string; ext: string }): Promise<{ url: string; key: string }>;
}

export const newFileKey = (ext: string) => `${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString('hex')}.${ext}`;

/** Writes to UPLOAD_DIR; files are served by the API at /uploads/<key> (see app.ts). Single-instance only. */
export class LocalDiskStorage implements FileStorage {
  constructor(private readonly dir: string, private readonly publicBase: string) {}

  async put(file: { body: Buffer; contentType: string; ext: string }) {
    const key = newFileKey(file.ext);
    const dest = path.join(this.dir, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, file.body, { flag: 'wx', mode: 0o644 });
    return { key, url: `${this.publicBase}/uploads/${key}` };
  }
}

/**
 * S3 / S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO) — NOT IMPLEMENTED.
 *
 * To enable:
 *  1. `npm i -w @shift/api @aws-sdk/client-s3` (pin the version).
 *  2. Implement put(): `new PutObjectCommand({ Bucket, Key: newFileKey(ext), Body: body, ContentType: contentType,
 *     CacheControl: 'public, max-age=31536000, immutable' })`, return `${publicBaseUrl}/${key}` (bucket website / CDN URL).
 *  3. Add env vars (S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_PUBLIC_URL; credentials via the standard AWS env/role) to config.ts
 *     and choose the implementation in app.ts.
 *  4. Add the bucket/CDN origin to the CSP `img-src` (app.ts) if it differs from PUBLIC_URL.
 */
export class S3Storage implements FileStorage {
  constructor(private readonly opts: { bucket: string; region: string; endpoint?: string; publicUrl: string }) {}
  async put(): Promise<{ url: string; key: string }> {
    throw new Error(`S3Storage is not implemented yet (bucket ${this.opts.bucket}) — see src/storage.ts`);
  }
}

// ───────────────────────────────────────────── file type sniffing

export const ALLOWED_UPLOADS: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/png': { ext: 'png', magic: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/jpeg': { ext: 'jpg', magic: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/gif': { ext: 'gif', magic: (b) => b.length > 6 && (b.subarray(0, 6).toString('latin1') === 'GIF87a' || b.subarray(0, 6).toString('latin1') === 'GIF89a') },
  'image/webp': { ext: 'webp', magic: (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  'application/pdf': { ext: 'pdf', magic: (b) => b.length > 5 && b.subarray(0, 5).toString('latin1') === '%PDF-' },
};

/** Returns the canonical type if the declared mimetype is allowed AND the bytes match it; otherwise null. SVG is deliberately not allowed (script risk). */
export function sniffUpload(declared: string, body: Buffer): { contentType: string; ext: string } | null {
  const type = declared.toLowerCase().split(';')[0].trim();
  const t = ALLOWED_UPLOADS[type === 'image/jpg' ? 'image/jpeg' : type];
  if (!t || !t.magic(body)) return null;
  return { contentType: type === 'image/jpg' ? 'image/jpeg' : type, ext: t.ext };
}
