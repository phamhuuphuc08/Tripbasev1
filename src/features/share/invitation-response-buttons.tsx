"use client";

import {
  Check,
  X,
} from "lucide-react";
import {
  useActionState,
} from "react";
import {
  useTranslations,
} from "next-intl";

import {
  Button,
} from "@/components/ui/button";

import {
  acceptInvitationAction,
  declineInvitationAction,
  type InvitationResponseError,
  type InvitationResponseState,
} from "@/features/share/actions";

const initialState: InvitationResponseState = {};

const ERROR_KEYS = {
  LOGIN_REQUIRED: "errors.loginRequired",
  INVITATION_NOT_FOUND: "errors.notFound",
  INVITATION_NOT_PENDING: "errors.notPending",
  INVITATION_EMAIL_MISMATCH: "errors.emailMismatch",
  USER_NOT_FOUND: "errors.userNotFound",
  RESPONSE_FAILED: "errors.responseFailed",
} as const satisfies Record<
  InvitationResponseError,
  string
>;

export function InvitationResponseButtons({
  invitationId,
  tripId,
}: {
  invitationId: string;
  tripId: string;
}) {
  const t =
    useTranslations(
      "share.invitations",
    );

  const [
    acceptState,
    acceptAction,
    acceptPending,
  ] = useActionState(
    acceptInvitationAction.bind(
      null,
      invitationId,
      tripId,
    ),
    initialState,
  );

  const [
    declineState,
    declineAction,
    declinePending,
  ] = useActionState(
    declineInvitationAction.bind(
      null,
      invitationId,
    ),
    initialState,
  );

  const pending =
    acceptPending ||
    declinePending;

  const error =
    acceptState.error ??
    declineState.error;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="border-destructive/20 bg-destructive/5 rounded-xl border px-3 py-2.5"
        >
          <p className="text-destructive text-sm">
            {t(
              ERROR_KEYS[
                error
              ],
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <form
          action={declineAction}
          className="w-full"
        >
          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="h-11 w-full rounded-xl"
          >
            <X className="size-4" />

            {declinePending
              ? t(
                  "declinePending",
                )
              : t("decline")}
          </Button>
        </form>

        <form
          action={acceptAction}
          className="w-full"
        >
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl shadow-sm"
          >
            <Check className="size-4" />

            {acceptPending
              ? t(
                  "acceptPending",
                )
              : t("accept")}
          </Button>
        </form>
      </div>
    </div>
  );
}