import type { CollaboratorRole } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { findCollaboratorByTripAndUser } from "@/server/repositories/collaborator.repository";
import {
  createTripInvitation,
  findPendingInvitationsByEmail,
  findTripInvitationById,
  findTripInvitationByTripAndEmail,
  findTripInvitationsByTrip,
  reopenTripInvitation,
  updateTripInvitationStatus,
} from "@/server/repositories/trip-invitation.repository";
import { assertTripOwner } from "@/server/services/permission.service";

export class InvitationError extends Error {
  constructor(
    public code:
      | "INVALID_EMAIL"
      | "INVALID_ROLE"
      | "CANNOT_INVITE_SELF"
      | "ALREADY_COLLABORATOR"
      | "ALREADY_PENDING"
      | "ALREADY_ACCEPTED"
      | "INVITATION_NOT_FOUND"
      | "INVITATION_NOT_PENDING"
      | "INVITATION_EMAIL_MISMATCH"
      | "USER_NOT_FOUND",
  ) {
    super(code);
    this.name = "InvitationError";
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getUserEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) throw new InvitationError("USER_NOT_FOUND");
  return normalizeEmail(user.email);
}

async function getInvitationForUser(invitationId: string, userId: string) {
  const invitation = await findTripInvitationById(invitationId);
  if (!invitation) throw new InvitationError("INVITATION_NOT_FOUND");
  if (invitation.status !== "PENDING") throw new InvitationError("INVITATION_NOT_PENDING");

  const userEmail = await getUserEmail(userId);
  if (normalizeEmail(invitation.email) !== userEmail) {
    throw new InvitationError("INVITATION_EMAIL_MISMATCH");
  }

  return invitation;
}

export async function inviteToTrip(
  tripId: string,
  inviterId: string,
  input: { email: string; role: CollaboratorRole },
) {
  await assertTripOwner(tripId, inviterId);

  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) throw new InvitationError("INVALID_EMAIL");
  if (input.role !== "EDITOR" && input.role !== "VIEWER") {
    throw new InvitationError("INVALID_ROLE");
  }

  const inviterEmail = await getUserEmail(inviterId);
  if (inviterEmail === email) throw new InvitationError("CANNOT_INVITE_SELF");

  const invitedUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });

  if (invitedUser) {
    const collaborator = await findCollaboratorByTripAndUser(tripId, invitedUser.id);
    if (collaborator) throw new InvitationError("ALREADY_COLLABORATOR");
  }

  const existingInvitation = await findTripInvitationByTripAndEmail(tripId, email);

  if (existingInvitation) {
    if (existingInvitation.status === "PENDING") {
      throw new InvitationError("ALREADY_PENDING");
    }

    if (existingInvitation.status === "ACCEPTED") {
      throw new InvitationError("ALREADY_ACCEPTED");
    }

    return reopenTripInvitation(existingInvitation.id, {
      role: input.role,
      invitedById: inviterId,
    });
  }

  return createTripInvitation({
    tripId,
    email,
    role: input.role,
    invitedById: inviterId,
  });
}

export async function listTripInvitations(tripId: string, requesterId: string) {
  await assertTripOwner(tripId, requesterId);
  return findTripInvitationsByTrip(tripId);
}

export async function listMyPendingInvitations(userId: string) {
  const email = await getUserEmail(userId);
  return findPendingInvitationsByEmail(email);
}

export async function acceptTripInvitation(invitationId: string, userId: string) {
  const invitation = await getInvitationForUser(invitationId, userId);

  const existingCollaborator = await findCollaboratorByTripAndUser(
    invitation.tripId,
    userId,
  );

  if (existingCollaborator) {
    await updateTripInvitationStatus(invitation.id, "ACCEPTED");
    return existingCollaborator;
  }

  return prisma.$transaction(async (tx) => {
    const collaborator = await tx.collaborator.create({
      data: {
        planId: invitation.tripId,
        userId,
        role: invitation.role,
        invitedById: invitation.invitedById,
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

    await tx.tripInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });

    return collaborator;
  });
}

export async function declineTripInvitation(invitationId: string, userId: string) {
  const invitation = await getInvitationForUser(invitationId, userId);
  return updateTripInvitationStatus(invitation.id, "DECLINED");
}