import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

// Local-disk avatar storage — no external object storage/CDN for this
// stage. Written under public/uploads/avatars so Next.js serves it as a
// normal static file at /uploads/avatars/<file> with zero extra routing.
// In Docker, docker-compose.yml mounts a named volume at
// public/uploads so files survive an image rebuild.
const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const PUBLIC_PREFIX = "/uploads/avatars/";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class AvatarError extends Error {}

/** Writes an uploaded avatar to disk and returns its public URL path. */
export async function saveAvatar(userId: string, file: File): Promise<string> {
  if (file.size === 0) throw new AvatarError("EMPTY_FILE");
  if (file.size > MAX_AVATAR_BYTES) throw new AvatarError("TOO_LARGE");

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) throw new AvatarError("UNSUPPORTED_TYPE");

  await mkdir(AVATAR_DIR, { recursive: true });
  const filename = `${userId}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATAR_DIR, filename), buffer);

  return `${PUBLIC_PREFIX}${filename}`;
}

/** Best-effort cleanup of a previous locally-stored avatar. Never throws. */
export async function deleteAvatarIfLocal(
  imagePath: string | null,
): Promise<void> {
  if (!imagePath || !imagePath.startsWith(PUBLIC_PREFIX)) return;
  const filePath = path.join(process.cwd(), "public", imagePath);
  await unlink(filePath).catch(() => {});
}
