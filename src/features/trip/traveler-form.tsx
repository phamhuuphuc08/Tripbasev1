import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTravelerAction } from "@/features/trip/actions";

// Không cần client state, form submit xong redirect nên vẫn là Server Component.
export function TravelerForm({
  tripId,
  shareToken,
}: {
  tripId: string;
  shareToken?: string | null;
}) {
  const t = useTranslations("trip.travelers");
  const token = shareToken ?? null;

  return (
    <form
      action={addTravelerAction.bind(null, tripId, token)}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="traveler-name">{t("nameLabel")}</Label>
        <Input
          id="traveler-name"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="traveler-age">{t("ageGroupLabel")}</Label>
        <Input
          id="traveler-age"
          name="ageGroup"
          placeholder={t("ageGroupPlaceholder")}
          className="w-36"
        />
      </div>

      <Button type="submit" size="sm">
        {t("addButton")}
      </Button>
    </form>
  );
}