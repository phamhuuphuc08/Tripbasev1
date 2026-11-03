"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import { createAuditLog } from "@/server/admin/audit-log.service";
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

export async function listAdminUsersAction(query = "") {
  await requireAdmin();
  return listAdminUsers(query);
}

export async function getAdminUserAction(userId: string) {
  await requireAdmin();
  return getAdminUser(userId);
}

function getUntilDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function ensureNotSelf(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("ADMIN_CANNOT_MODIFY_SELF");
  return admin;
}

function revalidateUserAdmin() {
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/users", "page");
  revalidatePath("/[locale]/admin/users/[userId]", "page");
  revalidatePath("/[locale]/admin/audit-logs", "page");
}

export async function suspendUserAction(userId: string, days: number, reason = "") {
  const admin = await ensureNotSelf(userId);
  if (!Number.isFinite(days) || days <= 0) throw new Error("INVALID_SUSPENSION_DURATION");

  await suspendUser(userId, getUntilDate(days), reason);

  await createAuditLog({
    adminId: admin.id,
    action: "USER_SUSPENDED",
    targetType: "USER",
    targetId: userId,
    description: reason.trim() || `Đình chỉ tài khoản trong ${days} ngày.`,
    metadata: { days, reason: reason.trim() || null },
  });

  revalidateUserAdmin();
}

export async function removeUserSuspensionAction(userId: string) {
  const admin = await ensureNotSelf(userId);

  await removeUserSuspension(userId);

  await createAuditLog({
    adminId: admin.id,
    action: "USER_UNSUSPENDED",
    targetType: "USER",
    targetId: userId,
    description: "Gỡ đình chỉ tài khoản.",
  });

  revalidateUserAdmin();
}

export async function blockTripCreationAction(userId: string, days: number, reason = "") {
  const admin = await ensureNotSelf(userId);
  if (!Number.isFinite(days) || days <= 0) throw new Error("INVALID_TRIP_BLOCK_DURATION");

  await blockTripCreation(userId, getUntilDate(days), reason);

  await createAuditLog({
    adminId: admin.id,
    action: "TRIP_CREATE_BLOCKED",
    targetType: "USER",
    targetId: userId,
    description: reason.trim() || `Chặn quyền tạo Trip trong ${days} ngày.`,
    metadata: { days, reason: reason.trim() || null },
  });

  revalidateUserAdmin();
}

export async function removeTripCreationBlockAction(userId: string) {
  const admin = await ensureNotSelf(userId);

  await removeTripCreationBlock(userId);

  await createAuditLog({
    adminId: admin.id,
    action: "TRIP_CREATE_UNBLOCKED",
    targetType: "USER",
    targetId: userId,
    description: "Gỡ chặn quyền tạo Trip.",
  });

  revalidateUserAdmin();
}

export async function blockTagCreationAction(userId: string, days: number, reason = "") {
  const admin = await ensureNotSelf(userId);
  if (!Number.isFinite(days) || days <= 0) throw new Error("INVALID_TAG_BLOCK_DURATION");

  await blockTagCreation(userId, getUntilDate(days), reason);

  await createAuditLog({
    adminId: admin.id,
    action: "TAG_CREATE_BLOCKED",
    targetType: "USER",
    targetId: userId,
    description: reason.trim() || `Chặn quyền tạo Tag & Tip trong ${days} ngày.`,
    metadata: { days, reason: reason.trim() || null },
  });

  revalidateUserAdmin();
}

export async function removeTagCreationBlockAction(userId: string) {
  const admin = await ensureNotSelf(userId);

  await removeTagCreationBlock(userId);

  await createAuditLog({
    adminId: admin.id,
    action: "TAG_CREATE_UNBLOCKED",
    targetType: "USER",
    targetId: userId,
    description: "Gỡ chặn quyền tạo Tag & Tip.",
  });

  revalidateUserAdmin();
}

export async function softDeleteUserAction(userId: string) {
  const admin = await ensureNotSelf(userId);

  await softDeleteUser(userId);

  await createAuditLog({
    adminId: admin.id,
    action: "USER_DELETED",
    targetType: "USER",
    targetId: userId,
    description: "Xóa mềm tài khoản khỏi hệ thống.",
  });

  revalidateUserAdmin();
}