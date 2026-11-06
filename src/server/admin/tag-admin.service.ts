import "server-only";

import { TagApprovalStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function listAdminTags(query = "", status?: TagApprovalStatus) {
  const search = query.trim();

  return prisma.locationTag.findMany({
    where: {
      ...(status ? { approvalStatus: status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { owner: { name: { contains: search, mode: "insensitive" } } },
              { owner: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      category: true,
      citeTrustScore: true,
      approvalStatus: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          citations: true,
          itineraryItems: true,
        },
      },
    },
    orderBy: [
      { approvalStatus: "asc" },
      { createdAt: "desc" },
    ],
    take: 100,
  });
}

export async function getAdminTag(tagId: string) {
  return prisma.locationTag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      latitude: true,
      longitude: true,
      openingHours: true,
      citeTrustScore: true,
      approvalStatus: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          citations: true,
          itineraryItems: true,
        },
      },
    },
  });
}

export async function approveAdminTag(tagId: string) {
  return prisma.locationTag.update({
    where: { id: tagId },
    data: {
      approvalStatus: "APPROVED",
      reviewedAt: new Date(),
      reviewNote: null,
    },
  });
}

export async function rejectAdminTag(tagId: string, reviewNote?: string) {
  return prisma.locationTag.update({
    where: { id: tagId },
    data: {
      approvalStatus: "REJECTED",
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || null,
    },
  });
}