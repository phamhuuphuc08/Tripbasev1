"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Share2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { STORY_THEME_GRADIENT, type StoryTheme } from "@/features/story/themes";

export interface StorySlideData {
  id: string;
  day: number | null;
  caption: string;
  theme: StoryTheme;
  photo: string | null;
}

// Instagram/TikTok Stories run ~5-7s per slide before auto-advancing —
// long enough to read a short caption, short enough to keep the pace up.
const SLIDE_DURATION_MS = 6000;

export function StoryViewer({
  tripId,
  tripName,
  slides,
}: {
  tripId: string;
  tripName: string;
  slides: StorySlideData[];
}) {
  const t = useTranslations("story.viewer");
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(current + 1, slides.length - 1));
  }, [slides.length]);
  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  // Auto-advance — restarts whenever `index` changes, whether from the
  // timer itself or a manual tap/arrow key.
  useEffect(() => {
    if (index >= slides.length - 1) return;
    const timer = setTimeout(goNext, SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [index, goNext, slides.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, non-secure context) — the
      // URL bar itself is still shareable, so just no-op.
    }
  }

  const slide = slides[index];
  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-black sm:my-6 sm:h-[calc(100%-3rem)] sm:rounded-2xl">
        <div className="absolute top-3 right-3 left-3 z-20 flex gap-1">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              {i < index && <div className="h-full w-full bg-white" />}
              {i === index && (
                <div
                  key={index}
                  className="story-progress-fill h-full bg-white"
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="absolute top-7 right-3 left-3 z-20 flex items-center justify-between text-white">
          <span className="truncate text-sm font-medium drop-shadow">
            {tripName}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label={t("shareLabel")}
              className="rounded-full bg-black/30 p-2 backdrop-blur"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Share2 className="size-4" />
              )}
            </button>
            <Link
              href={`/trips/${tripId}`}
              aria-label={t("closeLabel")}
              className="rounded-full bg-black/30 p-2 backdrop-blur"
            >
              <X className="size-4" />
            </Link>
          </div>
        </div>

        <div
          className={`relative flex flex-1 flex-col justify-end bg-gradient-to-br bg-cover bg-center p-6 pb-14 ${
            slide.photo ? "" : STORY_THEME_GRADIENT[slide.theme]
          }`}
          style={
            slide.photo ? { backgroundImage: `url(${slide.photo})` } : undefined
          }
        >
          {slide.photo && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
          )}
          <div className="relative z-10 flex flex-col gap-3">
            {slide.day != null && (
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {t("dayBadge", { day: slide.day })}
              </span>
            )}
            <p className="text-2xl leading-snug font-bold text-balance text-white drop-shadow-lg">
              {slide.caption}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={t("prevLabel")}
          className="absolute top-0 left-0 z-10 h-full w-1/3"
          onClick={goPrev}
        />
        <button
          type="button"
          aria-label={t("nextLabel")}
          className="absolute top-0 right-0 z-10 h-full w-2/3"
          onClick={goNext}
        />
      </div>
    </div>
  );
}
