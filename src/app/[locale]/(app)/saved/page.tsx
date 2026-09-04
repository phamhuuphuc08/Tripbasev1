import { Bookmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function SavedLibraryPage() {
  const t = await getTranslations("placeholders.saved");

  return (
    <PlaceholderScreen
      icon={Bookmark}
      title={t("title")}
      description={t("description")}
      module="marketplace"
    />
  );
}
