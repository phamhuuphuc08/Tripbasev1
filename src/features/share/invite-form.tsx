"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteToTripAction,
  type InviteActionError,
  type InviteFormState,
} from "@/features/share/actions";

const initialState: InviteFormState = {};

const ERROR_KEYS = {
  LOGIN_REQUIRED: "errors.loginRequired",
  INVALID_EMAIL: "errors.invalidEmail",
  INVALID_ROLE: "errors.invalidRole",
  CANNOT_INVITE_SELF: "errors.cannotInviteSelf",
  ALREADY_COLLABORATOR: "errors.alreadyCollaborator",
  ALREADY_PENDING: "errors.alreadyPending",
  ALREADY_ACCEPTED: "errors.alreadyAccepted",
  TRIP_NOT_FOUND: "errors.tripNotFound",
  FORBIDDEN: "errors.forbidden",
  INVITE_FAILED: "errors.inviteFailed",
} as const satisfies Record<InviteActionError, string>;

export function InviteForm({
  tripId,
}: {
  tripId: string;
}) {
  const t = useTranslations("share.invite");

  const action = inviteToTripAction.bind(
    null,
    tripId,
  );

  const [state, formAction, pending] =
    useActionState(
      action,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">
          {t("emailLabel")}
        </Label>

        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t(
            "emailPlaceholder",
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">
          {t("roleLabel")}
        </Label>

        <Select
          name="role"
          defaultValue="VIEWER"
        >
          <SelectTrigger
            id="invite-role"
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="EDITOR">
              {t("roleEditor")}
            </SelectItem>

            <SelectItem value="VIEWER">
              {t("roleViewer")}
            </SelectItem>
          </SelectContent>
        </Select>

        <p className="text-muted-foreground text-xs">
          {t("roleHint")}
        </p>
      </div>

      {state.success &&
        state.invitedEmail && (
          <p
            role="status"
            className="text-sm text-green-600 dark:text-green-400"
          >
            {t("success", {
              email:
                state.invitedEmail,
            })}
          </p>
        )}

      {state.error && (
        <p
          role="alert"
          className="text-destructive text-sm"
        >
          {t(
            ERROR_KEYS[
              state.error
            ],
          )}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="self-start"
      >
        {pending
          ? t("submitPending")
          : t("submit")}
      </Button>
    </form>
  );
}