'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Coordinate } from '@/types';
import { Undo2, Trash2, Download } from 'lucide-react';
import PlaceSearch, { PlaceResult } from './PlaceSearch';
import GPXImport from './GPXImport';
import { exportGPX } from '@/lib/gpx';

const RouteDrawerMap = dynamic(() => import('./RouteDrawerMap'), { ssr: false });

interface Props {
  route: Coordinate[];
  onChange: (coordinates: Coordinate[]) => void;
  hikeName?: string;
}

export default function RouteDrawer({ route, onChange, hikeName = 'tracé' }: Props) {
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);

  const undoLast = () => onChange(route.slice(0, -1));
  const clearAll = () => onChange([]);

  const handleExportGPX = () => {
    const gpx = exportGPX(hikeName, route);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hikeName.replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      {/* Place search */}
      <PlaceSearch
        placeholder="Chercher un lieu, pic, village..."
        onSelect={(p: PlaceResult) => setCenterOn({ lat: p.lat, lng: p.lng })}
      />

      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 280 }}>
        <RouteDrawerMap route={route} onChange={onChange} centerOn={centerOn} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {route.length === 0
            ? 'Touchez la carte pour ajouter des points'
            : `${route.length} point${route.length > 1 ? 's' : ''} tracé${route.length > 1 ? 's' : ''}`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undoLast}
            disabled={route.length === 0}
            className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-xl disabled:opacity-40"
          >
            <Undo2 size={12} />
            Annuler
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={route.length === 0}
            className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl disabled:opacity-40"
          >
            <Trash2 size={12} />
            Effacer
          </button>
          {route.length > 1 && (
            <button
              type="button"
              onClick={handleExportGPX}
              className="flex items-center gap-1 text-xs text-[#2D6A4F] bg-green-50 px-2.5 py-1.5 rounded-xl"
            >
              <Download size={12} />
              GPX
            </button>
          )}
        </div>
      </div>

      {/* GPX Import */}
      <GPXImport onImport={onChange} />
    </div>
  );
}
