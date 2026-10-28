import { prisma } from "@/server/db/client";

export async function getAdminDashboard() {
  const [
    userCount,
    tripCount,
    publicTripCount,
    tagCount,
    copyCount,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.trip.count(),

    prisma.trip.count({
      where: {
        visibility: "PUBLIC",
      },
    }),

    prisma.locationTag.count(),

    prisma.planCopy.count(),
  ]);

  return {
    userCount,
    tripCount,
    publicTripCount,
    tagCount,
    copyCount,
  };
}