import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  Car,
  Clock3,
  Hotel,
  type LucideIcon,
  Landmark,
  MapPin,
  Smartphone,
  Sparkles,
  Utensils,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  type TagCategory,
  toTagCategory,
} from "@/features/tag-tip/categories";
import { getTrustTier } from "@/features/tag-tip/trust-tier";
import { getLocationTag } from "@/server/services/location-tag.service";

const CATEGORY_ICON: Record<TagCategory, LucideIcon> = {
  RESTAURANT: Utensils,
  ATTRACTION: Landmark,
  HOTEL: Hotel,
  CAR_RENTAL: Car,
  TRANSPORT: Bus,
  SIM: Smartphone,
  OTHER: Sparkles,
};

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  const { tagId } = await params;

  const [tag, tCategory, tTrust, format] = await Promise.all([
    getLocationTag(tagId),
    getTranslations("tagCategory"),
    getTranslations("tagTrust"),
    getFormatter(),
  ]);

  if (!tag) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/tags"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại Tag & Tip Library
        </Link>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Không tìm thấy địa điểm hoặc thông tin này.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const category = toTagCategory(tag.category);
  const Icon = CATEGORY_ICON[category] ?? Sparkles;
  const tier = getTrustTier(tag.citeTrustScore);

  const openingHours = tag.openingHours?.split("-") ?? null;

  const hasLocation =
    tag.latitude != null &&
    tag.longitude != null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/tags"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Quay lại Tag & Tip Library
      </Link>

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm sm:rounded-3xl">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <Icon className="text-primary size-5" />
              </span>

              <div>
                <CardTitle className="text-xl leading-snug sm:text-2xl">
                  {tag.title}
                </CardTitle>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {tCategory(category)}
                  </Badge>

                  {tier === "verified" ? (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="size-3" />
                      {tTrust("verified")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {tTrust(tier)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
          <section>
            <h2 className="font-semibold">Thông tin</h2>

            {tag.content ? (
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {tag.content}
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Chưa có mô tả chi tiết.
              </p>
            )}
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">
                Người tạo
              </p>

              <Link
                href={`/creators/${tag.owner.id}`}
                className="mt-1 block text-sm font-semibold hover:underline"
              >
                {tag.owner.name}
              </Link>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">
                Ngày tạo
              </p>

              <p className="mt-1 text-sm font-semibold">
                {format.dateTime(tag.createdAt, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-muted-foreground text-xs">
                Độ tin cậy
              </p>

              <p className="mt-1 text-xl font-bold">
                {Math.round(tag.citeTrustScore)}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                Cite Trust Score
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-muted-foreground text-xs">
                Được sử dụng
              </p>

              <p className="mt-1 text-xl font-bold">
                {tag._count.itineraryItems}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                lịch trình
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Clock3 className="text-primary size-4" />
              <h2 className="font-semibold">Giờ hoạt động</h2>
            </div>

            {openingHours && openingHours.length === 2 ? (
              <div className="rounded-2xl border p-4">
                <p className="text-sm">
                  {openingHours[0]} - {openingHours[1]}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Chưa có thông tin giờ hoạt động.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary size-4" />
              <h2 className="font-semibold">Vị trí</h2>
            </div>

            {hasLocation ? (
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">
                  Đã có vị trí địa điểm
                </p>

                <p className="text-muted-foreground mt-1 text-xs">
                  {tag.latitude}, {tag.longitude}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Địa điểm này chưa có vị trí trên bản đồ.
              </p>
            )}
          </section>

          {tag.possibleDuplicateOfId && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium">
                Địa điểm này có thể trùng với một Tag đã tồn tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}