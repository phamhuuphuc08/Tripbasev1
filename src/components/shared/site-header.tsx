import { Compass } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { getSession } from "@/server/auth/session";

export async function SiteHeader() {
  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("nav"),
  ]);

  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3.5 text-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <Compass className="size-4" />
          </span>
          TripBase
        </Link>

        <nav className="text-muted-foreground flex flex-1 gap-5">
          <Link
            href="/trips"
            className="hover:text-foreground transition-colors"
          >
            {t("trips")}
          </Link>
          <Link
            href="/explore"
            className="hover:text-foreground transition-colors"
          >
            {t("explore")}
          </Link>
          <Link
            href="/saved"
            className="hover:text-foreground transition-colors"
          >
            {t("saved")}
          </Link>
          <Link
            href="/tags"
            className="hover:text-foreground transition-colors"
          >
            {t("tags")}
          </Link>
        </nav>

        <LanguageSwitcher />
        <ThemeToggle />

        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden sm:inline">
              {session.name}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                {t("logout")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              {t("login")}
            </Button>
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              size="sm"
            >
              {t("register")}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
