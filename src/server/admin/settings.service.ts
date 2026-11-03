import "server-only";

import { prisma } from "@/server/db/client";

export const DEFAULT_ADMIN_SETTINGS = {
  maintenanceMode: false,
  registrationEnabled: true,
  tagApprovalRequired: true,
  publicTripsEnabled: true,
  maxTagsPerDay: 10,
  maxTripsPerUser: 100,
};

export type AdminSettings = typeof DEFAULT_ADMIN_SETTINGS;

export async function getAdminSettings(): Promise<AdminSettings> {
  const rows = await prisma.systemSetting.findMany();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    maintenanceMode: typeof values.maintenanceMode === "boolean" ? values.maintenanceMode : DEFAULT_ADMIN_SETTINGS.maintenanceMode,
    registrationEnabled: typeof values.registrationEnabled === "boolean" ? values.registrationEnabled : DEFAULT_ADMIN_SETTINGS.registrationEnabled,
    tagApprovalRequired: typeof values.tagApprovalRequired === "boolean" ? values.tagApprovalRequired : DEFAULT_ADMIN_SETTINGS.tagApprovalRequired,
    publicTripsEnabled: typeof values.publicTripsEnabled === "boolean" ? values.publicTripsEnabled : DEFAULT_ADMIN_SETTINGS.publicTripsEnabled,
    maxTagsPerDay: typeof values.maxTagsPerDay === "number" ? values.maxTagsPerDay : DEFAULT_ADMIN_SETTINGS.maxTagsPerDay,
    maxTripsPerUser: typeof values.maxTripsPerUser === "number" ? values.maxTripsPerUser : DEFAULT_ADMIN_SETTINGS.maxTripsPerUser,
  };
}

export async function updateAdminSettings(settings: AdminSettings) {
  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}