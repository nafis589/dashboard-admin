'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(async () => (await import('react-leaflet')).MapContainer, { ssr: false });
const TileLayer = dynamic(async () => (await import('react-leaflet')).TileLayer, { ssr: false });
const Marker = dynamic(async () => (await import('react-leaflet')).Marker, { ssr: false });
// Leaflet react components have strict/complex types when imported dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyMapContainer = MapContainer as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyTileLayer = TileLayer as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyMarker = Marker as any;

type VendorLocationMapProps = {
  latitude?: number | null;
  longitude?: number | null;
};

export function VendorLocationMap({ latitude, longitude }: VendorLocationMapProps) {
  const coords = useMemo(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    return [latitude, longitude] as [number, number];
  }, [latitude, longitude]);

  if (!coords) {
    return (
      <div className="grid size-full place-items-center bg-muted/40 text-muted-foreground text-sm">
        Localisation non disponible.
      </div>
    );
  }

  return (
    <div className="size-full min-h-0 overflow-hidden">
      <AnyMapContainer center={coords} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <AnyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AnyMarker position={coords} />
      </AnyMapContainer>
    </div>
  );
}
