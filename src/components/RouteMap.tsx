'use client';

import dynamic from 'next/dynamic';
import { Coordinate, Stop } from '@/types';

const RouteMapInner = dynamic(() => import('./RouteMapInner'), { ssr: false });

interface Props {
  route: Coordinate[];
  stops?: Stop[];
  height?: number;
}

export default function RouteMap({ route, stops = [], height = 260 }: Props) {
  if (route.length === 0) {
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
      <RouteMapInner route={route} stops={stops} />
    </div>
  );
}
