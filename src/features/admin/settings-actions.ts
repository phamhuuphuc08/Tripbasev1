"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import { createAuditLog } from "@/server/admin/audit-log.service";
import { updateAdminSettings } from "@/server/admin/settings.service";

export async function updateAdminSettingsAction(formData: FormData) {
  const admin = await requireAdmin();

  const maxTagsPerDay = Math.max(1, Number(formData.get("maxTagsPerDay")) || 10);
  const maxTripsPerUser = Math.max(1, Number(formData.get("maxTripsPerUser")) || 100);

  const settings = {
    maintenanceMode: formData.get("maintenanceMode") === "on",
    registrationEnabled: formData.get("registrationEnabled") === "on",
    tagApprovalRequired: formData.get("tagApprovalRequired") === "on",
    publicTripsEnabled: formData.get("publicTripsEnabled") === "on",
    maxTagsPerDay,
    maxTripsPerUser,
  };

  await updateAdminSettings(settings);

  await createAuditLog({
    adminId: admin.id,
    action: "SETTINGS_UPDATED",
    targetType: "SYSTEM",
    targetId: "settings",
    description: "Cập nhật cài đặt hệ thống TripBase.",
    metadata: settings,
  });

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/settings", "page");
  revalidatePath("/[locale]/admin/audit-logs", "page");
}