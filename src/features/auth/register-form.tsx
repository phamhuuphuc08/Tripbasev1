"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("register.nameLabel")}</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-muted-foreground text-xs">
          {t("register.passwordHint")}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("register.submitPending") : t("register.submit")}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="text-foreground underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </form>
  );
}
