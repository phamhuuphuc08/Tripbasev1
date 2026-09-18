"use client";

import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";
import Supercluster from "supercluster";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
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
  openingHours: string | null;
}

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

function clusterIcon(count: number | string) {
  const numericCount = Number(count);
  const size = numericCount >= 100 ? 46 : numericCount >= 10 ? 40 : 34;

  return new DivIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#0568d3;border:3px solid white;box-shadow:0 2px 7px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;font-family:sans-serif;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function parseTimeMinutes(value: string | null): number | null {
  if (!value) return null;

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function parseOpeningHours(value: string | null) {
  if (!value) return null;

  const match = /^\s*([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)\s*$/.exec(value);
  if (!match) return null;

  return {
    open: Number(match[1]) * 60 + Number(match[2]),
    close: Number(match[3]) * 60 + Number(match[4]),
  };
}

function openingStatus(
  openingHours: string | null,
  time: string | null,
): "OPEN" | "CLOSED" | null {
  const schedule = parseOpeningHours(openingHours);
  const activityTime = parseTimeMinutes(time);

  if (!schedule || activityTime == null) return null;
  if (schedule.open === schedule.close) return null;

  if (schedule.open < schedule.close) {
    return activityTime >= schedule.open && activityTime <= schedule.close
      ? "OPEN"
      : "CLOSED";
  }

  return activityTime >= schedule.open || activityTime <= schedule.close
    ? "OPEN"
    : "CLOSED";
}

interface MapViewport {
  bbox: [number, number, number, number];
  zoom: number;
}

function ClusterLayer({ markers }: { markers: MapMarkerData[] }) {
  const map = useMap();
  const t = useTranslations("itinerary");
  const tMap = useTranslations("map");
  const tTrust = useTranslations("tagTrust");

  const index = useMemo(() => {
    const cluster = new Supercluster<MapMarkerData, Record<string, never>>({
      radius: 60,
      maxZoom: 18,
      minPoints: 2,
    });

    cluster.load(
      markers.map((marker) => ({
        type: "Feature" as const,
        properties: marker,
        geometry: {
          type: "Point" as const,
          coordinates: [marker.longitude, marker.latitude] as [number, number],
        },
      })),
    );

    return cluster;
  }, [markers]);

  const [viewport, setViewport] = useState<MapViewport>(() => {
    const bounds = map.getBounds();

    return {
      bbox: [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom: Math.round(map.getZoom()),
    };
  });

  function updateViewport() {
    const bounds = map.getBounds();

    setViewport({
      bbox: [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom: Math.round(map.getZoom()),
    });
  }

  useMapEvents({
    moveend: updateViewport,
    zoomend: updateViewport,
  });

  const clusters = useMemo(
    () => index.getClusters(viewport.bbox, viewport.zoom),
    [index, viewport],
  );

  return (
    <>
      {clusters.map((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;

        const isCluster =
          "cluster" in feature.properties &&
          feature.properties.cluster === true;

        if (isCluster) {
          const properties = feature.properties as {
            cluster: true;
            cluster_id: number;
            point_count: number;
            point_count_abbreviated: number | string;
          };

          return (
            <Marker
              key={`cluster-${properties.cluster_id}`}
              position={[latitude, longitude]}
              icon={clusterIcon(properties.point_count_abbreviated)}
              eventHandlers={{
                click() {
                  const zoom = Math.min(
                    index.getClusterExpansionZoom(properties.cluster_id),
                    19,
                  );

                  map.setView([latitude, longitude], zoom);
                },
              }}
            />
          );
        }

        const marker = feature.properties as MapMarkerData;
        const status = openingStatus(marker.openingHours, marker.time);

        return (
          <Marker
            key={marker.id}
            position={[latitude, longitude]}
            icon={markerIcon(marker.day)}
          >
            <Popup>
              <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                <strong>{marker.title}</strong>

                <br />

                {t("dayHeading", { day: marker.day })}
                {marker.time ? ` · ${marker.time}` : ""}

                {marker.openingHours && (
                  <>
                    <br />
                    {tMap("openingHours", {
                      hours: marker.openingHours,
                    })}
                  </>
                )}

                {status && (
                  <>
                    <br />
                    <strong>
                      {status === "OPEN"
                        ? `● ${tMap("openAtTime")}`
                        : `● ${tMap("closedAtTime")}`}
                    </strong>
                  </>
                )}

                <br />
                {tTrust(getTrustTier(marker.citeTrustScore))}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export function TripMap({ markers }: { markers: MapMarkerData[] }) {
  if (markers.length === 0) return null;

  const center: [number, number] = [
    markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length,
    markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{
        height: 320,
        width: "100%",
        borderRadius: "0.75rem",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ClusterLayer markers={markers} />
    </MapContainer>
  );
}