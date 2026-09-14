"use client";

import "leaflet/dist/leaflet.css";
import { DivIcon } from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
}

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (value: LocationPickerValue) => void;
}

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623];

const PICKER_ICON = new DivIcon({
  className: "",
  html: '<div style="width:24px;height:24px;border-radius:9999px;background:#0568d3;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function LocationPickerEvents({
  onChange,
}: {
  onChange: (value: LocationPickerValue) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const hasPosition =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const center = useMemo<[number, number]>(
    () => (hasPosition ? [latitude, longitude] : DEFAULT_CENTER),
    [hasPosition, latitude, longitude],
  );

  return (
    <MapContainer
      center={center}
      zoom={hasPosition ? 15 : 5}
      scrollWheelZoom
      style={{ height: 320, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <LocationPickerEvents onChange={onChange} />

      {hasPosition && (
        <Marker
          position={[latitude, longitude]}
          icon={PICKER_ICON}
          draggable
          eventHandlers={{
            dragend(event) {
              const position = event.target.getLatLng();

              onChange({
                latitude: Number(position.lat.toFixed(6)),
                longitude: Number(position.lng.toFixed(6)),
              });
            },
          }}
        />
      )}
    </MapContainer>
  );
}