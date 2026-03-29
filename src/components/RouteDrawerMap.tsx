'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate } from '@/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createDotIcon(color = '#2D6A4F') {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function ClickHandler({ onChange, route }: { onChange: (c: Coordinate[]) => void; route: Coordinate[] }) {
  const routeRef = useRef(route);
  routeRef.current = route;
  useMapEvents({
    click(e) {
      onChange([...routeRef.current, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    },
  });
  return null;
}

interface Props {
  route: Coordinate[];
  onChange: (coordinates: Coordinate[]) => void;
  centerOn?: { lat: number; lng: number } | null;
}

export default function RouteDrawerMap({ route, onChange, centerOn }: Props) {
  const markersRef = useRef<L.Marker[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fly to searched place directly via mapRef — no useMap() needed
  useEffect(() => {
    if (!centerOn || !mapRef.current) return;
    // Avoid flying again if same coords
    if (
      prevCenterRef.current?.lat === centerOn.lat &&
      prevCenterRef.current?.lng === centerOn.lng
    ) return;
    prevCenterRef.current = centerOn;
    mapRef.current.flyTo([centerOn.lat, centerOn.lng], 13, { animate: true, duration: 1 });
  }, [centerOn]);

  // Update route markers
  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!mapRef.current || route.length === 0) return;

    route.forEach((coord, index) => {
      const isFirst = index === 0;
      const isLast = index === route.length - 1 && route.length > 1;
      const color = isFirst ? '#2D6A4F' : isLast ? '#F4A261' : '#52B788';
      const marker = L.marker([coord.lat, coord.lng], { icon: createDotIcon(color) });
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [route]);

  const positions = route.map((c) => [c.lat, c.lng] as [number, number]);

  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      style={{ width: '100%', height: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {positions.length > 1 && (
        <Polyline positions={positions} color="#2D6A4F" weight={3} opacity={0.8} />
      )}
      <ClickHandler onChange={onChange} route={route} />
    </MapContainer>
  );
}
