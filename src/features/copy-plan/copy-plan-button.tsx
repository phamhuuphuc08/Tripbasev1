"use client";

import { useActionState } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import {
  copyPlanAction,
  copyPlanDayAction,
  type CopyPlanActionState,
} from "@/features/copy-plan/actions";

const initialState: CopyPlanActionState = {};

function getErrorKey(
  error: CopyPlanActionState["error"],
) {
  switch (error) {
    case "PLAN_NOT_FOUND":
      return "errors.notFound";

    case "PLAN_NOT_PUBLIC":
      return "errors.notAllowed";

    case "DAY_NOT_FOUND":
      return "errors.dayEmpty";

    case "COPY_FAILED":
      return "errors.failed";

    default:
      return null;
  }
}

/**
 * Sao chép toàn bộ kế hoạch.
 */
export function CopyPlanButton({
  tripId,
}: {
  tripId: string;
}) {
  const t =
    useTranslations(
      "copyPlan",
    );

  const action = copyPlanAction.bind(
    null,
    tripId,
  );

  const [state, formAction, pending] =
    useActionState(
      action,
      initialState,
    );

  const errorKey =
    getErrorKey(state.error);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={pending}
          className="gap-2"
        >
          <Copy className="size-4" />

          {pending
            ? t("copying")
            : t("copyPlan")}
        </Button>
      </form>

      {errorKey && (
        <p
          role="alert"
          className="text-destructive text-sm"
        >
          {t(errorKey)}
        </p>
      )}
    </div>
  );
}

/**
 * Sao chép riêng một ngày.
 */
export function CopyPlanDayButton({
  tripId,
  day,
}: {
  tripId: string;
  day: number;
}) {
  const t =
    useTranslations(
      "copyPlan",
    );

  const action = copyPlanDayAction.bind(
    null,
    tripId,
    day,
  );

  const [state, formAction, pending] =
    useActionState(
      action,
      initialState,
    );

  const errorKey =
    getErrorKey(state.error);

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="gap-1.5"
        >
          <Copy className="size-3.5" />

          {pending
            ? t("copying")
            : t(
                "copyDay",
                {
                  day,
                },
              )}
        </Button>
      </form>

      {errorKey && (
        <p
          role="alert"
          className="text-destructive text-xs"
        >
          {t(errorKey)}
        </p>
      )}
    </div>
  );
}
