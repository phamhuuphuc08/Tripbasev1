import { prisma } from "@/server/db/client";
import type { TagCategory } from "@/features/tag-tip/categories";

export function searchLocationTags(
  filter: { query?: string; category?: TagCategory },
  take = 30,
) {
  return prisma.locationTag.findMany({
    where: {
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.query
        ? { title: { contains: filter.query, mode: "insensitive" } }
        : {}),
    },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: [{ citeTrustScore: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Ứng viên để chạy dedup match — giới hạn theo category, không theo từ khoá. */
export function findLocationTagsByCategory(category: TagCategory, take = 200) {
  return prisma.locationTag.findMany({
    where: { category },
    select: { id: true, title: true, citeTrustScore: true, ownerId: true },
    take,
  });
}

/** Danh sách gọn cho select box khi thêm địa điểm vào itinerary (M02). */
export function findAllLocationTagsForPicker(take = 300) {
  return prisma.locationTag.findMany({
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
    take,
  });
}

export function createLocationTag(data: {
  ownerId: string;
  title: string;
  category: TagCategory;
  content: string | null;
  latitude: number | null;
  longitude: number | null;
  possibleDuplicateOfId: string | null;
}) {
  return prisma.locationTag.create({ data });
}

/**
 * Contribution stats for a creator's profile card: how many tags they've
 * added, plus the sum of citeTrustScore across them — a simple, real signal
 * from existing data, not the weighted Cite Trust Score formula from mục 8
 * (that still needs the full Reputation Engine, M09).
 */
export async function getTagContributionStats(ownerId: string) {
  const [count, aggregate] = await Promise.all([
    prisma.locationTag.count({ where: { ownerId } }),
    prisma.locationTag.aggregate({
      where: { ownerId },
      _sum: { citeTrustScore: true },
    }),
  ]);
  return { count, trustPoints: aggregate._sum.citeTrustScore ?? 0 };
}
