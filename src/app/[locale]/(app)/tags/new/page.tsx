import { ArrowLeft } from "lucide-react";
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
  searchParams: Promise<{ title?: string }>;
}) {
  const [session, locale, { title }] = await Promise.all([
    getSession(),
    getLocale(),
    searchParams,
  ]);
  if (!session) {
    return redirect({ href: "/login?callbackUrl=/tags/new", locale });
  }

  const t = await getTranslations("tagTip");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-12">
      <Link
        href="/tags"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToLibrary")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("createHeading")}</CardTitle>
          <CardDescription>{t("newPageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTagForm initialTitle={title} />
        </CardContent>
      </Card>
    </div>
  );
}
