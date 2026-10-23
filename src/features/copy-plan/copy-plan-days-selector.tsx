"use client";

import {
  useActionState,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import {
  copyPlanDaysAction,
  type CopyPlanActionState,
} from "@/features/copy-plan/actions";

interface CopyPlanDaysSelectorProps {
  tripId: string;
  days: number[];
}

const initialState: CopyPlanActionState = {};

function getErrorKey(
  error: CopyPlanActionState["error"],
) {
  switch (error) {
    case "DAY_NOT_FOUND":
      return "errors.selectDay";

    case "PLAN_NOT_FOUND":
      return "errors.notFound";

    case "PLAN_NOT_PUBLIC":
      return "errors.notPublic";

    case "COPY_FAILED":
      return "errors.failed";

    default:
      return null;
  }
}

export function CopyPlanDaysSelector({
  tripId,
  days,
}: CopyPlanDaysSelectorProps) {
  const t =
    useTranslations(
      "copyPlan",
    );

  const [selectedDays, setSelectedDays] =
    useState<number[]>([]);

  const action =
    copyPlanDaysAction.bind(
      null,
      tripId,
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    initialState,
  );

  const errorKey =
    getErrorKey(state.error);

  function toggleDay(
    day: number,
    checked: boolean,
  ) {
    setSelectedDays((current) => {
      if (checked) {
        return [
          ...new Set([
            ...current,
            day,
          ]),
        ].sort((a, b) => a - b);
      }

      return current.filter(
        (value) => value !== day,
      );
    });
  }

  const selectedCount =
    selectedDays.length;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {t("multiDayHeading")}
        </p>

        <p className="text-muted-foreground text-xs">
          {t("multiDayDescription")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day) => {
          const checked =
            selectedDays.includes(day);

          return (
            <label
              key={day}
              className={[
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                checked
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted",
              ].join(" ")}
            >
              <input
                type="checkbox"
                name="days"
                value={day}
                checked={checked}
                onChange={(event) =>
                  toggleDay(
                    day,
                    event.target.checked,
                  )
                }
                className="size-4"
              />

              <span>
                {t(
                  "day",
                  {
                    day,
                  },
                )}
              </span>
            </label>
          );
        })}
      </div>

      {errorKey && (
        <p className="text-destructive text-sm">
          {t(errorKey)}
        </p>
      )}

      <button
        type="submit"
        disabled={
          selectedCount === 0 ||
          isPending
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 inline-flex h-9 w-fit items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
      >
        {isPending
          ? t("copying")
          : selectedCount > 0
            ? t(
                "copySelectedDays",
                {
                  count:
                    selectedCount,
                },
              )
            : t(
                "selectDaysToCopy",
              )}
      </button>
    </form>
  );
}