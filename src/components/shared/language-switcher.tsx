"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const otherLocale =
    routing.locales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t("languageSwitcher")}
      className="gap-1.5"
      onClick={() => router.replace(pathname, { locale: otherLocale })}
    >
      <Globe className="size-3.5" />
      {otherLocale.toUpperCase()}
    </Button>
  );
}
