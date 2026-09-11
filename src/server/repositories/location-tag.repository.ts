import { prisma } from "@/server/db/client";
import type { TagCategory } from "@/features/tag-tip/categories";

export function searchLocationTags(
  filter: { query?: string; category?: TagCategory },
  take = 30,
) {
  return prisma.locationTag.findMany({
    where: {
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.query ? { title: { contains: filter.query, mode: "insensitive" } } : {}),
    },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: [{ citeTrustScore: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Lấy một LocationTag theo id. Dùng khi cần validate tag được chọn trong itinerary. */
export function findLocationTagById(id: string) {
  return prisma.locationTag.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      latitude: true,
      longitude: true,
      openingHours: true,
      citeTrustScore: true,
      possibleDuplicateOfId: true,
      ownerId: true,
    },
  });
}

/** Ứng viên để chạy rule-based dedup. */
export function findLocationTagsByCategory(category: TagCategory, take = 200) {
  return prisma.locationTag.findMany({
    where: { category },
    select: {
      id: true,
      title: true,
      category: true,
      latitude: true,
      longitude: true,
      openingHours: true,
      citeTrustScore: true,
      ownerId: true,
      possibleDuplicateOfId: true,
    },
    orderBy: [{ citeTrustScore: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Danh sách gọn cho picker khi thêm địa điểm vào itinerary. */
export function findAllLocationTagsForPicker(take = 300) {
  return prisma.locationTag.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      openingHours: true,
      latitude: true,
      longitude: true,
      citeTrustScore: true,
      possibleDuplicateOfId: true,
    },
    orderBy: [{ citeTrustScore: "desc" }, { title: "asc" }],
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
  openingHours: string | null;
  possibleDuplicateOfId: string | null;
}) {
  return prisma.locationTag.create({
    data,
    include: { owner: { select: { id: true, name: true } } },
  });
}

/**
 * Contribution stats cho creator profile.
 * Đây vẫn là thống kê đơn giản từ dữ liệu hiện có,
 * chưa phải công thức Reputation Engine M09.
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