"use server";

import { ReportStatus, ReportTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import { createAuditLog } from "@/server/admin/audit-log.service";
import {
  getAdminReport,
  getAdminReportStats,
  listAdminReports,
  updateReportStatus,
} from "@/server/admin/report-admin.service";

export async function listAdminReportsAction(
  query = "",
  status?: ReportStatus,
  targetType?: ReportTargetType,
) {
  await requireAdmin();
  return listAdminReports(query, status, targetType);
}

export async function getAdminReportAction(reportId: string) {
  await requireAdmin();
  return getAdminReport(reportId);
}

export async function getAdminReportStatsAction() {
  await requireAdmin();
  return getAdminReportStats();
}

function revalidateReports() {
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/reports", "page");
  revalidatePath("/[locale]/admin/reports/[reportId]", "page");
  revalidatePath("/[locale]/admin/audit-logs", "page");
}

export async function markReportReviewingAction(
  reportId: string,
  reviewNote = "",
) {
  const admin = await requireAdmin();
  const report = await getAdminReport(reportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  await updateReportStatus(
    reportId,
    "REVIEWING",
    admin.id,
    reviewNote,
  );

  await createAuditLog({
    adminId: admin.id,
    action: "REPORT_REVIEWING",
    targetType: "REPORT",
    targetId: reportId,
    description: "Bắt đầu xem xét báo cáo.",
    metadata: {
      reportTargetType: report.targetType,
      reportTargetId: report.targetId,
    },
  });

  revalidateReports();
}

export async function resolveReportAction(
  reportId: string,
  reviewNote = "",
) {
  const admin = await requireAdmin();
  const report = await getAdminReport(reportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  await updateReportStatus(
    reportId,
    "RESOLVED",
    admin.id,
    reviewNote,
  );

  await createAuditLog({
    adminId: admin.id,
    action: "REPORT_RESOLVED",
    targetType: "REPORT",
    targetId: reportId,
    description: reviewNote.trim() || "Đã xử lý báo cáo.",
    metadata: {
      reportTargetType: report.targetType,
      reportTargetId: report.targetId,
      reviewNote: reviewNote.trim() || null,
    },
  });

  revalidateReports();
}

export async function rejectReportAction(
  reportId: string,
  reviewNote = "",
) {
  const admin = await requireAdmin();
  const report = await getAdminReport(reportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  await updateReportStatus(
    reportId,
    "REJECTED",
    admin.id,
    reviewNote,
  );

  await createAuditLog({
    adminId: admin.id,
    action: "REPORT_REJECTED",
    targetType: "REPORT",
    targetId: reportId,
    description: reviewNote.trim() || "Bỏ qua báo cáo.",
    metadata: {
      reportTargetType: report.targetType,
      reportTargetId: report.targetId,
      reviewNote: reviewNote.trim() || null,
    },
  });

  revalidateReports();
}