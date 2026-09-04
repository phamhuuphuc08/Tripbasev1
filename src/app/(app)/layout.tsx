import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Shell for the authenticated app area (Trip Builder, Explore, Saved
 * Library, Creator Profile). See docs/PRODUCT_SPEC.md mục 11 for the
 * intended 3-pane layout (sidebar / timeline / map) — this is a structural
 * placeholder until auth + the feature modules land.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-6 border-b px-6 py-4 text-sm">
        <Link href="/" className="font-semibold">
          TripBase
        </Link>
        <nav className="flex gap-4">
          <Link href="/trips">Trips</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/saved">Saved Library</Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
