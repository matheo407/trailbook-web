'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate, Stop } from '@/types';

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

interface Props {
  route: Coordinate[];
  stops?: Stop[];
}

export default function RouteMapInner({ route, stops = [] }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const positions = route.map((c) => [c.lat, c.lng] as [number, number]);
  const center = route.length > 0
    ? ([route[Math.floor(route.length / 2)].lat, route[Math.floor(route.length / 2)].lng] as [number, number])
    : ([46.2276, 2.2137] as [number, number]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!mapRef.current) return;

    // Add start/end markers
    if (route.length > 0) {
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#2D6A4F;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const endIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#F4A261;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const startMarker = L.marker([route[0].lat, route[0].lng], { icon: startIcon });
      startMarker.addTo(mapRef.current);
      markersRef.current.push(startMarker);

      if (route.length > 1) {
        const endMarker = L.marker([route[route.length - 1].lat, route[route.length - 1].lng], { icon: endIcon });
        endMarker.addTo(mapRef.current);
        markersRef.current.push(endMarker);
      }
    }

    // Add stop markers
    stops.forEach((stop) => {
      if (!stop.coordinate || !mapRef.current) return;
      const emoji = stopTypeEmoji[stop.type] || '📍';
      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([stop.coordinate.lat, stop.coordinate.lng], { icon });
      marker.bindPopup(`<b>${stop.name}</b>`);
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (route.length > 1 && mapRef.current) {
      const bounds = L.latLngBounds(positions);
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [route, stops]);

  return (
    <MapContainer
      center={center}
      zoom={route.length === 1 ? 13 : 10}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {positions.length > 1 && (
        <Polyline positions={positions} color="#2D6A4F" weight={4} opacity={0.85} />
      )}
    </MapContainer>
  );
}
