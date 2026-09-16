import { notFound, redirect } from "next/navigation";
import { ShareLinkError, resolveShareLink } from "@/server/services/share-link.service";

export default async function ShareLinkPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;

  try {
    const shareLink = await resolveShareLink(token);

    redirect(`/${locale}/trips/${shareLink.plan.id}?shareToken=${encodeURIComponent(token)}`);
  } catch (error) {
    if (error instanceof ShareLinkError) {
      if (
        error.code === "NOT_FOUND" ||
        error.code === "REVOKED" ||
        error.code === "EXPIRED"
      ) {
        notFound();
      }
    }

    throw error;
  }
}