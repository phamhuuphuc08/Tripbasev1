import "server-only";

import { prisma } from "@/server/db/client";

export async function assertCanCreateTrip(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      deletedAt: true,
      suspendedUntil: true,
      tripCreateBlockedUntil: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new Error("ACCOUNT_UNAVAILABLE");
  }

  const now = new Date();

  if (user.suspendedUntil && user.suspendedUntil > now) {
    throw new Error("ACCOUNT_SUSPENDED");
  }

  if (
    user.tripCreateBlockedUntil &&
    user.tripCreateBlockedUntil > now
  ) {
    throw new Error("TRIP_CREATE_SUSPENDED");
  }
}

export async function assertCanCreateTag(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      deletedAt: true,
      suspendedUntil: true,
      tagCreateBlockedUntil: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new Error("ACCOUNT_UNAVAILABLE");
  }

  const now = new Date();

  if (user.suspendedUntil && user.suspendedUntil > now) {
    throw new Error("ACCOUNT_SUSPENDED");
  }

  if (
    user.tagCreateBlockedUntil &&
    user.tagCreateBlockedUntil > now
  ) {
    throw new Error("TAG_CREATE_SUSPENDED");
  }
}