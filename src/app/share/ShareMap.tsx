'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Coord { lat: number; lng: number; ele?: number }
interface Route { name: string; coordinates: Coord[] }
interface Stop { name: string; coordinate?: Coord }

const COLORS = ['#2D6A4F', '#52B788', '#F4A261', '#E76F51', '#457B9D'];

function BoundsFitter({ routes }: { routes: Route[] }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    routes.forEach((r) => r.coordinates.forEach((c) => pts.push([c.lat, c.lng])));
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [20, 20] });
  }, [routes, map]);
  return null;
}

const stopIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#F4A261;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function ShareMap({ routes, stops }: { routes: Route[]; stops?: Stop[] }) {
  return (
    <MapContainer
      center={[46.5, 2.5]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {routes.map((route, i) =>
        route.coordinates.length > 1 ? (
          <Polyline
            key={i}
            positions={route.coordinates.map((c) => [c.lat, c.lng])}
            color={COLORS[i % COLORS.length]}
            weight={3}
            opacity={0.85}
          />
        ) : null
      )}
      {stops?.filter((s) => s.coordinate).map((stop, i) => (
        <Marker key={i} position={[stop.coordinate!.lat, stop.coordinate!.lng]} icon={stopIcon}>
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}
      <BoundsFitter routes={routes} />
    </MapContainer>
  );
}
