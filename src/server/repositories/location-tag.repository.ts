import { prisma } from "@/server/db/client";
import type { TagCategory } from "@/features/tag-tip/categories";

export function searchLocationTags(
  filter: {
    query?: string;
    category?: TagCategory;
  },
  take = 30,
) {
  return prisma.locationTag.findMany({
    where: {
      approvalStatus: "APPROVED",

      ...(filter.category
        ? {
            category: filter.category,
          }
        : {}),

      ...(filter.query
        ? {
            title: {
              contains: filter.query,
              mode: "insensitive",
            },
          }
        : {}),
    },

    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: [
      {
        citeTrustScore: "desc",
      },
      {
        createdAt: "desc",
      },
    ],

    take,
  });
}

/**
 * Lấy một LocationTag theo id.
 *
 * Lưu ý:
 * Hàm này chưa lọc APPROVED vì còn được dùng để validate tag
 * đã tồn tại trong itinerary.
 */
export function findLocationTagById(
  id: string,
) {
  return prisma.locationTag.findUnique({
    where: {
      id,
    },

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
      approvalStatus: true,
      reviewNote: true,
      reviewedAt: true,
      ownerId: true,
      createdAt: true,

      owner: {
        select: {
          id: true,
          name: true,
        },
      },

      _count: {
        select: {
          itineraryItems: true,
          citations: true,
        },
      },
    },
  });
}

/**
 * Ứng viên để chạy rule-based dedup.
 *
 * APPROVED:
 * - đã được công khai
 * - phải dùng để kiểm tra trùng
 *
 * PENDING:
 * - chưa công khai
 * - vẫn dùng để ngăn người khác gửi lại cùng địa điểm
 *
 * REJECTED:
 * - không dùng để kiểm tra trùng
 */
export function findLocationTagsByCategory(
  category: TagCategory,
  take = 200,
) {
  return prisma.locationTag.findMany({
    where: {
      category,

      approvalStatus: {
        in: [
          "PENDING",
          "APPROVED",
        ],
      },
    },

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
      approvalStatus: true,
    },

    orderBy: [
      {
        citeTrustScore: "desc",
      },
      {
        createdAt: "desc",
      },
    ],

    take,
  });
}

/**
 * Danh sách gọn cho picker khi thêm địa điểm vào itinerary.
 *
 * Chỉ cho phép chọn những địa điểm đã được Admin duyệt.
 */
export function findAllLocationTagsForPicker(
  take = 300,
) {
  return prisma.locationTag.findMany({
    where: {
      approvalStatus: "APPROVED",
    },

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

    orderBy: [
      {
        citeTrustScore: "desc",
      },
      {
        title: "asc",
      },
    ],

    take,
  });
}

export function createLocationTag(
  data: {
    ownerId: string;
    title: string;
    category: TagCategory;
    content: string | null;
    latitude: number | null;
    longitude: number | null;
    openingHours: string | null;
    possibleDuplicateOfId: string | null;
    approvalStatus?:
      | "PENDING"
      | "APPROVED"
      | "REJECTED";
  },
) {
  return prisma.locationTag.create({
    data: {
      ownerId: data.ownerId,
      title: data.title,
      category: data.category,
      content: data.content,
      latitude: data.latitude,
      longitude: data.longitude,
      openingHours: data.openingHours,

      possibleDuplicateOfId:
        data.possibleDuplicateOfId,

      approvalStatus:
        data.approvalStatus ??
        "PENDING",
    },

    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Contribution stats cho creator profile.
 *
 * Chỉ tính những Tag đã được Admin duyệt.
 *
 * Đây vẫn là thống kê đơn giản từ dữ liệu hiện có,
 * chưa phải công thức Reputation Engine M09.
 */
export async function getTagContributionStats(
  ownerId: string,
) {
  const [count, aggregate] =
    await Promise.all([
      prisma.locationTag.count({
        where: {
          ownerId,
          approvalStatus:
            "APPROVED",
        },
      }),

      prisma.locationTag.aggregate({
        where: {
          ownerId,
          approvalStatus:
            "APPROVED",
        },

        _sum: {
          citeTrustScore: true,
        },
      }),
    ]);

  return {
    count,
    trustPoints:
      aggregate._sum
        .citeTrustScore ?? 0,
  };
}