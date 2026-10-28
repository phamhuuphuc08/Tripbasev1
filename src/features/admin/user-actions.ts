"use server";

import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminUser, listAdminUsers } from "@/server/admin/user-admin.service";

export async function listAdminUsersAction(query = "") {
  await requireAdmin();
  return listAdminUsers(query);
}

export async function getAdminUserAction(userId: string) {
  await requireAdmin();
  return getAdminUser(userId);
}