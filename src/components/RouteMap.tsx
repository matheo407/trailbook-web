'use client';

import dynamic from 'next/dynamic';
import { RouteSegment, Stop } from '@/types';

const RouteMapInner = dynamic(() => import('./RouteMapInner'), { ssr: false });

interface Props {
  routes: RouteSegment[];
  stops?: Stop[];
  height?: number;
  userPosition?: { lat: number; lng: number };
}

export default function RouteMap({ routes, stops = [], height = 260, userPosition }: Props) {
  const hasCoords = routes.some((s) => s.coordinates.length > 0);
  if (!hasCoords) {
    return (
      <div
        className="rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200"
        style={{ height }}
      >
        <div className="text-center text-gray-400">
          <span className="text-2xl">🗺️</span>
          <p className="text-sm mt-1">Aucun tracé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
      <RouteMapInner routes={routes} stops={stops} userPosition={userPosition} />
    </div>
  );
}
