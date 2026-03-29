'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate } from '@/types';
import { POI } from '@/lib/overpass';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const poiColors: Record<string, string> = {
  "Sommet": '#6741D9',
  "Point d'eau": '#1971C2',
  "Refuge": '#2D6A4F',
  "Point de vue": '#F4A261',
  "Restaurant": '#F03E3E',
  "Parking": '#495057',
  "Site historique": '#845EF7',
  "Aire de pique-nique": '#37B24D',
  "Cascade": '#339AF0',
  "Grotte": '#868E96',
};

export default function POIMap({ route, pois }: { route: Coordinate[]; pois: POI[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const positions = route.map((c) => [c.lat, c.lng] as [number, number]);
  const center: [number, number] = route.length > 0
    ? [route[Math.floor(route.length / 2)].lat, route[Math.floor(route.length / 2)].lng]
    : [46.2276, 2.2137];

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!mapRef.current) return;

    pois.forEach((poi) => {
      if (!mapRef.current) return;
      const color = poiColors[poi.type] ?? '#868E96';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([poi.lat, poi.lng], { icon });
      marker.bindPopup(`<b>${poi.name}</b><br><span style="color:${color}">${poi.type}</span>`);
      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    if (route.length > 1 && mapRef.current) {
      const bounds = L.latLngBounds(positions);
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [pois, route]);

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {positions.length > 1 && (
        <Polyline positions={positions} color="#2D6A4F" weight={3} opacity={0.8} />
      )}
    </MapContainer>
  );
}
