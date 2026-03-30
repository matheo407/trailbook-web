'use client';

import dynamic from 'next/dynamic';
import { useHikes } from '@/hooks/useHikes';

const AllHikesMap = dynamic(() => import('./AllHikesMap'), { ssr: false });

export default function CartePage() {
  const { hikes, loading } = useHikes();

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 pt-12 flex-shrink-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Carte</h1>
        <p className="text-xs text-gray-500">
          {hikes.filter((h) => h.routes?.some((s) => s.coordinates.length > 0)).length} randonnée{hikes.filter((h) => h.routes?.some((s) => s.coordinates.length > 0)).length !== 1 ? 's' : ''} tracée{hikes.filter((h) => h.routes?.some((s) => s.coordinates.length > 0)).length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1.5 rounded-full bg-[#2D6A4F]" />
          <span className="text-xs text-gray-600">Faite</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1.5 rounded-full bg-[#74C0FC]" />
          <span className="text-xs text-gray-600">Planifiée</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AllHikesMap hikes={hikes} />
        )}
      </div>
    </div>
  );
}
