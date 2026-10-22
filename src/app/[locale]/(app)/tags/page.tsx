import {
  BadgeCheck,
  Bus,
  Car,
  Hotel,
  type LucideIcon,
  Landmark,
  Plus,
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
import {
  TAG_CATEGORIES,
  isTagCategory,
  type TagCategory,
} from "@/features/tag-tip/categories";
import { getTrustTier } from "@/features/tag-tip/trust-tier";
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

  const [results, t, tCategory, tTrust] = await Promise.all([
    searchTags({ query: query || undefined, category }),
    getTranslations("tagTip"),
    getTranslations("tagCategory"),
    getTranslations("tagTrust"),
  ]);

  // Same convention as SiteHeader's nav links: this always points at
  // /tags/new regardless of login state, and that page itself redirects
  // to /login?callbackUrl=/tags/new when there's no session — the gate
  // lives with the protected route, not duplicated at every link to it.
  // Prefilling from the current search query only makes sense once we
  // know it didn't already match something (see the empty state below).
  const newTagHref = query
    ? `/tags/new?title=${encodeURIComponent(query)}`
    : "/tags/new";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">{t("heading")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <Button
          render={<Link href="/tags/new" />}
          nativeButton={false}
          className="shrink-0"
        >
          <Plus className="size-4" />
          {t("createButton")}
        </Button>
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
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
          <Button
            render={<Link href={newTagHref} />}
            nativeButton={false}
            variant="outline"
          >
            <Plus className="size-4" />
            {t("emptyCta")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((tag) => {
            const Icon = CATEGORY_ICON[tag.category as TagCategory] ?? Sparkles;
            const tier = getTrustTier(tag.citeTrustScore);
            return (
              <Card
                key={tag.id}
                className="hover:border-primary/40 relative gap-2 py-4 transition-colors hover:shadow-sm"
              >
                <Link
                  href={`/tags/${tag.id}`}
                  aria-label={`Xem ${tag.title}`}
                  className="absolute inset-0 z-0 rounded-xl"
                />

  <CardContent className="pointer-events-none relative z-10 flex flex-col gap-1.5 text-sm">
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
                      {t.rich("by", {
                        name: tag.owner.name,
                        link: (chunks) => (
                          <Link
                            href={`/creators/${tag.owner.id}`}
                            className="pointer-events-auto hover:text-foreground hover:underline"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
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
