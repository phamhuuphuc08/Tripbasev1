import {
  MapPinned,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { getCreatorProfile } from "@/server/services/creator-profile.service";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col items-center gap-1.5 text-center">
        <Icon className="text-primary size-4" />
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </CardContent>
    </Card>
  );
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const [profile, session] = await Promise.all([
    getCreatorProfile(creatorId),
    getSession(),
  ]);
  if (!profile) notFound();

  const isOwner = session?.userId === profile.id;

  const [t, tStyle, tBudget, tInterest, format] = await Promise.all([
    getTranslations("creatorProfile"),
    getTranslations("travelStyle"),
    getTranslations("budgetLevel"),
    getTranslations("travelInterest"),
    getFormatter(),
  ]);

  const memberSince = format.dateTime(profile.memberSince, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const hasPreferences =
    profile.travelStyle != null ||
    profile.budgetLevel != null ||
    profile.travelInterests.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      {/* "Thẻ hội viên" — membership-card styling for the profile header. */}
      <Card className="from-primary to-primary/70 border-0 bg-gradient-to-br py-0 text-white shadow-lg">
        <CardContent className="flex items-center gap-4 py-7">
          {profile.image ? (
            // Locally uploaded file (src/server/storage/avatar.ts), not an
            // optimizable remote asset worth next/image's config for.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="size-16 shrink-0 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-semibold ring-2 ring-white/30">
              {initialsOf(profile.name)}
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium tracking-widest text-white/70 uppercase">
              {t("cardLabel")}
            </span>
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <span className="text-sm text-white/80">
              {t("memberSince", { date: memberSince })}
            </span>
            {profile.bio && (
              <p className="mt-1 text-sm text-white/90">{profile.bio}</p>
            )}
          </div>
          {isOwner && (
            <Button
              render={<Link href={`/creators/${profile.id}/edit`} />}
              nativeButton={false}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              <Pencil className="size-3.5" />
              {t("editButton")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">{t("contributionsHeading")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={MapPinned}
            label={t("stats.trips")}
            value={profile.tripsCreated}
          />
          <StatTile
            icon={Tag}
            label={t("stats.tags")}
            value={profile.locationTagsCreated}
          />
          <StatTile
            icon={MessageSquare}
            label={t("stats.comments")}
            value={profile.commentsMade}
          />
          <StatTile
            icon={ShieldCheck}
            label={t("stats.trustPoints")}
            value={profile.tagTrustPoints}
          />
        </div>
      </div>

      {(hasPreferences || isOwner) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t("preferencesHeading")}</h2>
          {hasPreferences ? (
            <div className="flex flex-wrap gap-2">
              {profile.travelStyle && (
                <Badge variant="secondary">{tStyle(profile.travelStyle)}</Badge>
              )}
              {profile.budgetLevel && (
                <Badge variant="secondary">
                  {tBudget(profile.budgetLevel)}
                </Badge>
              )}
              {profile.travelInterests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {tInterest(interest)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("preferencesEmpty")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
