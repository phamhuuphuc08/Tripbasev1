import { Luggage } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function TripsPage() {
  const t = await getTranslations("placeholders.trips");

  return (
    <PlaceholderScreen
      icon={Luggage}
      title={t("title")}
      description={t("description")}
      module="trip"
    />
  );
}
