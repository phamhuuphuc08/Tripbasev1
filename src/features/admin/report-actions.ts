"use server";

import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminReports } from "@/server/admin/report-admin.service";

export async function listAdminReportsAction() {
  await requireAdmin();
  return listAdminReports();
}