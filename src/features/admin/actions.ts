"use server";

import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminDashboardStats } from "@/server/admin/dashboard.service";

export async function getAdminDashboardAction() {
  await requireAdmin();
  return getAdminDashboardStats();
}