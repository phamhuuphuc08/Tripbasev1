import "server-only";

import { prisma } from "@/server/db/client";

export async function listAdminUsers(query = "") {
  const search = query.trim();

  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
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
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAdminUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
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
          visibility: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      locationTags: {
        select: {
          id: true,
          title: true,
          approvalStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
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

export async function suspendUser(userId: string, suspendedUntil: Date, reason?: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      suspendedUntil,
      suspensionReason: reason?.trim() || null,
      sessionVersion: { increment: 1 },
    },
  });
}

export async function removeUserSuspension(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      suspendedUntil: null,
      suspensionReason: null,
    },
  });
}

export async function blockTripCreation(userId: string, blockedUntil: Date, reason?: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      tripCreateBlockedUntil: blockedUntil,
      tripBlockReason: reason?.trim() || null,
    },
  });
}

export async function removeTripCreationBlock(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      tripCreateBlockedUntil: null,
      tripBlockReason: null,
    },
  });
}

export async function blockTagCreation(userId: string, blockedUntil: Date, reason?: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      tagCreateBlockedUntil: blockedUntil,
      tagBlockReason: reason?.trim() || null,
    },
  });
}

export async function removeTagCreationBlock(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      tagCreateBlockedUntil: null,
      tagBlockReason: null,
    },
  });
}

export async function softDeleteUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      suspendedUntil: null,
      suspensionReason: null,
      tripCreateBlockedUntil: null,
      tripBlockReason: null,
      tagCreateBlockedUntil: null,
      tagBlockReason: null,
      sessionVersion: { increment: 1 },
    },
  });
}

export async function restoreUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null },
  });
}

export function isUserSuspended(suspendedUntil: Date | null) {
  return suspendedUntil !== null && suspendedUntil.getTime() > Date.now();
}

export function isTripCreationBlocked(blockedUntil: Date | null) {
  return blockedUntil !== null && blockedUntil.getTime() > Date.now();
}

export function isTagCreationBlocked(blockedUntil: Date | null) {
  return blockedUntil !== null && blockedUntil.getTime() > Date.now();
}