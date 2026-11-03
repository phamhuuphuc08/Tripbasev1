import "server-only";

import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export interface CreateAuditLogInput {
  adminId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      description: input.description?.trim() || null,
      metadata: input.metadata,
    },
  });
}

export async function listAuditLogs(query = "", action?: AuditAction) {
  const search = query.trim();

  return prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { targetType: { contains: search, mode: "insensitive" } },
              { targetId: { contains: search, mode: "insensitive" } },
              { admin: { name: { contains: search, mode: "insensitive" } } },
              { admin: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      description: true,
      metadata: true,
      createdAt: true,
      admin: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}