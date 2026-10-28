import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shared/site-header";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}