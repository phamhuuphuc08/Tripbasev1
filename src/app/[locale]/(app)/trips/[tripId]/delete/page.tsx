import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { deleteTripAction } from "@/features/trip/actions";
import { getSession } from "@/server/auth/session";
import { getTripDetail } from "@/server/services/trip.service";

export default async function DeleteTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await getSession();
  const result = await getTripDetail(tripId, session?.userId);

  // Only the owner should ever see this page — matches the edit form's
  // access rule on the trip detail page.
  if (!result || !result.isOwner) notFound();

  const t = await getTranslations("trip.delete");

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="text-destructive size-5" />
            <CardTitle>{t("title")}</CardTitle>
          </div>
          <CardDescription>
            {t("description", { name: result.trip.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <form action={deleteTripAction.bind(null, tripId)}>
            <Button type="submit" variant="destructive">
              {t("confirm")}
            </Button>
          </form>
          <Button
            render={<Link href={`/trips/${tripId}`} />}
            nativeButton={false}
            variant="ghost"
          >
            {t("cancel")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
