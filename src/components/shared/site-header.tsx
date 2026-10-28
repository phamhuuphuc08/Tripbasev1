import {
  Compass,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/server/db/client";
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

  const currentUser = session
    ? await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          role: true,
        },
      })
    : null;

  const isAdmin =
    currentUser?.role === "ADMIN";

  const pendingInvitations = session
    ? await listMyPendingInvitations(
        session.userId,
      )
    : [];

  const pendingInvitationCount =
    pendingInvitations.length;

  return (
    <header className="bg-background/95 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* LOGO */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl">
            <Compass className="size-4" />
          </span>

          <span className="text-base font-bold">
            TripBase
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="text-muted-foreground hidden flex-1 items-center justify-center gap-5 text-sm md:flex">
          <Link
            href="/trips"
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            {t("trips")}
          </Link>

          <Link
            href="/explore"
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            {t("explore")}
          </Link>

          <Link
            href="/saved"
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            {t("saved")}
          </Link>

          {session && (
            <Link
              href="/invitations"
              className="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-foreground"
            >
              <span>
                {t("invitations")}
              </span>

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
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            {t("tags")}
          </Link>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LanguageSwitcher />

          <ThemeToggle />

          {isAdmin && (
            <Button
              render={
                <Link href="/admin" />
              }
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ShieldCheck className="size-4" />
              {t("admin")}
            </Button>
          )}

          {session ? (
            <>
              <Link
                href={`/creators/${session.userId}`}
                className="text-muted-foreground hover:text-foreground max-w-32 truncate text-sm transition-colors"
              >
                {session.name}
              </Link>

              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                >
                  {t("logout")}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                render={
                  <Link href="/login" />
                }
                nativeButton={false}
                variant="ghost"
                size="sm"
              >
                {t("login")}
              </Button>

              <Button
                render={
                  <Link href="/register" />
                }
                nativeButton={false}
                size="sm"
              >
                {t("register")}
              </Button>
            </>
          )}
        </div>

        {/* MOBILE MENU */}
        <details className="group relative md:hidden">
          <summary className="hover:bg-muted flex size-10 cursor-pointer list-none items-center justify-center rounded-xl transition-colors [&::-webkit-details-marker]:hidden">
            <Menu className="size-5" />

            <span className="sr-only">
              Menu
            </span>
          </summary>

          <div className="bg-background absolute top-[calc(100%+12px)] right-0 z-50 w-[min(300px,calc(100vw-32px))] overflow-hidden rounded-2xl border shadow-xl">
            {/* MOBILE USER */}
            {session && (
              <div className="border-b px-4 py-4">
                <p className="text-muted-foreground text-xs">
                  Tài khoản
                </p>

                <Link
                  href={`/creators/${session.userId}`}
                  className="mt-1 block truncate text-sm font-semibold"
                >
                  {session.name}
                </Link>
              </div>
            )}

            {/* MOBILE NAV */}
            <nav className="flex flex-col p-2 text-sm">
              <Link
                href="/trips"
                className="hover:bg-muted rounded-xl px-3 py-3 font-medium transition-colors"
              >
                {t("trips")}
              </Link>

              <Link
                href="/explore"
                className="hover:bg-muted rounded-xl px-3 py-3 font-medium transition-colors"
              >
                {t("explore")}
              </Link>

              <Link
                href="/saved"
                className="hover:bg-muted rounded-xl px-3 py-3 font-medium transition-colors"
              >
                {t("saved")}
              </Link>

              {session && (
                <Link
                  href="/invitations"
                  className="hover:bg-muted flex items-center justify-between gap-3 rounded-xl px-3 py-3 font-medium transition-colors"
                >
                  <span>
                    {t("invitations")}
                  </span>

                  {pendingInvitationCount > 0 && (
                    <span className="bg-primary text-primary-foreground flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      {pendingInvitationCount > 99
                        ? "99+"
                        : pendingInvitationCount}
                    </span>
                  )}
                </Link>
              )}

              <Link
                href="/tags"
                className="hover:bg-muted rounded-xl px-3 py-3 font-medium transition-colors"
              >
                {t("tags")}
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hover:bg-muted flex items-center gap-2 rounded-xl px-3 py-3 font-medium transition-colors"
                >
                  <ShieldCheck className="size-4" />

                  <span>
                    {t("admin")}
                  </span>
                </Link>
              )}
            </nav>

            {/* MOBILE SETTINGS */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-muted-foreground text-xs">
                Giao diện
              </span>

              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>

            {/* MOBILE AUTH */}
            <div className="border-t p-3">
              {session ? (
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    {t("logout")}
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    render={
                      <Link href="/login" />
                    }
                    nativeButton={false}
                    variant="outline"
                    className="rounded-xl"
                  >
                    {t("login")}
                  </Button>

                  <Button
                    render={
                      <Link href="/register" />
                    }
                    nativeButton={false}
                    className="rounded-xl"
                  >
                    {t("register")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}