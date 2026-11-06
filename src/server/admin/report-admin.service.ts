import "server-only";

import { ReportStatus, ReportTargetType } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function listAdminReports(
  query = "",
  status?: ReportStatus,
  targetType?: ReportTargetType,
) {
  const search = query.trim();

  return prisma.report.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(targetType ? { targetType } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { targetId: { contains: search, mode: "insensitive" } },
              { reporter: { name: { contains: search, mode: "insensitive" } } },
              { reporter: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      description: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    take: 100,
  });
}

export async function getAdminReport(reportId: string) {
  return prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      description: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminId: string,
  reviewNote = "",
) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      reviewedById: adminId,
      reviewNote: reviewNote.trim() || null,
      reviewedAt:
        status === "RESOLVED" || status === "REJECTED"
          ? new Date()
          : null,
    },
  });
}

export async function getAdminReportStats() {
  const [
    total,
    pending,
    reviewing,
    resolved,
    rejected,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "REVIEWING" } }),
    prisma.report.count({ where: { status: "RESOLVED" } }),
    prisma.report.count({ where: { status: "REJECTED" } }),
  ]);

  return {
    total,
    pending,
    reviewing,
    resolved,
    rejected,
  };
}