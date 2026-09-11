"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAG_CATEGORIES, type TagCategory } from "@/features/tag-tip/categories";
import { createTagAction, type CreateTagFormState } from "@/features/tag-tip/actions";

const initialState: CreateTagFormState = { attempt: 0 };

export function CreateTagForm({ initialTitle }: { initialTitle?: string }) {
  const t = useTranslations("tagTip.form");
  const tCategory = useTranslations("tagCategory");
  const [state, formAction, pending] = useActionState(createTagAction, initialState);

  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-title">{t("titleLabel")}</Label>
        <Input
          id="tag-title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          defaultValue={state.submitted?.title ?? (state.attempt === 0 ? initialTitle : undefined)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-category">{t("categoryLabel")}</Label>

        <Select name="category" defaultValue={state.submitted?.category ?? "RESTAURANT"}>
          <SelectTrigger id="tag-category" className="w-full">
            <SelectValue>
              {(value: TagCategory | null) => value ? tCategory(value) : null}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {TAG_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>{tCategory(category)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-content">{t("contentLabel")}</Label>
        <Input
          id="tag-content"
          name="content"
          placeholder={t("contentPlaceholder")}
          defaultValue={state.submitted?.content}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-opening-time">{t("openingTimeLabel")}</Label>
          <Input
            id="tag-opening-time"
            name="openingTime"
            type="time"
            defaultValue={state.submitted?.openingTime}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-closing-time">{t("closingTimeLabel")}</Label>
          <Input
            id="tag-closing-time"
            name="closingTime"
            type="time"
            defaultValue={state.submitted?.closingTime}
          />
        </div>
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">{t("openingHoursHint")}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-lat">{t("latitudeLabel")}</Label>
          <Input
            id="tag-lat"
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            placeholder="10.7626"
            defaultValue={state.submitted?.latitude}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-lng">{t("longitudeLabel")}</Label>
          <Input
            id="tag-lng"
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            placeholder="106.6602"
            defaultValue={state.submitted?.longitude}
          />
        </div>
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">{t("coordinatesHint")}</p>

      {state.duplicate && (
        <div className="border-chart-2/40 bg-chart-2/10 flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <p>{t("duplicateWarning", { title: state.duplicate.title })}</p>

          <Button
            type="submit"
            name="force"
            value="true"
            variant="outline"
            size="sm"
            disabled={pending}
            className="self-start"
          >
            {pending ? t("submitPending") : t("createAnyway")}
          </Button>
        </div>
      )}

      {state.createdTitle && (
        <p className="text-primary text-sm">
          {t("createdSuccess", { title: state.createdTitle })}
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">{state.error}</p>
      )}

      {!state.duplicate && (
        <Button
          type="submit"
          name="force"
          value="false"
          disabled={pending}
          className="self-start"
        >
          {pending ? t("submitPending") : t("submit")}
        </Button>
      )}
    </form>
  );
}