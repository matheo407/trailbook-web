'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hike } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function BoundsFitter({ hikes }: { hikes: Hike[] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints: [number, number][] = [];
    hikes.forEach((hike) => {
      const coords = hike.routes?.flatMap((s) => s.coordinates) ?? [];
      coords.forEach((c) => allPoints.push([c.lat, c.lng]));
    });
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }
  }, [hikes, map]);
  return null;
}

export default function AllHikesMap({ hikes }: { hikes: Hike[] }) {
  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <BoundsFitter hikes={hikes} />
      {hikes.flatMap((hike) => {
        const allCoords = hike.routes?.flatMap((s) => s.coordinates) ?? [];
        if (allCoords.length < 2) return [];
        const positions = allCoords.map((c) => [c.lat, c.lng] as [number, number]);
        const color = hike.status === 'faite' ? '#2D6A4F' : '#74C0FC';
        const startIcon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        return [
          <Polyline
            key={`poly-${hike.id}`}
            positions={positions}
            pathOptions={{ color, weight: 4, opacity: 0.85 }}
          >
            <Popup>
              <div style={{ minWidth: 120 }}>
                <b style={{ fontSize: 14 }}>{hike.name}</b>
                <br />
                <span style={{ color, fontSize: 12 }}>{hike.status === 'faite' ? '✓ Faite' : '📅 Planifiée'}</span>
                {hike.distance && <><br /><span style={{ fontSize: 12, color: '#666' }}>{hike.distance} km</span></>}
                <br />
                <a href={`/randos/${hike.id}`} style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}>
                  Voir les détails →
                </a>
              </div>
            </Popup>
          </Polyline>,
          <Marker key={`marker-${hike.id}`} position={positions[0]} icon={startIcon}>
            <Popup>
              <div>
                <b style={{ fontSize: 13 }}>{hike.name}</b>
                <br />
                <a href={`/randos/${hike.id}`} style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>Voir →</a>
              </div>
            </Popup>
          </Marker>,
        ];
      })}
    </MapContainer>
  );
}
