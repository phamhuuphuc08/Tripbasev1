"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  acceptTripInvitation,
  declineTripInvitation,
  InvitationError,
  inviteToTrip,
} from "@/server/services/invitation.service";
import { PermissionError } from "@/server/services/permission.service";

export type InviteActionError =
  | "LOGIN_REQUIRED"
  | "INVALID_EMAIL"
  | "INVALID_ROLE"
  | "CANNOT_INVITE_SELF"
  | "ALREADY_COLLABORATOR"
  | "ALREADY_PENDING"
  | "ALREADY_ACCEPTED"
  | "TRIP_NOT_FOUND"
  | "FORBIDDEN"
  | "INVITE_FAILED";

export interface InviteFormState {
  success?: boolean;
  invitedEmail?: string;
  error?: InviteActionError;
}

export type InvitationResponseError =
  | "LOGIN_REQUIRED"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_NOT_PENDING"
  | "INVITATION_EMAIL_MISMATCH"
  | "USER_NOT_FOUND"
  | "RESPONSE_FAILED";

export interface InvitationResponseState {
  error?: InvitationResponseError;
}

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

function mapInviteError(code: InvitationError["code"]): InviteActionError {
  switch (code) {
    case "INVALID_EMAIL":
    case "INVALID_ROLE":
    case "CANNOT_INVITE_SELF":
    case "ALREADY_COLLABORATOR":
    case "ALREADY_PENDING":
    case "ALREADY_ACCEPTED":
      return code;

    default:
      return "INVITE_FAILED";
  }
}

function mapResponseError(
  code: InvitationError["code"],
): InvitationResponseError {
  switch (code) {
    case "INVITATION_NOT_FOUND":
    case "INVITATION_NOT_PENDING":
    case "INVITATION_EMAIL_MISMATCH":
    case "USER_NOT_FOUND":
      return code;

    default:
      return "RESPONSE_FAILED";
  }
}

export async function inviteToTripAction(
  tripId: string,
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const email = formData.get("email")?.toString().trim();

    if (!email || !z.string().email().safeParse(email).success) {
      return { error: "INVALID_EMAIL" };
    }

    return { error: "INVALID_ROLE" };
  }

  try {
    await inviteToTrip(tripId, session.userId, {
      email: parsed.data.email,
      role: parsed.data.role,
    });

    return {
      success: true,
      invitedEmail: parsed.data.email,
    };
  } catch (error) {
    if (error instanceof InvitationError) {
      return { error: mapInviteError(error.code) };
    }

    if (error instanceof PermissionError) {
      return { error: error.code };
    }

    console.error("Failed to invite user to trip:", error);
    return { error: "INVITE_FAILED" };
  }
}

export async function acceptInvitationAction(
  invitationId: string,
  _prevState: InvitationResponseState,
  _formData: FormData,
): Promise<InvitationResponseState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  try {
    await acceptTripInvitation(invitationId, session.userId);
  } catch (error) {
    if (error instanceof InvitationError) {
      return { error: mapResponseError(error.code) };
    }

    console.error("Failed to accept trip invitation:", error);
    return { error: "RESPONSE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: "/invitations",
    locale,
  });
}

export async function declineInvitationAction(
  invitationId: string,
  _prevState: InvitationResponseState,
  _formData: FormData,
): Promise<InvitationResponseState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  try {
    await declineTripInvitation(invitationId, session.userId);
  } catch (error) {
    if (error instanceof InvitationError) {
      return { error: mapResponseError(error.code) };
    }

    console.error("Failed to decline trip invitation:", error);
    return { error: "RESPONSE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: "/invitations",
    locale,
  });
}