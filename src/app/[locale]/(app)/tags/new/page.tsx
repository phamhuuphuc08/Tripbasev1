import {
  ArrowLeft,
  MapPinPlus,
  Sparkles,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Link, redirect } from "@/i18n/navigation";

import { CreateTagForm } from "@/features/tag-tip/create-tag-form";

import { getSession } from "@/server/auth/session";

export default async function NewTagPage({
  searchParams,
}: {
  searchParams: Promise<{
    title?: string;
  }>;
}) {
  const [
    session,
    locale,
    {
      title,
    },
  ] = await Promise.all([
    getSession(),
    getLocale(),
    searchParams,
  ]);

  if (!session) {
    return redirect({
      href: "/login?callbackUrl=/tags/new",
      locale,
    });
  }

  const t =
    await getTranslations(
      "tagTip",
    );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/tags"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" />

        {t(
          "backToLibrary",
        )}
      </Link>

      <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-4 rounded-3xl border bg-gradient-to-br px-6 py-7 sm:px-8">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <MapPinPlus className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t(
                "createHeading",
              )}
            </h1>

            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              {t(
                "newPageDescription",
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />

              <CardTitle className="text-lg">
                {t(
                  "createHeading",
                )}
              </CardTitle>
            </div>

            <CardDescription className="leading-6">
              {t(
                "newPageDescription",
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <CreateTagForm
              initialTitle={
                title
              }
            />
          </CardContent>
        </Card>

        <Card className="h-fit rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {t(
                "tipsHeading",
              )}
            </CardTitle>

            <CardDescription>
              {t(
                "tipsDescription",
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex gap-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                1
              </span>

              <div>
                <p className="font-medium">
                  {t(
                    "tipNameTitle",
                  )}
                </p>

                <p className="text-muted-foreground mt-1 leading-5">
                  {t(
                    "tipNameDescription",
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                2
              </span>

              <div>
                <p className="font-medium">
                  {t(
                    "tipCategoryTitle",
                  )}
                </p>

                <p className="text-muted-foreground mt-1 leading-5">
                  {t(
                    "tipCategoryDescription",
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                3
              </span>

              <div>
                <p className="font-medium">
                  {t(
                    "tipContentTitle",
                  )}
                </p>

                <p className="text-muted-foreground mt-1 leading-5">
                  {t(
                    "tipContentDescription",
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
