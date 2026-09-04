import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // Vietnamese (the primary market — docs/PRODUCT_SPEC.md) keeps clean
  // URLs (/, /trips); English is prefixed (/en, /en/trips).
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
