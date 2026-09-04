import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Locale-aware drop-ins for next/link, next/navigation. Use these instead
// of the plain Next.js versions anywhere inside src/app/[locale] so the
// active locale is preserved across navigation.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
