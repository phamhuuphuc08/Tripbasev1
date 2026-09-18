import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DOCUMENT_DIR = path.join(process.cwd(), "storage", "bookings");
const PRIVATE_PREFIX = "booking-document:";
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class BookingDocumentError extends Error {}

function safeBaseName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function isBookingDocumentKey(value: string | null | undefined) {
  return Boolean(value?.startsWith(PRIVATE_PREFIX));
}

export async function saveBookingDocument(
  tripId: string,
  file: File,
): Promise<string> {
  if (file.size === 0) throw new BookingDocumentError("EMPTY_FILE");
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new BookingDocumentError("TOO_LARGE");
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new BookingDocumentError("UNSUPPORTED_TYPE");
  }

  await mkdir(DOCUMENT_DIR, { recursive: true });

  const originalName =
    safeBaseName(
      file.name.replace(/\.[^.]+$/, ""),
    ) || "document";

  const filename =
    `${tripId}-${randomUUID()}-${originalName}.${extension}`;

  const buffer = Buffer.from(
    await file.arrayBuffer(),
  );

  await writeFile(
    path.join(DOCUMENT_DIR, filename),
    buffer,
  );

  return `${PRIVATE_PREFIX}${filename}`;
}

export function getBookingDocumentPath(
  storageKey: string,
) {
  if (!storageKey.startsWith(PRIVATE_PREFIX)) {
    throw new BookingDocumentError("INVALID_KEY");
  }

  const filename = storageKey.slice(
    PRIVATE_PREFIX.length,
  );

  if (!filename || path.basename(filename) !== filename) {
    throw new BookingDocumentError("INVALID_KEY");
  }

  return path.join(DOCUMENT_DIR, filename);
}

export async function deleteBookingDocumentIfLocal(
  storageKey: string | null,
): Promise<void> {
  if (!storageKey || !isBookingDocumentKey(storageKey)) {
    return;
  }

  try {
    const filePath =
      getBookingDocumentPath(storageKey);

    await unlink(filePath);
  } catch {
    // Best-effort cleanup.
  }
}