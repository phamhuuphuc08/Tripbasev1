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
  TAG_CATEGORIES,
  type TagCategory,
} from "@/features/tag-tip/categories";
import {
  createTagAction,
  type CreateTagFormState,
} from "@/features/tag-tip/actions";

const initialState: CreateTagFormState = { attempt: 0 };

export function CreateTagForm() {
  const t = useTranslations("tagTip.form");
  const tCategory = useTranslations("tagCategory");
  const [state, formAction, pending] = useActionState(
    createTagAction,
    initialState,
  );

  return (
    // React clears uncontrolled fields after every action call — remount on
    // `attempt` so the fields below can re-seed from `state.submitted`
    // instead of losing what the user typed (matters most on the duplicate
    // path, where they need to still see the name they entered).
    <form
      key={state.attempt}
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-title">{t("titleLabel")}</Label>
        <Input
          id="tag-title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          defaultValue={state.submitted?.title}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-category">{t("categoryLabel")}</Label>
        <Select
          name="category"
          defaultValue={state.submitted?.category ?? "RESTAURANT"}
        >
          <SelectTrigger id="tag-category" className="w-full">
            <SelectValue>
              {(value: TagCategory | null) => (value ? tCategory(value) : null)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TAG_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {tCategory(category)}
              </SelectItem>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-lat">{t("latitudeLabel")}</Label>
          <Input
            id="tag-lat"
            name="latitude"
            type="number"
            step="any"
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
            placeholder="106.6602"
            defaultValue={state.submitted?.longitude}
          />
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">
        {t("coordinatesHint")}
      </p>

      {state.duplicate && (
        <div className="border-chart-2/40 bg-chart-2/10 flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <p>{t("duplicateWarning", { title: state.duplicate.title })}</p>
          {/* Native button name/value — no client state, no submit race. */}
          <Button
            type="submit"
            name="force"
            value="true"
            variant="outline"
            size="sm"
            className="self-start"
          >
            {t("createAnyway")}
          </Button>
        </div>
      )}

      {state.createdTitle && (
        <p className="text-primary text-sm">
          {t("createdSuccess", { title: state.createdTitle })}
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
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
