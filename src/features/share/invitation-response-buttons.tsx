"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
} as const satisfies Record<InvitationResponseError, string>;

export function InvitationResponseButtons({
  invitationId,
}: {
  invitationId: string;
}) {
  const t = useTranslations("share.invitations");

  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptInvitationAction.bind(null, invitationId),
    initialState,
  );

  const [declineState, declineAction, declinePending] = useActionState(
    declineInvitationAction.bind(null, invitationId),
    initialState,
  );

  const pending = acceptPending || declinePending;
  const error = acceptState.error ?? declineState.error;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(ERROR_KEYS[error])}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={acceptAction}>
          <Button type="submit" disabled={pending}>
            {acceptPending ? t("acceptPending") : t("accept")}
          </Button>
        </form>

        <form action={declineAction}>
          <Button type="submit" variant="outline" disabled={pending}>
            {declinePending ? t("declinePending") : t("decline")}
          </Button>
        </form>
      </div>
    </div>
  );
}