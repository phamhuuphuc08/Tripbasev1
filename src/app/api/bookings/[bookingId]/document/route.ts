import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/server/auth/session";
import {
  BookingError,
  getBookingDocumentForViewer,
} from "@/server/services/booking.service";
import { getBookingDocumentPath } from "@/server/storage/booking-document";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      bookingId: string;
    }>;
  },
) {
  const { bookingId } = await context.params;
  const url = new URL(request.url);
  const shareToken =
    url.searchParams.get("shareToken");

  const session = await getSession();

  try {
    const { storageKey } =
      await getBookingDocumentForViewer(
        bookingId,
        session?.userId,
        shareToken,
      );

    const filePath =
      getBookingDocumentPath(storageKey);

    const file = await readFile(filePath);
    const extension =
      path.extname(filePath).toLowerCase();

    const contentType =
      CONTENT_TYPE_BY_EXTENSION[
        extension
      ] ?? "application/octet-stream";

    return new Response(
      new Uint8Array(file),
      {
        headers: {
          "Content-Type":
            contentType,
          "Content-Disposition":
            `inline; filename="${path.basename(filePath)}"`,
          "Cache-Control":
            "private, no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    if (
      error instanceof BookingError
    ) {
      if (
        error.message ===
          "NOT_FOUND" ||
        error.message ===
          "DOCUMENT_NOT_FOUND"
      ) {
        return new Response(
          "Not found",
          {
            status: 404,
          },
        );
      }

      if (
        error.message ===
        "FORBIDDEN"
      ) {
        return new Response(
          "Forbidden",
          {
            status: 403,
          },
        );
      }
    }

    return new Response(
      "Unable to open document",
      {
        status: 500,
      },
    );
  }
}