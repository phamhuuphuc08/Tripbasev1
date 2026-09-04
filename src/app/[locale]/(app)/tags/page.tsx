import {
  BadgeCheck,
  Bus,
  Car,
  Hotel,
  type LucideIcon,
  Landmark,
  Search,
  Smartphone,
  Sparkles,
  Utensils,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { CreateTagForm } from "@/features/tag-tip/create-tag-form";
import {
  TAG_CATEGORIES,
  isTagCategory,
  type TagCategory,
} from "@/features/tag-tip/categories";
import { getTrustTier } from "@/features/tag-tip/trust-tier";
import { getSession } from "@/server/auth/session";
import { searchTags } from "@/server/services/location-tag.service";

const CATEGORY_ICON: Record<TagCategory, LucideIcon> = {
  RESTAURANT: Utensils,
  ATTRACTION: Landmark,
  HOTEL: Hotel,
  CAR_RENTAL: Car,
  TRANSPORT: Bus,
  SIM: Smartphone,
  OTHER: Sparkles,
};

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category: categoryParam } = await searchParams;
  const query = q?.trim() ?? "";
  const category = isTagCategory(categoryParam) ? categoryParam : undefined;

  const [session, results, t, tCategory, tTrust] = await Promise.all([
    getSession(),
    searchTags({ query: query || undefined, category }),
    getTranslations("tagTip"),
    getTranslations("tagCategory"),
    getTranslations("tagTrust"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <form action="/tags" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={query}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
        >
          <option value="">{t("allCategories")}</option>
          {TAG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCategory(c)}
            </option>
          ))}
        </select>
        <Button type="submit">{t("searchButton")}</Button>
      </form>

      {results.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((tag) => {
            const Icon = CATEGORY_ICON[tag.category as TagCategory] ?? Sparkles;
            const tier = getTrustTier(tag.citeTrustScore);
            return (
              <Card key={tag.id} className="gap-2 py-4">
                <CardContent className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon className="text-primary size-4 shrink-0" />
                      {tag.title}
                    </span>
                    {tier === "verified" && (
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <BadgeCheck className="size-3" />
                        {tTrust("verified")}
                      </Badge>
                    )}
                  </div>
                  {tag.content && (
                    <p className="text-muted-foreground">{tag.content}</p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <Badge variant="outline">
                      {tCategory(tag.category as TagCategory)}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {tier !== "verified" && `${tTrust(tier)} · `}
                      {t("by", { name: tag.owner.name })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t pt-8">
        <h2 className="text-base font-semibold">{t("createHeading")}</h2>
        {session ? (
          <CreateTagForm />
        ) : (
          <p className="text-muted-foreground text-sm">
            {t.rich("loginToCreate", {
              link: (chunks) => (
                <Link
                  href="/login?callbackUrl=/tags"
                  className="text-foreground underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
