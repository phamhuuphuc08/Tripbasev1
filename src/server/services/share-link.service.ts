import { randomBytes } from "crypto";
import type { ShareLinkType } from "@prisma/client";
import {
  createShareLink,
  findShareLinkById,
  findShareLinkByToken,
  findShareLinksByTrip,
  revokeShareLink,
} from "@/server/repositories/share-link.repository";
import {
  assertTripOwner,
  PermissionError,
} from "@/server/services/permission.service";

export class ShareLinkError extends Error {
  constructor(
    public code:
      | "TRIP_NOT_FOUND"
      | "FORBIDDEN"
      | "INVALID_TYPE"
      | "INVALID_EXPIRY"
      | "NOT_FOUND"
      | "REVOKED"
      | "EXPIRED",
  ) {
    super(code);
    this.name = "ShareLinkError";
  }
}

function validateType(type: string): ShareLinkType {
  if (type !== "VIEW" && type !== "EDIT") {
    throw new ShareLinkError("INVALID_TYPE");
  }

  return type;
}

function validateExpiry(expiresAt: Date | null) {
  if (!expiresAt) return;

  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= Date.now()
  ) {
    throw new ShareLinkError("INVALID_EXPIRY");
  }
}

async function assertOwner(
  tripId: string,
  userId: string,
) {
  try {
    await assertTripOwner(tripId, userId);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") {
        throw new ShareLinkError("TRIP_NOT_FOUND");
      }

      throw new ShareLinkError("FORBIDDEN");
    }

    throw error;
  }
}

function generateShareToken() {
  return randomBytes(24).toString("hex");
}

export async function createTripShareLink(
  tripId: string,
  userId: string,
  input: {
    type: string;
    expiresAt?: Date | null;
  },
) {
  await assertOwner(tripId, userId);

  const type = validateType(input.type);
  const expiresAt = input.expiresAt ?? null;

  validateExpiry(expiresAt);

  return createShareLink({
    tripId,
    token: generateShareToken(),
    type,
    createdById: userId,
    expiresAt,
  });
}

export async function listTripShareLinks(
  tripId: string,
  userId: string,
) {
  await assertOwner(tripId, userId);

  return findShareLinksByTrip(tripId);
}

export async function revokeTripShareLink(
  tripId: string,
  shareLinkId: string,
  userId: string,
) {
  await assertOwner(tripId, userId);

  const shareLink =
    await findShareLinkById(shareLinkId);

  if (
    !shareLink ||
    shareLink.planId !== tripId
  ) {
    throw new ShareLinkError("NOT_FOUND");
  }

  if (shareLink.revokedAt) {
    return shareLink;
  }

  return revokeShareLink(shareLinkId);
}

export async function resolveShareLink(
  token: string,
) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new ShareLinkError("NOT_FOUND");
  }

  const shareLink =
    await findShareLinkByToken(normalizedToken);

  if (!shareLink) {
    throw new ShareLinkError("NOT_FOUND");
  }

  if (shareLink.revokedAt) {
    throw new ShareLinkError("REVOKED");
  }

  if (
    shareLink.expiresAt &&
    shareLink.expiresAt.getTime() <= Date.now()
  ) {
    throw new ShareLinkError("EXPIRED");
  }

  return shareLink;
}

export function shareLinkCanEdit(
  type: ShareLinkType,
) {
  return type === "EDIT";
}