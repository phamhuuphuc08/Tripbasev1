import type { routing } from "@/i18n/routing";

type Messages = typeof import("./messages/vi.json");

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
