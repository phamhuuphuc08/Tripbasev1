import "server-only";
import { prisma } from "@/server/db/client";

export async function listAdminUsers(query = "") {
  const search = query.trim();
  return prisma.user.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
      : undefined,
    select: { id: true, name: true, email: true, createdAt: true, _count: { select: { trips: true, locationTags: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAdminUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, bio: true, image: true, travelStyle: true,
      budgetLevel: true, travelInterests: true, createdAt: true, updatedAt: true,
      trips: { select: { id: true, name: true, destination: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { trips: true, locationTags: true } },
    },
  });
}