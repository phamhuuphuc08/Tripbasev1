import { Award } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const t = await getTranslations("placeholders.creator");

  return (
    <PlaceholderScreen
      icon={Award}
      title={t("title", { id: creatorId })}
      description={t("description")}
      module="reputation"
    />
  );
}
