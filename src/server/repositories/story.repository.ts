import { prisma } from "@/server/db/client";

export function findStorySlidesByTrip(tripId: string) {
  return prisma.storySlide.findMany({
    where: { tripId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export function countStorySlidesByTrip(tripId: string) {
  return prisma.storySlide.count({ where: { tripId } });
}

export function findStorySlideById(id: string) {
  return prisma.storySlide.findUnique({ where: { id } });
}

export function createStorySlide(data: {
  tripId: string;
  day: number | null;
  caption: string;
  theme: string;
  photo: string | null;
  sortOrder: number;
}) {
  return prisma.storySlide.create({ data });
}

export function deleteStorySlide(id: string) {
  return prisma.storySlide.delete({ where: { id } });
}
