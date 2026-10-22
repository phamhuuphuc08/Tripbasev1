"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { changeCollaboratorRole, CollaboratorError, removeTripCollaborator } from "@/server/services/collaborator.service";
import { acceptTripInvitation, declineTripInvitation, InvitationError, inviteToTrip } from "@/server/services/invitation.service";
import { PermissionError } from "@/server/services/permission.service";
import { createTripShareLink, revokeTripShareLink, ShareLinkError } from "@/server/services/share-link.service";

export type InviteActionError =
  | "LOGIN_REQUIRED" | "INVALID_EMAIL" | "INVALID_ROLE" | "CANNOT_INVITE_SELF"
  | "ALREADY_COLLABORATOR" | "ALREADY_PENDING" | "ALREADY_ACCEPTED"
  | "TRIP_NOT_FOUND" | "FORBIDDEN" | "INVITE_FAILED";

export interface InviteFormState {
  success?: boolean;
  invitedEmail?: string;
  error?: InviteActionError;
}

export type InvitationResponseError =
  | "LOGIN_REQUIRED" | "INVITATION_NOT_FOUND" | "INVITATION_NOT_PENDING"
  | "INVITATION_EMAIL_MISMATCH" | "USER_NOT_FOUND" | "RESPONSE_FAILED";

export interface InvitationResponseState {
  error?: InvitationResponseError;
}

export type CollaboratorActionError =
  | "LOGIN_REQUIRED" | "INVALID_ROLE" | "TRIP_NOT_FOUND"
  | "FORBIDDEN" | "COLLABORATOR_NOT_FOUND" | "MANAGE_FAILED";

export interface CollaboratorActionState {
  success?: boolean;
  error?: CollaboratorActionError;
}

export type ShareLinkActionError =
  | "LOGIN_REQUIRED" | "INVALID_TYPE" | "INVALID_EXPIRY"
  | "TRIP_NOT_FOUND" | "FORBIDDEN" | "NOT_FOUND" | "SAVE_FAILED";

export interface ShareLinkActionState {
  success?: boolean;
  error?: ShareLinkActionError;
}

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

const collaboratorRoleSchema = z.enum(["EDITOR", "VIEWER"]);
const shareLinkTypeSchema = z.enum(["VIEW", "EDIT"]);

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

function mapResponseError(code: InvitationError["code"]): InvitationResponseError {
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

function mapCollaboratorError(code: CollaboratorError["code"]): CollaboratorActionError {
  switch (code) {
    case "INVALID_ROLE":
    case "TRIP_NOT_FOUND":
    case "FORBIDDEN":
    case "COLLABORATOR_NOT_FOUND":
      return code;
    default:
      return "MANAGE_FAILED";
  }
}

function mapShareLinkError(code: ShareLinkError["code"]): ShareLinkActionError {
  switch (code) {
    case "INVALID_TYPE":
    case "INVALID_EXPIRY":
    case "TRIP_NOT_FOUND":
    case "FORBIDDEN":
    case "NOT_FOUND":
      return code;
    default:
      return "SAVE_FAILED";
  }
}

function getShareLinkExpiry(value: FormDataEntryValue | null): Date | null {
  if (value == null || value === "" || value === "NEVER") return null;
  if (typeof value !== "string") throw new ShareLinkError("INVALID_EXPIRY");

  const now = Date.now();

  switch (value) {
    case "1_DAY":
      return new Date(now + 24 * 60 * 60 * 1000);
    case "7_DAYS":
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    case "30_DAYS":
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
    default:
      throw new ShareLinkError("INVALID_EXPIRY");
  }
}

export async function inviteToTripAction(
  tripId: string,
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const email = formData.get("email")?.toString().trim();
    if (!email || !z.string().email().safeParse(email).success) return { error: "INVALID_EMAIL" };
    return { error: "INVALID_ROLE" };
  }

  try {
    await inviteToTrip(tripId, session.userId, {
      email: parsed.data.email,
      role: parsed.data.role,
    });

    return { success: true, invitedEmail: parsed.data.email };
  } catch (error) {
    if (error instanceof InvitationError) return { error: mapInviteError(error.code) };
    if (error instanceof PermissionError) return { error: error.code };

    console.error("Failed to invite user to trip:", error);
    return { error: "INVITE_FAILED" };
  }
}

export async function acceptInvitationAction(
  invitationId: string,
  tripId: string,
  _prevState: InvitationResponseState,
  _formData: FormData,
): Promise<InvitationResponseState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  try {
    await acceptTripInvitation(invitationId, session.userId);
  } catch (error) {
    if (error instanceof InvitationError) return { error: mapResponseError(error.code) };

    console.error("Failed to accept trip invitation:", error);
    return { error: "RESPONSE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function declineInvitationAction(
  invitationId: string,
  _prevState: InvitationResponseState,
  _formData: FormData,
): Promise<InvitationResponseState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  try {
    await declineTripInvitation(invitationId, session.userId);
  } catch (error) {
    if (error instanceof InvitationError) return { error: mapResponseError(error.code) };

    console.error("Failed to decline trip invitation:", error);
    return { error: "RESPONSE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: "/invitations", locale });
}

export async function changeCollaboratorRoleAction(
  tripId: string,
  collaboratorUserId: string,
  _prevState: CollaboratorActionState,
  formData: FormData,
): Promise<CollaboratorActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = collaboratorRoleSchema.safeParse(formData.get("role"));
  if (!parsed.success) return { error: "INVALID_ROLE" };

  try {
    await changeCollaboratorRole(tripId, collaboratorUserId, session.userId, parsed.data);
  } catch (error) {
    if (error instanceof CollaboratorError) return { error: mapCollaboratorError(error.code) };

    console.error("Failed to change collaborator role:", error);
    return { error: "MANAGE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#share`, locale });
}

export async function removeCollaboratorAction(
  tripId: string,
  collaboratorUserId: string,
  _prevState: CollaboratorActionState,
  _formData: FormData,
): Promise<CollaboratorActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  try {
    await removeTripCollaborator(tripId, collaboratorUserId, session.userId);
  } catch (error) {
    if (error instanceof CollaboratorError) return { error: mapCollaboratorError(error.code) };

    console.error("Failed to remove collaborator:", error);
    return { error: "MANAGE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#share`, locale });
}

export async function createShareLinkAction(
  tripId: string,
  _prevState: ShareLinkActionState,
  formData: FormData,
): Promise<ShareLinkActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = shareLinkTypeSchema.safeParse(formData.get("type"));
  if (!parsed.success) return { error: "INVALID_TYPE" };

  try {
    const expiresAt = getShareLinkExpiry(formData.get("expiry"));

    await createTripShareLink(tripId, session.userId, {
      type: parsed.data,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof ShareLinkError) return { error: mapShareLinkError(error.code) };

    console.error("Failed to create share link:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#share`, locale });
}

export async function revokeShareLinkAction(
  tripId: string,
  shareLinkId: string,
  _prevState: ShareLinkActionState,
  _formData: FormData,
): Promise<ShareLinkActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  try {
    await revokeTripShareLink(tripId, shareLinkId, session.userId);
  } catch (error) {
    if (error instanceof ShareLinkError) return { error: mapShareLinkError(error.code) };

    console.error("Failed to revoke share link:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#share`, locale });
}