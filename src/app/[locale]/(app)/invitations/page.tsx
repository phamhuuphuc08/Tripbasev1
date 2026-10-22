import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationResponseButtons } from "@/features/share/invitation-response-buttons";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { listMyPendingInvitations } from "@/server/services/invitation.service";

export default async function InvitationsPage() {
  const session = await getSession();
  const t = await getTranslations("share.invitations");

  if (!session) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        <p className="text-muted-foreground text-sm">{t("loginRequired")}</p>
        <Button render={<Link href="/login?callbackUrl=/invitations" />} nativeButton={false} className="self-start">
          {t("loginButton")}
        </Button>
      </div>
    );
  }

  const invitations = await listMyPendingInvitations(session.userId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{invitation.trip.name}</CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">{invitation.trip.destination}</p>
                  </div>

                  <Badge variant="secondary">
                    {invitation.role === "EDITOR" ? t("roleEditor") : t("roleViewer")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="text-muted-foreground flex flex-col gap-1 text-sm">
                  <p>{t("invitedBy", { name: invitation.invitedBy.name })}</p>
                  <p>{t("invitedEmail", { email: invitation.email })}</p>
                </div>

                <InvitationResponseButtons
                  invitationId={invitation.id}
                  tripId={invitation.trip.id}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}