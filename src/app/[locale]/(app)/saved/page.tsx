import {
  Bookmark,
  CalendarRange,
  MapPin,
  User,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { unsavePlanAction } from "@/features/marketplace/actions";
import { getSession } from "@/server/auth/session";
import { listSavedPlans } from "@/server/services/saved-plan.service";

export default async function SavedLibraryPage() {
  const session = await getSession();

  if (!session) {
    return redirect({
      href: "/login?callbackUrl=/saved",
      locale: undefined,
    });
  }

  const [savedPlans, t, format] = await Promise.all([
    listSavedPlans(session.userId),
    getTranslations("placeholders.saved"),
    getFormatter(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="size-5" />

          <h1 className="text-2xl font-semibold">
            {t("title")}
          </h1>
        </div>

        <p className="text-muted-foreground text-sm">
          {t("description")}
        </p>
      </div>

      {savedPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
              <Bookmark className="size-5" />
            </span>

            <div className="flex flex-col gap-1">
              <h2 className="font-medium">
                Chưa có kế hoạch nào được lưu
              </h2>

              <p className="text-muted-foreground text-sm">
                Bạn có thể lưu các kế hoạch từ trang Explore để xem lại sau.
              </p>
            </div>

            <Button
              render={
                <Link href="/explore" />
              }
              nativeButton={false}
            >
              Khám phá kế hoạch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {savedPlans.map((plan) => {
            const dateRange =
              plan.startDate && plan.endDate
                ? format.dateTimeRange(
                    plan.startDate,
                    plan.endDate,
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    },
                  )
                : null;

            return (
              <Card
                key={plan.id}
                className="flex h-full flex-col"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      <Link
                        href={`/trips/${plan.id}`}
                        className="hover:underline"
                      >
                        {plan.name}
                      </Link>
                    </CardTitle>

                    <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                      <MapPin className="size-3.5 shrink-0" />

                      <span className="truncate">
                        {plan.destination}
                      </span>
                    </div>
                  </div>

                  <form
                    action={unsavePlanAction.bind(
                      null,
                      plan.id,
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label="Bỏ lưu kế hoạch"
                    >
                      <Bookmark className="size-4 fill-current" />
                    </Button>
                  </form>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  {dateRange && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <CalendarRange className="size-3.5" />

                      <span>{dateRange}</span>
                    </div>
                  )}

                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <User className="size-3.5" />

                    <Link
                      href={`/creators/${plan.ownerId}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {plan.ownerName}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {plan.itineraryItemCount} hoạt động
                    </Badge>

                    <Badge variant="outline">
                      {plan.travelerCount} người
                    </Badge>

                    {plan.copyplanScore > 0 && (
                      <Badge variant="outline">
                        Trust {plan.copyplanScore}
                      </Badge>
                    )}
                  </div>

                  {plan.travelStyle.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plan.travelStyle.map((style) => (
                        <Badge
                          key={style}
                          variant="outline"
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <span className="text-muted-foreground text-xs">
                      Đã lưu{" "}
                      {format.dateTime(plan.savedAt, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>

                    <Button
                      render={
                        <Link
                          href={`/trips/${plan.id}`}
                        />
                      }
                      nativeButton={false}
                      variant="outline"
                    >
                      Xem kế hoạch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}