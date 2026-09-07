import { Clapperboard } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { StoryViewer } from "@/features/story/story-viewer";
import { getSession } from "@/server/auth/session";
import { getStoryView } from "@/server/services/story.service";

export default async function TripStoryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await getSession();
  // Deliberately not the same login gate as the trip detail page — see
  // getStoryView's doc comment: a public trip's story is meant to open
  // straight from a shared link, no account required.
  const result = await getStoryView(tripId, session?.userId);
  if (!result) notFound();

  const { trip, slides } = result;

  if (slides.length === 0) {
    const t = await getTranslations("story.viewer");
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Clapperboard className="size-5" />
        </span>
        <h1 className="text-xl font-semibold">{t("emptyTitle")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("emptyDescription", { name: trip.name })}
        </p>
        <Button
          render={<Link href={`/trips/${tripId}`} />}
          nativeButton={false}
        >
          {t("backToTrip")}
        </Button>
      </div>
    );
  }

  return (
    <StoryViewer
      tripId={tripId}
      tripName={trip.name}
      slides={slides.map((slide) => ({
        id: slide.id,
        day: slide.day,
        caption: slide.caption,
        theme: slide.theme,
        photo: slide.photo,
      }))}
    />
  );
}
