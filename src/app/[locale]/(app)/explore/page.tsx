import { Compass } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function ExplorePage() {
  const t = await getTranslations("placeholders.explore");

  return (
    <PlaceholderScreen
      icon={Compass}
      title={t("title")}
      description={t("description")}
      module="marketplace"
    />
  );
}
