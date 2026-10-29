"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import {
  blockTagCreation,
  blockTripCreation,
  getAdminUser,
  listAdminUsers,
  removeTagCreationBlock,
  removeTripCreationBlock,
  removeUserSuspension,
  softDeleteUser,
  suspendUser,
} from "@/server/admin/user-admin.service";

export async function listAdminUsersAction(
  query = "",
) {
  await requireAdmin();

  return listAdminUsers(query);
}

export async function getAdminUserAction(
  userId: string,
) {
  await requireAdmin();

  return getAdminUser(userId);
}

/**
 * Chuyển số ngày thành thời điểm hết hạn.
 */
function getUntilDate(days: number) {
  const date = new Date();

  date.setDate(
    date.getDate() + days,
  );

  return date;
}

/**
 * Không cho Admin tự đình chỉ / xóa chính mình.
 */
async function ensureNotSelf(
  userId: string,
) {
  const admin =
    await requireAdmin();

  if (admin.id === userId) {
    throw new Error(
      "ADMIN_CANNOT_MODIFY_SELF",
    );
  }

  return admin;
}

/**
 * Đình chỉ toàn bộ tài khoản.
 */
export async function suspendUserAction(
  userId: string,
  days: number,
  reason = "",
) {
  await ensureNotSelf(userId);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    throw new Error(
      "INVALID_SUSPENSION_DURATION",
    );
  }

  await suspendUser(
    userId,
    getUntilDate(days),
    reason,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Gỡ đình chỉ tài khoản.
 */
export async function removeUserSuspensionAction(
  userId: string,
) {
  await ensureNotSelf(userId);

  await removeUserSuspension(
    userId,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Chặn quyền tạo Trip.
 */
export async function blockTripCreationAction(
  userId: string,
  days: number,
  reason = "",
) {
  await ensureNotSelf(userId);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    throw new Error(
      "INVALID_TRIP_BLOCK_DURATION",
    );
  }

  await blockTripCreation(
    userId,
    getUntilDate(days),
    reason,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Gỡ chặn tạo Trip.
 */
export async function removeTripCreationBlockAction(
  userId: string,
) {
  await ensureNotSelf(userId);

  await removeTripCreationBlock(
    userId,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Chặn quyền tạo Tag & Tip.
 */
export async function blockTagCreationAction(
  userId: string,
  days: number,
  reason = "",
) {
  await ensureNotSelf(userId);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    throw new Error(
      "INVALID_TAG_BLOCK_DURATION",
    );
  }

  await blockTagCreation(
    userId,
    getUntilDate(days),
    reason,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Gỡ chặn tạo Tag & Tip.
 */
export async function removeTagCreationBlockAction(
  userId: string,
) {
  await ensureNotSelf(userId);

  await removeTagCreationBlock(
    userId,
  );

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}

/**
 * Xóa mềm tài khoản.
 */
export async function softDeleteUserAction(
  userId: string,
) {
  await ensureNotSelf(userId);

  await softDeleteUser(userId);

  revalidatePath(
    "/[locale]/admin/users",
    "page",
  );

  revalidatePath(
    "/[locale]/admin/users/[userId]",
    "page",
  );
}