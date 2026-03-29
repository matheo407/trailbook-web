'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { Hike } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AllHikesMap({ hikes }: { hikes: Hike[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<(L.Polyline | L.Marker)[]>([]);
  const router = useRouter();

  useEffect(() => {
    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];
    if (!mapRef.current) return;

    const allPoints: [number, number][] = [];

    hikes.forEach((hike) => {
      if (!hike.route || hike.route.length < 2 || !mapRef.current) return;

      const positions = hike.route.map((c) => [c.lat, c.lng] as [number, number]);
      const color = hike.status === 'faite' ? '#2D6A4F' : '#74C0FC';

      const polyline = L.polyline(positions, {
        color,
        weight: 4,
        opacity: 0.85,
      });
      polyline.bindPopup(
        `<div style="min-width:120px">
          <b style="font-size:14px">${hike.name}</b>
          <br/>
          <span style="color:${color};font-size:12px">${hike.status === 'faite' ? '✓ Faite' : '📅 Planifiée'}</span>
          ${hike.distance ? `<br/><span style="font-size:12px;color:#666">${hike.distance} km</span>` : ''}
          <br/>
          <a href="/randos/${hike.id}" style="font-size:12px;color:#2D6A4F;font-weight:600;text-decoration:none">Voir les détails →</a>
        </div>`
      );
      polyline.addTo(mapRef.current);
      layersRef.current.push(polyline);

      // Start marker
      const startIcon = L.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      const startMarker = L.marker(positions[0], { icon: startIcon });
      startMarker.bindPopup(
        `<div>
          <b style="font-size:13px">${hike.name}</b>
          <br/>
          <a href="/randos/${hike.id}" style="font-size:12px;color:#2D6A4F;font-weight:600">Voir →</a>
        </div>`
      );
      startMarker.addTo(mapRef.current);
      layersRef.current.push(startMarker);

      positions.forEach((p) => allPoints.push(p));
    });

    // Fit bounds if routes exist
    if (allPoints.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(allPoints);
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [hikes]);

  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
    </MapContainer>
  );
}
