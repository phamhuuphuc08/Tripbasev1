"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { loginAction, type AuthFormState } from "@/features/auth/actions";

const initialState: AuthFormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input
        type="hidden"
        name="callbackUrl"
        value={callbackUrl ?? ""}
      />

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
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="password"
            className="text-sm font-medium"
          >
            {t("passwordLabel")}
          </Label>

          <Link
            href="/forgot-password"
            className="text-primary text-xs font-medium hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="relative">
          <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-xl pl-10"
          />
        </div>
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
          ? t("login.submitPending")
          : t("login.submit")}
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
        {t("login.noAccount")}{" "}

        <Link
          href="/register"
          className="text-primary font-medium hover:underline"
        >
          {t("login.registerLink")}
        </Link>
      </p>
    </form>
  );
}