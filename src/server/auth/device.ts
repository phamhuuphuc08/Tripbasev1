import {
  createHash,
  randomUUID,
} from "node:crypto";

import { cookies } from "next/headers";

const DEVICE_COOKIE_NAME =
  "tripbase_device_id";

const DEVICE_COOKIE_MAX_AGE =
  60 * 60 * 24 * 365;

/**
 * Lấy device hash dùng cho CopyPlan guardrail.
 *
 * Cách hoạt động:
 * - Browser chưa có device ID → tạo UUID ngẫu nhiên.
 * - UUID chỉ lưu trong cookie.
 * - Database KHÔNG lưu UUID gốc.
 * - Database chỉ nhận SHA-256 hash.
 */
export async function getOrCreateDeviceHash() {
  const cookieStore =
    await cookies();

  let deviceId =
    cookieStore.get(
      DEVICE_COOKIE_NAME,
    )?.value;

  if (!deviceId) {
    deviceId = randomUUID();

    cookieStore.set(
      DEVICE_COOKIE_NAME,
      deviceId,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge:
          DEVICE_COOKIE_MAX_AGE,
      },
    );
  }

  return createHash("sha256")
    .update(deviceId)
    .digest("hex");
}