'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useHikes } from '@/hooks/useHikes';
import { formatDate, formatDuration } from '@/lib/utils';
import { Calendar, Ruler, TrendingUp, Clock, Mountain } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import DifficultyBadge from '@/components/DifficultyBadge';

export default function TimelinePage() {
  const { hikes, loading } = useHikes();

  const sorted = useMemo(() => {
    return [...hikes]
      .filter((h) => h.date || h.status === 'faite')
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
        const db = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
        return db - da;
      });
  }, [hikes]);

  // Group by year
  const byYear = useMemo(() => {
    const map: Record<string, typeof sorted> = {};
    sorted.forEach((h) => {
      const year = h.date ? h.date.slice(0, 4) : new Date(h.createdAt).getFullYear().toString();
      if (!map[year]) map[year] = [];
      map[year].push(h);
    });
    return Object.entries(map).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }, [sorted]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
        <p className="text-xs text-gray-400 mt-0.5">{sorted.length} rando{sorted.length !== 1 ? 's' : ''} avec date</p>
      </div>

      <div className="px-4 py-5 pb-28">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Mountain size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune rando avec date</p>
            <p className="text-gray-400 text-sm mt-1">Ajoutez une date à vos randonnées pour les voir ici</p>
          </div>
        ) : (
          byYear.map(([year, yearHikes]) => (
            <div key={year} className="mb-8">
              {/* Year marker */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2D6A4F] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{year}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{yearHikes.length} rando{yearHikes.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Hikes for this year */}
              <div className="space-y-4 ml-2 pl-4 border-l-2 border-gray-100">
                {yearHikes.map((hike) => (
                  <Link key={hike.id} href={`/randos/${hike.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
                      {/* Photo */}
                      {hike.photos[0]?.url ? (
                        <div className="h-44 overflow-hidden relative">
                          <img
                            src={hike.photos[0].url}
                            alt={hike.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <h2 className="font-bold text-white text-base leading-tight">{hike.name}</h2>
                            <StatusBadge status={hike.status} />
                          </div>
                        </div>
                      ) : (
                        <div className="h-16 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-between px-4">
                          <h2 className="font-bold text-white">{hike.name}</h2>
                          <StatusBadge status={hike.status} />
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                          {hike.date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-[#2D6A4F]" />
                              {formatDate(hike.date)}
                            </span>
                          )}
                          {hike.distance && (
                            <span className="flex items-center gap-1">
                              <Ruler size={11} className="text-[#2D6A4F]" />
                              {hike.distance} km
                            </span>
                          )}
                          {hike.elevation && (
                            <span className="flex items-center gap-1">
                              <TrendingUp size={11} className="text-[#2D6A4F]" />
                              {hike.elevation} m
                            </span>
                          )}
                          {hike.duration && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-[#2D6A4F]" />
                              {formatDuration(hike.duration)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {hike.difficulty && <DifficultyBadge difficulty={hike.difficulty} />}
                          {hike.region && (
                            <span className="text-xs text-gray-400">{hike.region}</span>
                          )}
                          {hike.tags && hike.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {hike.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-lg font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {hike.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{hike.description}</p>
                        )}

                        {/* Multiple photos strip */}
                        {hike.photos.length > 1 && (
                          <div className="flex gap-1.5 mt-2 overflow-x-auto">
                            {hike.photos.slice(1, 5).map((photo, i) => (
                              <div key={i} className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden">
                                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {hike.photos.length > 5 && (
                              <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-500">+{hike.photos.length - 5}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
