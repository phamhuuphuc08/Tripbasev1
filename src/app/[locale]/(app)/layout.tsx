import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/shared/site-header";
import { getAdminSettings } from "@/server/admin/settings.service";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [settings, session] = await Promise.all([
    getAdminSettings(),
    getSession(),
  ]);

  if (settings.maintenanceMode) {
    let isAdmin = false;

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true },
      });

      isAdmin = user?.role === "ADMIN";
    }

    if (!isAdmin) {
      redirect("/maintenance");
    }
  }

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}