"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  addChecklistItemAction,
  changeChecklistStatusAction,
  editChecklistItemAction,
  removeChecklistItemAction,
  type ChecklistActionError,
  type ChecklistActionState,
} from "@/features/checklist/actions";

type Assignee = {
  id: string;
  name: string;
};

type ChecklistItem = {
  id: string;
  title: string;
  dueDate: string | null;
  status: "PENDING" | "DONE";
  assignedTo: Assignee | null;
};

const initialState: ChecklistActionState = {};

const ERROR_KEYS = {
  LOGIN_REQUIRED: "errors.loginRequired",
  TITLE_REQUIRED: "errors.titleRequired",
  INVALID_ASSIGNEE: "errors.invalidAssignee",
  TRIP_NOT_FOUND: "errors.tripNotFound",
  NOT_FOUND: "errors.notFound",
  FORBIDDEN: "errors.forbidden",
  INVALID_STATUS: "errors.invalidStatus",
  SAVE_FAILED: "errors.saveFailed",
} as const satisfies Record<ChecklistActionError, string>;

function ChecklistRow({
  tripId,
  item,
  assignees,
  canEdit,
}: {
  tripId: string;
  item: ChecklistItem;
  assignees: Assignee[];
  canEdit: boolean;
}) {
  const t = useTranslations("checklist");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);

  const [editState, editAction, editPending] = useActionState(
    editChecklistItemAction.bind(null, tripId, item.id),
    initialState,
  );

  const nextStatus = item.status === "DONE" ? "PENDING" : "DONE";

  const [statusState, statusAction, statusPending] = useActionState(
    changeChecklistStatusAction.bind(null, tripId, item.id, nextStatus),
    initialState,
  );

  const [removeState, removeAction, removePending] = useActionState(
    removeChecklistItemAction.bind(null, tripId, item.id),
    initialState,
  );

  const error = editState.error ?? statusState.error ?? removeState.error;
  const pending = editPending || statusPending || removePending;

  const dueDateLabel = item.dueDate
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${item.dueDate}T00:00:00.000Z`))
    : null;

  return (
    <div className="rounded-lg border p-3">
      {editing && canEdit ? (
        <form action={editAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`title-${item.id}`} className="text-sm font-medium">
              {t("titleLabel")}
            </label>
            <input
              id={`title-${item.id}`}
              name="title"
              type="text"
              required
              defaultValue={item.title}
              disabled={pending}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`due-${item.id}`} className="text-sm font-medium">
                {t("dueDateLabel")}
              </label>
              <input
                id={`due-${item.id}`}
                name="dueDate"
                type="date"
                defaultValue={item.dueDate ?? ""}
                disabled={pending}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`assignee-${item.id}`} className="text-sm font-medium">
                {t("assigneeLabel")}
              </label>

              <select
                id={`assignee-${item.id}`}
                name="assignedToId"
                defaultValue={item.assignedTo?.id ?? ""}
                disabled={pending}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="">{t("unassigned")}</option>

                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {editPending ? t("saving") : t("save")}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              <X className="size-4" />
              {t("cancel")}
            </Button>
          </div>

          {editState.error && (
            <p role="alert" className="text-destructive text-sm">
              {t(ERROR_KEYS[editState.error])}
            </p>
          )}
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={
                item.status === "DONE"
                  ? "text-muted-foreground text-sm line-through"
                  : "text-sm font-medium"
              }
            >
              {item.title}
            </p>

            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {item.assignedTo && (
                <span>
                  {t("assignedTo", {
                    name: item.assignedTo.name,
                  })}
                </span>
              )}

              {dueDateLabel && (
                <span>
                  {t("dueDate", {
                    date: dueDateLabel,
                  })}
                </span>
              )}

              {!item.assignedTo && !dueDateLabel && <span>{t("noDetails")}</span>}
            </div>
          </div>

          {canEdit && (
            <div className="flex shrink-0 items-center gap-1">
              <form action={statusAction}>
                <Button
                  type="submit"
                  size="icon-sm"
                  variant="outline"
                  disabled={pending}
                  aria-label={
                    item.status === "DONE"
                      ? t("markPending")
                      : t("markDone")
                  }
                  title={
                    item.status === "DONE"
                      ? t("markPending")
                      : t("markDone")
                  }
                >
                  {item.status === "DONE" ? (
                    <RotateCcw className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </form>

              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={pending}
                onClick={() => setEditing(true)}
                aria-label={t("edit")}
                title={t("edit")}
              >
                <Pencil className="size-4" />
              </Button>

              <form action={removeAction}>
                <Button
                  type="submit"
                  size="icon-sm"
                  variant="destructive"
                  disabled={pending}
                  aria-label={t("remove")}
                  title={t("remove")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {!editing && error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {t(ERROR_KEYS[error])}
        </p>
      )}
    </div>
  );
}

export function ChecklistManager({
  tripId,
  items,
  assignees,
  canEdit,
}: {
  tripId: string;
  items: ChecklistItem[];
  assignees: Assignee[];
  canEdit: boolean;
}) {
  const t = useTranslations("checklist");

  const [addState, addAction, addPending] = useActionState(
    addChecklistItemAction.bind(null, tripId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-5">
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ChecklistRow
              key={item.id}
              tripId={tripId}
              item={item}
              assignees={assignees}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium">{t("addHeading")}</h3>

          <form action={addAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="checklist-title" className="text-sm font-medium">
                {t("titleLabel")}
              </label>

              <input
                id="checklist-title"
                name="title"
                type="text"
                required
                disabled={addPending}
                placeholder={t("titlePlaceholder")}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checklist-due-date" className="text-sm font-medium">
                  {t("dueDateLabel")}
                </label>

                <input
                  id="checklist-due-date"
                  name="dueDate"
                  type="date"
                  disabled={addPending}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="checklist-assignee" className="text-sm font-medium">
                  {t("assigneeLabel")}
                </label>

                <select
                  id="checklist-assignee"
                  name="assignedToId"
                  defaultValue=""
                  disabled={addPending}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                >
                  <option value="">{t("unassigned")}</option>

                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="self-start" disabled={addPending}>
              {addPending ? t("adding") : t("add")}
            </Button>

            {addState.error && (
              <p role="alert" className="text-destructive text-sm">
                {t(ERROR_KEYS[addState.error])}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}