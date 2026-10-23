"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { registerAction, type AuthFormState } from "@/features/auth/actions";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="name"
          className="text-sm font-medium"
        >
          {t("register.nameLabel")}
        </Label>

        <div className="relative">
          <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="h-11 rounded-xl pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-sm font-medium"
        >
          {t("emailLabel")}
        </Label>

        <div className="relative">
          <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-11 rounded-xl pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium"
        >
          {t("passwordLabel")}
        </Label>

        <div className="relative">
          <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-11 rounded-xl pl-10"
          />
        </div>

        <p className="text-muted-foreground text-xs leading-5">
          {t("register.passwordHint")}
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="border-destructive/20 bg-destructive/5 rounded-xl border px-3 py-2.5"
        >
          <p className="text-destructive text-sm">
            {state.error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl shadow-sm"
      >
        {pending
          ? t("register.submitPending")
          : t("register.submit")}
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-background text-muted-foreground px-3 text-xs">
            TripBase
          </span>
        </div>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {t("register.haveAccount")}{" "}

        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          {t("register.loginLink")}
        </Link>
      </p>
    </form>
  );
}