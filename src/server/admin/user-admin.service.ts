import "server-only";

import { prisma } from "@/server/db/client";

/**
 * Danh sách tài khoản trong Admin.
 */
export async function listAdminUsers(
  query = "",
) {
  const search = query.trim();

  return prisma.user.findMany({
    where: {
      deletedAt: null,

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,

      suspendedUntil: true,
      suspensionReason: true,

      tripCreateBlockedUntil: true,
      tripBlockReason: true,

      tagCreateBlockedUntil: true,
      tagBlockReason: true,

      deletedAt: true,
      createdAt: true,

      _count: {
        select: {
          trips: true,
          locationTags: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 50,
  });
}

/**
 * Chi tiết một tài khoản cho trang:
 * /admin/users/[userId]
 */
export async function getAdminUser(
  userId: string,
) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,

      bio: true,
      image: true,
      travelStyle: true,
      budgetLevel: true,
      travelInterests: true,

      suspendedUntil: true,
      suspensionReason: true,

      tripCreateBlockedUntil: true,
      tripBlockReason: true,

      tagCreateBlockedUntil: true,
      tagBlockReason: true,

      deletedAt: true,

      createdAt: true,
      updatedAt: true,

      trips: {
        select: {
          id: true,
          name: true,
          destination: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 10,
      },

      _count: {
        select: {
          trips: true,
          locationTags: true,
        },
      },
    },
  });
}

/**
 * Đình chỉ toàn bộ tài khoản.
 */
export async function suspendUser(
  userId: string,
  suspendedUntil: Date,
  reason?: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      suspendedUntil,
      suspensionReason:
        reason?.trim() || null,
    },
  });
}

/**
 * Gỡ đình chỉ toàn bộ tài khoản.
 */
export async function removeUserSuspension(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      suspendedUntil: null,
      suspensionReason: null,
    },
  });
}

/**
 * Chặn quyền tạo Trip.
 *
 * User vẫn có thể đăng nhập và sử dụng các chức năng khác.
 */
export async function blockTripCreation(
  userId: string,
  blockedUntil: Date,
  reason?: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      tripCreateBlockedUntil:
        blockedUntil,

      tripBlockReason:
        reason?.trim() || null,
    },
  });
}

/**
 * Gỡ chặn tạo Trip.
 */
export async function removeTripCreationBlock(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      tripCreateBlockedUntil:
        null,

      tripBlockReason: null,
    },
  });
}

/**
 * Chặn quyền tạo Tag & Tip.
 *
 * User vẫn có thể đăng nhập và sử dụng các chức năng khác.
 */
export async function blockTagCreation(
  userId: string,
  blockedUntil: Date,
  reason?: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      tagCreateBlockedUntil:
        blockedUntil,

      tagBlockReason:
        reason?.trim() || null,
    },
  });
}

/**
 * Gỡ chặn tạo Tag & Tip.
 */
export async function removeTagCreationBlock(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      tagCreateBlockedUntil:
        null,

      tagBlockReason: null,
    },
  });
}

/**
 * Xóa mềm tài khoản.
 *
 * Không xóa record User khỏi database để tránh ảnh hưởng
 * tới Trip, Tag, Citation, Comment, Vote...
 */
export async function softDeleteUser(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      deletedAt: new Date(),

      suspendedUntil: null,
      suspensionReason: null,

      tripCreateBlockedUntil: null,
      tripBlockReason: null,

      tagCreateBlockedUntil: null,
      tagBlockReason: null,
    },
  });
}

/**
 * Khôi phục tài khoản đã xóa mềm.
 */
export async function restoreUser(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      deletedAt: null,
    },
  });
}

/**
 * Kiểm tra tài khoản hiện có đang bị đình chỉ hay không.
 */
export function isUserSuspended(
  suspendedUntil: Date | null,
) {
  return (
    suspendedUntil !== null &&
    suspendedUntil.getTime() >
      Date.now()
  );
}

/**
 * Kiểm tra quyền tạo Trip đang bị khóa.
 */
export function isTripCreationBlocked(
  blockedUntil: Date | null,
) {
  return (
    blockedUntil !== null &&
    blockedUntil.getTime() >
      Date.now()
  );
}

/**
 * Kiểm tra quyền tạo Tag đang bị khóa.
 */
export function isTagCreationBlocked(
  blockedUntil: Date | null,
) {
  return (
    blockedUntil !== null &&
    blockedUntil.getTime() >
      Date.now()
  );
}