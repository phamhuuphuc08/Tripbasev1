import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { TripForm } from "@/features/trip/trip-form";
import { getSession } from "@/server/auth/session";

export default async function NewTripPage() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({ href: "/login?callbackUrl=/trips/new", locale });
  }

  const t = await getTranslations("trip.form");

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
