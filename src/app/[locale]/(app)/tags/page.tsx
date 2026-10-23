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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Link } from "@/i18n/navigation";

import {
  TAG_CATEGORIES,
  isTagCategory,
  type TagCategory,
} from "@/features/tag-tip/categories";
import { getTrustTier } from "@/features/tag-tip/trust-tier";

import { searchTags } from "@/server/services/location-tag.service";

const CATEGORY_ICON: Record<
  TagCategory,
  LucideIcon
> = {
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
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}) {
  const {
    q,
    category: categoryParam,
  } = await searchParams;

  const query =
    q?.trim() ?? "";

  const category =
    isTagCategory(
      categoryParam,
    )
      ? categoryParam
      : undefined;

  const [
    results,
    t,
    tCategory,
    tTrust,
  ] = await Promise.all([
    searchTags({
      query:
        query ||
        undefined,

      category,
    }),

    getTranslations(
      "tagTip",
    ),

    getTranslations(
      "tagCategory",
    ),

    getTranslations(
      "tagTrust",
    ),
  ]);

  const newTagHref =
    query
      ? `/tags/new?title=${encodeURIComponent(
          query,
        )}`
      : "/tags/new";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-4 rounded-3xl border bg-gradient-to-br px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Sparkles className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("heading")}
            </h1>

            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <Button
          render={
            <Link href="/tags/new" />
          }
          nativeButton={false}
          className="shrink-0 rounded-xl"
        >
          <Plus className="size-4" />
          {t("createButton")}
        </Button>
      </div>

      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <form
            action="/tags"
            className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
          >
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

              <Input
                name="q"
                defaultValue={
                  query
                }
                placeholder={
                  t(
                    "searchPlaceholder",
                  )
                }
                className="h-11 rounded-xl pl-9"
              />
            </div>

            <select
              name="category"
              defaultValue={
                category ??
                ""
              }
              className="border-input bg-background h-11 rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">
                {t(
                  "allCategories",
                )}
              </option>

              {TAG_CATEGORIES.map(
                (c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {
                      tCategory(
                        c,
                      )
                    }
                  </option>
                ),
              )}
            </select>

            <Button
              type="submit"
              className="h-11 rounded-xl px-5"
            >
              <Search className="size-4" />
              {t("searchButton")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length === 0 ? (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
              <Search className="size-6" />
            </span>

            <div>
              <h2 className="font-semibold">
                {t("emptyTitle")}
              </h2>

              <p className="text-muted-foreground mt-1 max-w-md text-sm leading-6">
                {t("empty")}
              </p>
            </div>

            <Button
              render={
                <Link
                  href={
                    newTagHref
                  }
                />
              }
              nativeButton={false}
              variant="outline"
              className="rounded-xl"
            >
              <Plus className="size-4" />
              {t("emptyCta")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {t("communityTitle")}
              </h2>

              <p className="text-muted-foreground mt-1 text-sm">
                {t("resultsCount", {
                  count:
                    results.length,
                })}
              </p>
            </div>

            <Badge
              variant="outline"
              className="rounded-full"
            >
              {category
                ? tCategory(
                    category,
                  )
                : t(
                    "allCategories",
                  )}
            </Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map(
              (tag) => {
                const Icon =
                  CATEGORY_ICON[
                    tag.category as TagCategory
                  ] ??
                  Sparkles;

                const tier =
                  getTrustTier(
                    tag.citeTrustScore,
                  );

                return (
                  <Card
                    key={
                      tag.id
                    }
                    className="group hover:border-primary/40 relative flex h-full flex-col overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Link
                      href={`/tags/${tag.id}`}
                      aria-label={tag.title}
                      className="absolute inset-0 z-0 rounded-2xl"
                    />

                    <div className="from-primary/10 via-primary/5 to-background pointer-events-none relative z-10 flex items-start justify-between gap-3 border-b bg-gradient-to-br px-4 py-4">
                      <span className="bg-background text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-sm">
                        <Icon className="size-5" />
                      </span>

                      {tier ===
                        "verified" && (
                        <Badge
                          variant="secondary"
                          className="bg-background/90 shrink-0 gap-1 shadow-sm backdrop-blur"
                        >
                          <BadgeCheck className="size-3" />

                          {tTrust(
                            "verified",
                          )}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4 px-4 py-4">
                      <div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                          {
                            tag.title
                          }
                        </h3>

                        {tag.content && (
                          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
                            {
                              tag.content
                            }
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full"
                        >
                          <Icon className="mr-1 size-3" />

                          {tCategory(
                            tag.category as TagCategory,
                          )}
                        </Badge>

                        {tier !==
                          "verified" && (
                          <Badge
                            variant="secondary"
                            className="rounded-full"
                          >
                            {tTrust(
                              tier,
                            )}
                          </Badge>
                        )}
                      </div>

                      <div className="border-t pt-3">
                        <span className="text-muted-foreground text-xs">
                          {t.rich(
                            "by",
                            {
                              name:
                                tag.owner
                                  .name,

                              link:
                                (
                                  chunks,
                                ) => (
                                  <Link
                                    href={`/creators/${tag.owner.id}`}
                                    className="text-foreground pointer-events-auto relative z-20 font-medium hover:underline"
                                  >
                                    {
                                      chunks
                                    }
                                  </Link>
                                ),
                            },
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </>
      )}
    </div>
  );
}