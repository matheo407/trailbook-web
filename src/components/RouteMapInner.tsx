'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteSegment, Stop } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const stopTypeEmoji: Record<string, string> = {
  repas: '🍽️',
  repos: '🛋️',
  bivouac: '⛺',
  point_de_vue: '🔭',
  autre: '📍',
};

const SEGMENT_COLORS = ['#2D6A4F', '#1971C2', '#F03E3E', '#F4A261', '#845EF7', '#20C997'];

interface Props {
  routes: RouteSegment[];
  stops?: Stop[];
  userPosition?: { lat: number; lng: number };
}

export default function RouteMapInner({ routes, stops = [], userPosition }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const allCoords = routes.flatMap((s) => s.coordinates);
  const center = allCoords.length > 0
    ? ([allCoords[Math.floor(allCoords.length / 2)].lat, allCoords[Math.floor(allCoords.length / 2)].lng] as [number, number])
    : ([46.2276, 2.2137] as [number, number]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!mapRef.current) return;

    // Start/end markers for each segment
    routes.forEach((seg, idx) => {
      if (seg.coordinates.length === 0 || !mapRef.current) return;
      const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      const m = L.marker([seg.coordinates[0].lat, seg.coordinates[0].lng], { icon: startIcon });
      m.addTo(mapRef.current);
      markersRef.current.push(m);
    });

    // Stop markers
    stops.forEach((stop) => {
      if (!stop.coordinate || !mapRef.current) return;
      const emoji = stopTypeEmoji[stop.type] || '📍';
      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const marker = L.marker([stop.coordinate.lat, stop.coordinate.lng], { icon });
      marker.bindPopup(`<b>${stop.name}</b>`);
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds to all segments
    if (allCoords.length > 1 && mapRef.current) {
      const bounds = L.latLngBounds(allCoords.map((c) => [c.lat, c.lng] as [number, number]));
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [routes, stops, allCoords]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (!userPosition) return;
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.3)"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], { icon, zIndexOffset: 1000 });
    userMarkerRef.current.bindPopup('📍 Ma position');
    userMarkerRef.current.addTo(mapRef.current);
    mapRef.current.setView([userPosition.lat, userPosition.lng], Math.max(mapRef.current.getZoom(), 14));
  }, [userPosition]);

  return (
    <MapContainer
      center={center}
      zoom={allCoords.length === 1 ? 13 : 10}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {routes.map((seg, idx) => {
        const positions = seg.coordinates.map((c) => [c.lat, c.lng] as [number, number]);
        if (positions.length < 2) return null;
        return (
          <Polyline
            key={seg.id}
            positions={positions}
            color={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
            weight={4}
            opacity={0.85}
          />
        );
      })}
    </MapContainer>
  );
}
