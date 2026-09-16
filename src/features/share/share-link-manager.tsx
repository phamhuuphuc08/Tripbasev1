"use client";

import { useActionState, useState } from "react";
import { Copy, Link2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createShareLinkAction, revokeShareLinkAction, type ShareLinkActionState } from "@/features/share/actions";

type ShareLinkItem = {
  id: string;
  token: string;
  type: "VIEW" | "EDIT";
  expiresAt: string | null;
  revokedAt: string | null;
};

type Props = {
  tripId: string;
  links: ShareLinkItem[];
};

const initialState: ShareLinkActionState = {};

function ShareLinkRow({ tripId, link }: { tripId: string; link: ShareLinkItem }) {
  const t = useTranslations("share.links");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(revokeShareLinkAction.bind(null, tripId, link.id), initialState);

  const revoked = Boolean(link.revokedAt);
  const expired = Boolean(link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now());

  async function copyLink() {
    const url = `${window.location.origin}/${locale}/share/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border px-2 py-1 text-xs font-medium">
            {link.type === "EDIT" ? t("edit") : t("view")}
          </span>

          {revoked ? (
            <span className="text-muted-foreground text-xs">{t("revoked")}</span>
          ) : expired ? (
            <span className="text-destructive text-xs">{t("expired")}</span>
          ) : (
            <span className="text-xs text-green-600">{t("active")}</span>
          )}
        </div>

        {!revoked && !expired && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              <Copy className="size-3.5" />
              {copied ? t("copied") : t("copy")}
            </Button>

            <form action={action}>
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                <X className="size-3.5" />
                {pending ? t("revoking") : t("revoke")}
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="text-muted-foreground break-all text-xs">
        /{locale}/share/{link.token}
      </div>

      {link.expiresAt && (
        <div className="text-muted-foreground text-xs">
          {t("expiresAt", { date: new Date(link.expiresAt).toLocaleString(locale) })}
        </div>
      )}

      {state.error && <p className="text-destructive text-sm">{t(`errors.${state.error}`)}</p>}
    </div>
  );
}

export function ShareLinkManager({ tripId, links }: Props) {
  const t = useTranslations("share.links");
  const [state, action, pending] = useActionState(createShareLinkAction.bind(null, tripId), initialState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="size-4" />
          {t("heading")}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>

      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-col gap-1.5">
          <label htmlFor="share-link-type" className="text-sm font-medium">{t("typeLabel")}</label>
          <select id="share-link-type" name="type" defaultValue="VIEW" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
            <option value="VIEW">{t("view")}</option>
            <option value="EDIT">{t("edit")}</option>
          </select>
        </div>

        <div className="flex min-w-40 flex-col gap-1.5">
          <label htmlFor="share-link-expiry" className="text-sm font-medium">{t("expiryLabel")}</label>
          <select id="share-link-expiry" name="expiry" defaultValue="7_DAYS" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
            <option value="NEVER">{t("never")}</option>
            <option value="1_DAY">{t("oneDay")}</option>
            <option value="7_DAYS">{t("sevenDays")}</option>
            <option value="30_DAYS">{t("thirtyDays")}</option>
          </select>
        </div>

        <Button type="submit" disabled={pending}>
          <Link2 className="size-4" />
          {pending ? t("creating") : t("create")}
        </Button>
      </form>

      {state.error && <p className="text-destructive text-sm">{t(`errors.${state.error}`)}</p>}

      <div className="border-t pt-4">
        <h4 className="mb-3 text-sm font-medium">{t("listHeading")}</h4>

        {links.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {links.map((link) => <ShareLinkRow key={link.id} tripId={tripId} link={link} />)}
          </div>
        )}
      </div>
    </div>
  );
}