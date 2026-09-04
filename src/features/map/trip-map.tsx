"use client";

import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { TagCategory } from "@/features/tag-tip/categories";
import { getTrustTier } from "@/features/tag-tip/trust-tier";

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: TagCategory;
  citeTrustScore: number;
  day: number;
  time: string | null;
}

// Cycles through a fixed palette so each day gets a distinct, consistent
// pin color — the rule-based stand-in for "gom theo khu vực" (mục 4):
// grouping is visual/by-day rather than a geo-clustering algorithm.
const DAY_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

function colorForDay(day: number) {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}

function markerIcon(day: number) {
  const color = colorForDay(day);
  return new DivIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:600;font-family:sans-serif;">${day}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function TripMap({ markers }: { markers: MapMarkerData[] }) {
  const t = useTranslations("itinerary");
  const tTrust = useTranslations("tagTrust");

  const center: [number, number] = [
    markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length,
    markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: 320, width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={markerIcon(marker.day)}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong>{marker.title}</strong>
              <br />
              {t("dayHeading", { day: marker.day })}
              {marker.time ? ` · ${marker.time}` : ""}
              <br />
              {tTrust(getTrustTier(marker.citeTrustScore))}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
