import { Compass } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import { getSession } from "@/server/auth/session";
import { listMyPendingInvitations } from "@/server/services/invitation.service";

export async function SiteHeader() {
  const [session, t] = await Promise.all([
    getSession(),
    getTranslations("nav"),
  ]);

  const pendingInvitations = session
    ? await listMyPendingInvitations(session.userId)
    : [];

  const pendingInvitationCount = pendingInvitations.length;

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

          {session && (
            <Link
              href="/invitations"
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <span>{t("invitations")}</span>

              {pendingInvitationCount > 0 && (
                <span className="bg-primary text-primary-foreground flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none">
                  {pendingInvitationCount > 99
                    ? "99+"
                    : pendingInvitationCount}
                </span>
              )}
            </Link>
          )}

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
            <Link
              href={`/creators/${session.userId}`}
              className="text-muted-foreground hover:text-foreground hidden transition-colors sm:inline"
            >
              {session.name}
            </Link>

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