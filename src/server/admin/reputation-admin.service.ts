import "server-only";
import { prisma } from "@/server/db/client";

export async function listAdminReputation() {
  const [creators, plans] = await Promise.all([
    prisma.creatorReputation.findMany({
      select: { userId: true, copyplanScore: true, totalPlans: true, totalCopies: true, lastUpdated: true, user: { select: { name: true, email: true } } },
      orderBy: { copyplanScore: "desc" },
      take: 50,
    }),
    prisma.planReputation.findMany({
      select: { planId: true, copyplanScore: true, eligibleCopyCount: true, lastUpdated: true, plan: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { copyplanScore: "desc" },
      take: 10,
    }),
  ]);
  return { creators, plans };
}