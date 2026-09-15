import type { CollaboratorRole } from "@prisma/client";
import { prisma } from "@/server/db/client";

export function findCollaboratorByTripAndUser(
  tripId: string,
  userId: string,
) {
  return prisma.collaborator.findUnique({
    where: {
      planId_userId: {
        planId: tripId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export function findCollaboratorsByTrip(tripId: string) {
  return prisma.collaborator.findMany({
    where: {
      planId: tripId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      invitedAt: "asc",
    },
  });
}

export function createCollaborator(data: {
  tripId: string;
  userId: string;
  role: CollaboratorRole;
  invitedById: string;
}) {
  return prisma.collaborator.create({
    data: {
      planId: data.tripId,
      userId: data.userId,
      role: data.role,
      invitedById: data.invitedById,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

export function updateCollaboratorRole(
  tripId: string,
  userId: string,
  role: CollaboratorRole,
) {
  return prisma.collaborator.update({
    where: {
      planId_userId: {
        planId: tripId,
        userId,
      },
    },
    data: {
      role,
    },
  });
}

export function deleteCollaborator(
  tripId: string,
  userId: string,
) {
  return prisma.collaborator.delete({
    where: {
      planId_userId: {
        planId: tripId,
        userId,
      },
    },
  });
}

export function deleteCollaboratorsByTrip(tripId: string) {
  return prisma.collaborator.deleteMany({
    where: {
      planId: tripId,
    },
  });
}