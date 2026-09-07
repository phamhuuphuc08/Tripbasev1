import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

// Local-disk photo storage for Trip Story slides — same mechanism as
// src/server/storage/avatar.ts (separate folder, same reasoning: no
// external object storage/CDN for this stage, Next.js serves public/
// directly, Docker volume keeps it across rebuilds). Kept as its own small
// file rather than a shared generic helper, matching this codebase's
// existing pattern of one small focused file per feature (see
// tag-tip/categories.ts, trip/styles.ts, budget/categories.ts).
const PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "story");
const PUBLIC_PREFIX = "/uploads/story/";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class StoryPhotoError extends Error {}

/** Writes an uploaded slide photo to disk and returns its public URL path. */
export async function saveStoryPhoto(
  tripId: string,
  file: File,
): Promise<string> {
  if (file.size === 0) throw new StoryPhotoError("EMPTY_FILE");
  if (file.size > MAX_PHOTO_BYTES) throw new StoryPhotoError("TOO_LARGE");

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) throw new StoryPhotoError("UNSUPPORTED_TYPE");

  await mkdir(PHOTO_DIR, { recursive: true });
  const filename = `${tripId}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(PHOTO_DIR, filename), buffer);

  return `${PUBLIC_PREFIX}${filename}`;
}

/** Best-effort cleanup of a deleted slide's photo. Never throws. */
export async function deleteStoryPhotoIfLocal(
  photoPath: string | null,
): Promise<void> {
  if (!photoPath || !photoPath.startsWith(PUBLIC_PREFIX)) return;
  const filePath = path.join(process.cwd(), "public", photoPath);
  await unlink(filePath).catch(() => {});
}
