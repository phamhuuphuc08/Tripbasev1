import type { CollaboratorRole } from "@prisma/client";
import {
  deleteCollaborator,
  findCollaboratorByTripAndUser,
  findCollaboratorsByTrip,
  updateCollaboratorRole,
} from "@/server/repositories/collaborator.repository";
import { assertTripOwner, PermissionError } from "@/server/services/permission.service";
import {
  deleteTripInvitation,
  findTripInvitationByTripAndEmail,
} from "@/server/repositories/trip-invitation.repository";

export class CollaboratorError extends Error {
  constructor(
    public code:
      | "TRIP_NOT_FOUND"
      | "FORBIDDEN"
      | "COLLABORATOR_NOT_FOUND"
      | "INVALID_ROLE",
  ) {
    super(code);
    this.name = "CollaboratorError";
  }
}

function validateRole(role: CollaboratorRole) {
  if (role !== "EDITOR" && role !== "VIEWER") {
    throw new CollaboratorError("INVALID_ROLE");
  }
}

async function assertOwner(tripId: string, userId: string) {
  try {
    return await assertTripOwner(tripId, userId);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") {
        throw new CollaboratorError("TRIP_NOT_FOUND");
      }

      throw new CollaboratorError("FORBIDDEN");
    }

    throw error;
  }
}

export async function listTripCollaborators(tripId: string, requesterId: string) {
  await assertOwner(tripId, requesterId);
  return findCollaboratorsByTrip(tripId);
}

export async function changeCollaboratorRole(
  tripId: string,
  collaboratorUserId: string,
  requesterId: string,
  role: CollaboratorRole,
) {
  await assertOwner(tripId, requesterId);
  validateRole(role);

  const collaborator = await findCollaboratorByTripAndUser(
    tripId,
    collaboratorUserId,
  );

  if (!collaborator) {
    throw new CollaboratorError("COLLABORATOR_NOT_FOUND");
  }

  if (collaborator.role === role) {
    return collaborator;
  }

  return updateCollaboratorRole(
    tripId,
    collaboratorUserId,
    role,
  );
}

export async function removeTripCollaborator(
  tripId: string,
  collaboratorUserId: string,
  requesterId: string,
) {
  await assertOwner(tripId, requesterId);

  const collaborator = await findCollaboratorByTripAndUser(
    tripId,
    collaboratorUserId,
  );

  if (!collaborator) {
    throw new CollaboratorError("COLLABORATOR_NOT_FOUND");
  }

  const invitation =
    await findTripInvitationByTripAndEmail(
      tripId,
      collaborator.user.email,
    );

  await deleteCollaborator(
    tripId,
    collaboratorUserId,
  );

  if (invitation) {
    await deleteTripInvitation(invitation.id);
  }
}