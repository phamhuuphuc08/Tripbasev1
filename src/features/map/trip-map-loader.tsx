"use client";

import dynamic from "next/dynamic";
import type { MapMarkerData } from "@/features/map/trip-map";

// Leaflet touches `window` at module load, so it can only render on the
// client — `ssr: false` is only valid inside a Client Component, hence this
// tiny wrapper around the dynamic import instead of calling it straight
// from the (Server Component) trip detail page.
const TripMap = dynamic(
  () => import("@/features/map/trip-map").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-[320px] w-full animate-pulse rounded-xl" />
    ),
  },
);

export function TripMapLoader({ markers }: { markers: MapMarkerData[] }) {
  return <TripMap markers={markers} />;
}
