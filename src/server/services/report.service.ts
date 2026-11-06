import "server-only";

import { ReportReason, ReportTargetType } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}) {
  if (input.targetType === "USER" && input.reporterId === input.targetId) {
    throw new Error("CANNOT_REPORT_SELF");
  }

  const existing = await prisma.report.findFirst({
    where: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      status: {
        in: ["PENDING", "REVIEWING"],
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("REPORT_ALREADY_EXISTS");
  }

  return prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description?.trim() || null,
    },
  });
}