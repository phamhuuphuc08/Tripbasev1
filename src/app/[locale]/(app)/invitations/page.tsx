import {
  CalendarRange,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvitationResponseButtons } from "@/features/share/invitation-response-buttons";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { listMyPendingInvitations } from "@/server/services/invitation.service";

export default async function InvitationsPage() {
  const session = await getSession();

  const [t, format] = await Promise.all([
    getTranslations("share.invitations"),
    getFormatter(),
  ]);

  if (!session) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-3 rounded-3xl border bg-gradient-to-br px-6 py-7 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Mail className="size-5" />
            </span>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("heading")}
              </h1>

              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {t("loginRequired")}
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
              <User className="size-6" />
            </span>

            <div>
              <h2 className="font-semibold">
                {t("loginTitle")}
              </h2>

              <p className="text-muted-foreground mt-1 max-w-md text-sm leading-6">
                {t("loginDescription")}
              </p>
            </div>

            <Button
              render={
                <Link href="/login?callbackUrl=/invitations" />
              }
              nativeButton={false}
              className="rounded-xl"
            >
              {t("loginButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitations =
    await listMyPendingInvitations(
      session.userId,
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-3 rounded-3xl border bg-gradient-to-br px-6 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Mail className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("heading")}
            </h1>

            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {invitations.length === 0 ? (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
              <Mail className="size-6" />
            </span>

            <div>
              <h2 className="font-semibold">
                {t("emptyTitle")}
              </h2>

              <p className="text-muted-foreground mt-1 text-sm">
                {t("empty")}
              </p>
            </div>

            <Button
              variant="outline"
              render={
                <Link href="/trips" />
              }
              nativeButton={false}
              className="rounded-xl"
            >
              {t("viewTripsButton")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {t("pendingTitle")}
              </h2>

              <p className="text-muted-foreground mt-1 text-sm">
                {t("pendingDescription")}
              </p>
            </div>

            <Badge variant="outline">
              <Mail className="mr-1 size-3" />
              {t("count", {
                count: invitations.length,
              })}
            </Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {invitations.map(
              (invitation) => {
                const dateRange =
                  invitation.trip.startDate &&
                  invitation.trip.endDate
                    ? format.dateTimeRange(
                        invitation.trip.startDate,
                        invitation.trip.endDate,
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )
                    : null;

                return (
                  <Card
                    key={invitation.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="bg-muted relative h-44 w-full overflow-hidden">
                      {invitation.trip.coverImageUrl ? (
                        <img
                          src={
                            invitation.trip
                              .coverImageUrl
                          }
                          alt={
                            invitation.trip.name
                          }
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="from-muted to-muted/40 flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br">
                          <MapPin className="text-muted-foreground size-6" />

                          <span className="text-muted-foreground text-xs">
                            {t("noCover")}
                          </span>
                        </div>
                      )}

                      <Badge
                        variant="secondary"
                        className="bg-background/90 absolute top-3 right-3 shadow-sm backdrop-blur"
                      >
                        {invitation.role === "EDITOR"
                          ? t("roleEditor")
                          : t("roleViewer")}
                      </Badge>
                    </div>

                    <CardHeader className="gap-2 px-4 pt-4 pb-0">
                      <CardTitle className="line-clamp-2 text-base leading-snug">
                        {
                          invitation.trip
                            .name
                        }
                      </CardTitle>

                      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <MapPin className="text-primary size-3.5 shrink-0" />

                        <span className="line-clamp-1">
                          {
                            invitation.trip
                              .destination
                          }
                        </span>
                      </div>

                      {dateRange && (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <CalendarRange className="size-3.5 shrink-0" />

                          <span>
                            {dateRange}
                          </span>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-4">
                      <div className="bg-muted/40 flex flex-col gap-1.5 rounded-xl px-3 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground size-3.5 shrink-0" />

                          <span className="text-muted-foreground line-clamp-1">
                            {t("invitedBy", {
                              name:
                                invitation
                                  .invitedBy
                                  .name,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="text-muted-foreground size-3.5 shrink-0" />

                          <span className="text-muted-foreground line-clamp-1">
                            {t("invitedEmail", {
                              email:
                                invitation
                                  .email,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <InvitationResponseButtons
                          invitationId={
                            invitation.id
                          }
                          tripId={
                            invitation.trip
                              .id
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </>
      )}
    </div>
  );
}