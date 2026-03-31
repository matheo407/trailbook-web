'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate, RouteSegment } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEGMENT_COLORS = ['#2D6A4F', '#74C0FC', '#F4A261', '#845EF7', '#20C997', '#FA5252'];

function ClickHandler({ onPick }: { onPick: (coord: Coordinate) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function AutoFit({ routes, coordinate }: { routes: RouteSegment[]; coordinate?: Coordinate }) {
  const map = useMap();
  useEffect(() => {
    const allPoints: [number, number][] = [];
    routes.forEach((s) => s.coordinates.forEach((c) => allPoints.push([c.lat, c.lng])));
    if (coordinate) allPoints.push([coordinate.lat, coordinate.lng]);
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

interface Props {
  routes: RouteSegment[];
  coordinate?: Coordinate;
  onPick: (coord: Coordinate) => void;
}

export default function StopMapPickerInner({ routes, coordinate, onPick }: Props) {
  const pinIcon = L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;background:#F4A261;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });

  const hasRoutes = routes.some((s) => s.coordinates.length > 0);
  const center: [number, number] = coordinate
    ? [coordinate.lat, coordinate.lng]
    : hasRoutes
    ? [routes[0].coordinates[0].lat, routes[0].coordinates[0].lng]
    : [46.2276, 2.2137];

  return (
    <MapContainer
      center={center}
      zoom={hasRoutes || coordinate ? 13 : 6}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <AutoFit routes={routes} coordinate={coordinate} />
      <ClickHandler onPick={onPick} />
      {routes.map((seg, idx) =>
        seg.coordinates.length > 1 ? (
          <Polyline
            key={seg.id}
            positions={seg.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
            pathOptions={{ color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length], weight: 3, opacity: 0.6 }}
          />
        ) : null
      )}
      {coordinate && (
        <Marker position={[coordinate.lat, coordinate.lng]} icon={pinIcon} />
      )}
    </MapContainer>
  );
}
