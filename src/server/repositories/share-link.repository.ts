import type { ShareLinkType } from "@prisma/client";
import { prisma } from "@/server/db/client";

export function findShareLinkById(id: string) {
  return prisma.shareLink.findUnique({
    where: { id },
  });
}

export function findShareLinkByToken(token: string) {
  return prisma.shareLink.findUnique({
    where: { token },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          destination: true,
          ownerId: true,
          visibility: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export function findShareLinksByTrip(tripId: string) {
  return prisma.shareLink.findMany({
    where: {
      planId: tripId,
    },
    select: {
      id: true,
      planId: true,
      token: true,
      type: true,
      createdById: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
}

export function createShareLink(data: {
  tripId: string;
  token: string;
  type: ShareLinkType;
  createdById: string;
  expiresAt: Date | null;
}) {
  return prisma.shareLink.create({
    data: {
      planId: data.tripId,
      token: data.token,
      type: data.type,
      createdById: data.createdById,
      expiresAt: data.expiresAt,
    },
  });
}

export function revokeShareLink(id: string) {
  return prisma.shareLink.update({
    where: { id },
    data: {
      revokedAt: new Date(),
    },
  });
}