import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect } from "@/i18n/navigation";
import { EditProfileForm } from "@/features/profile/edit-profile-form";
import { getSession } from "@/server/auth/session";
import { getCreatorProfile } from "@/server/services/creator-profile.service";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({
      href: `/login?callbackUrl=/creators/${creatorId}/edit`,
      locale,
    });
  }
  // Only the profile's own owner can edit it — same rule enforced again in
  // updateProfileAction since a form-render check alone isn't a boundary.
  if (session.userId !== creatorId) {
    return redirect({ href: `/creators/${creatorId}`, locale });
  }

  const profile = await getCreatorProfile(creatorId);
  if (!profile) {
    return redirect({ href: `/creators/${creatorId}`, locale });
  }

  const t = await getTranslations("creatorProfile");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-12">
      <Link
        href={`/creators/${creatorId}`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToProfile")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("edit.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            creatorId={creatorId}
            defaultValues={{
              name: profile.name,
              bio: profile.bio,
              image: profile.image,
              travelStyle: profile.travelStyle,
              budgetLevel: profile.budgetLevel,
              travelInterests: profile.travelInterests,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
