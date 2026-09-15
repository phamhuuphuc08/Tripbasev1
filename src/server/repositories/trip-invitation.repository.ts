import type {
  CollaboratorRole,
  InvitationStatus,
} from "@prisma/client";
import { prisma } from "@/server/db/client";

export function findTripInvitationById(id: string) {
  return prisma.tripInvitation.findUnique({
    where: { id },
    include: {
      trip: {
        select: {
          id: true,
          name: true,
          destination: true,
          ownerId: true,
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

export function findTripInvitationByTripAndEmail(
  tripId: string,
  email: string,
) {
  return prisma.tripInvitation.findUnique({
    where: {
      tripId_email: {
        tripId,
        email,
      },
    },
    include: {
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

export function findTripInvitationsByTrip(tripId: string) {
  return prisma.tripInvitation.findMany({
    where: { tripId },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function findPendingInvitationsByEmail(email: string) {
  return prisma.tripInvitation.findMany({
    where: {
      email,
      status: "PENDING",
    },
    include: {
      trip: {
        select: {
          id: true,
          name: true,
          destination: true,
          ownerId: true,
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
      createdAt: "desc",
    },
  });
}

export function createTripInvitation(data: {
  tripId: string;
  email: string;
  role: CollaboratorRole;
  invitedById: string;
}) {
  return prisma.tripInvitation.create({
    data: {
      tripId: data.tripId,
      email: data.email,
      role: data.role,
      invitedById: data.invitedById,
      status: "PENDING",
    },
  });
}

export function updateTripInvitationRole(
  id: string,
  role: CollaboratorRole,
) {
  return prisma.tripInvitation.update({
    where: { id },
    data: { role },
  });
}

export function updateTripInvitationStatus(
  id: string,
  status: InvitationStatus,
) {
  return prisma.tripInvitation.update({
    where: { id },
    data: {
      status,
      respondedAt:
        status === "PENDING"
          ? null
          : new Date(),
    },
  });
}

export function reopenTripInvitation(
  id: string,
  data: {
    role: CollaboratorRole;
    invitedById: string;
  },
) {
  return prisma.tripInvitation.update({
    where: { id },
    data: {
      role: data.role,
      invitedById: data.invitedById,
      status: "PENDING",
      respondedAt: null,
    },
  });
}

export function deleteTripInvitation(id: string) {
  return prisma.tripInvitation.delete({
    where: { id },
  });
}