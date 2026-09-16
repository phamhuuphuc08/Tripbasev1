"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  changeCollaboratorRoleAction,
  removeCollaboratorAction,
  type CollaboratorActionError,
  type CollaboratorActionState,
} from "@/features/share/actions";

type CollaboratorItem = {
  userId: string;
  role: "EDITOR" | "VIEWER";
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

const initialState: CollaboratorActionState = {};

const ERROR_KEYS = {
  LOGIN_REQUIRED: "errors.loginRequired",
  INVALID_ROLE: "errors.invalidRole",
  TRIP_NOT_FOUND: "errors.tripNotFound",
  FORBIDDEN: "errors.forbidden",
  COLLABORATOR_NOT_FOUND: "errors.notFound",
  MANAGE_FAILED: "errors.manageFailed",
} as const satisfies Record<CollaboratorActionError, string>;

function CollaboratorRow({
  tripId,
  collaborator,
}: {
  tripId: string;
  collaborator: CollaboratorItem;
}) {
  const t = useTranslations("share.members");

  const [roleState, roleAction, rolePending] = useActionState(
    changeCollaboratorRoleAction.bind(null, tripId, collaborator.userId),
    initialState,
  );

  const [removeState, removeAction, removePending] = useActionState(
    removeCollaboratorAction.bind(null, tripId, collaborator.userId),
    initialState,
  );

  const error = roleState.error ?? removeState.error;
  const pending = rolePending || removePending;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{collaborator.user.name}</p>
          <p className="text-muted-foreground truncate text-xs">{collaborator.user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={roleAction} className="flex items-center gap-2">
            <select
              name="role"
              defaultValue={collaborator.role}
              disabled={pending}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              <option value="EDITOR">{t("roleEditor")}</option>
              <option value="VIEWER">{t("roleViewer")}</option>
            </select>

            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {rolePending ? t("saving") : t("saveRole")}
            </Button>
          </form>

          <form action={removeAction}>
            <Button type="submit" size="sm" variant="destructive" disabled={pending}>
              {removePending ? t("removing") : t("remove")}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(ERROR_KEYS[error])}
        </p>
      )}
    </div>
  );
}

export function CollaboratorManager({
  tripId,
  collaborators,
}: {
  tripId: string;
  collaborators: CollaboratorItem[];
}) {
  const t = useTranslations("share.members");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">{t("heading")}</h3>
        <p className="text-muted-foreground mt-1 text-xs">{t("description")}</p>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {collaborators.map((collaborator) => (
            <CollaboratorRow
              key={collaborator.userId}
              tripId={tripId}
              collaborator={collaborator}
            />
          ))}
        </div>
      )}
    </div>
  );
}