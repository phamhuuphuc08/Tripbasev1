import { prisma } from "@/server/db/client";

export function findTravelerById(id: string) {
  return prisma.traveler.findUnique({ where: { id } });
}

export function createTraveler(data: {
  tripId: string;
  name: string;
  ageGroup: string | null;
}) {
  return prisma.traveler.create({ data });
}

export function deleteTraveler(id: string) {
  return prisma.traveler.delete({ where: { id } });
}
