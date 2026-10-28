import "server-only";
import { prisma } from "@/server/db/client";

export async function listAdminReports() {
  return prisma.citation.findMany({
    where: { negativeSignalType: { not: null } },
    select: {
      id: true, negativeSignalType: true, negativeSignalNote: true, negativeSignalAt: true, createdAt: true,
      plan: { select: { id: true, name: true } },
      citerUser: { select: { id: true, name: true, email: true } },
      locationTag: { select: { id: true, title: true } },
      place: { select: { id: true, name: true } },
    },
    orderBy: { negativeSignalAt: "desc" },
    take: 50,
  });
}