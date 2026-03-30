'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDate, formatDuration } from '@/lib/utils';
import DifficultyBadge from '@/components/DifficultyBadge';
import RatingStars from '@/components/RatingStars';
import { Calendar, Ruler, TrendingUp, Clock, MapPin, Mountain } from 'lucide-react';
import { Difficulty, HikeStatus } from '@/types';

interface SharedHike {
  name: string;
  status: HikeStatus;
  date?: string;
  distance?: number;
  elevation?: number;
  duration?: number;
  difficulty?: Difficulty;
  region?: string;
  description?: string;
  rating?: number;
  comments?: string;
  tags?: string[];
  departureLocation?: { name: string };
  arrivalLocation?: { name: string };
  companionNames?: string[];
  stops?: { name: string; type: string; notes?: string; mealDetails?: string; journal?: string }[];
  sharedAt: string;
}

function decodeShare(encoded: string): SharedHike | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as SharedHike;
  } catch {
    return null;
  }
}

function ShareContent() {
  const params = useSearchParams();
  const [hike, setHike] = useState<SharedHike | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const d = params.get('d');
    if (!d) { setError(true); return; }
    const decoded = decodeShare(d);
    if (!decoded) { setError(true); return; }
    setHike(decoded);
  }, [params]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-8 text-center">
        <Mountain size={48} className="text-gray-200 mb-4" />
        <h1 className="text-lg font-bold text-gray-700">Lien invalide</h1>
        <p className="text-sm text-gray-400 mt-2">Ce lien de partage est incorrect ou a expiré.</p>
      </div>
    );
  }

  if (!hike) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#52B788] px-4 pt-14 pb-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white flex-1">{hike.name}</h1>
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
            hike.status === 'faite' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
          }`}>
            {hike.status === 'faite' ? '✅ Faite' : '📅 Planifiée'}
          </span>
        </div>
        {hike.region && (
          <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
            <MapPin size={13} />
            {hike.region}
          </div>
        )}
        <p className="text-white/60 text-xs mt-3">
          Partagé via TrailBook · {new Date(hike.sharedAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-2">
            {hike.date && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Calendar size={14} className="text-[#2D6A4F]" />
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-xs font-semibold text-gray-800">{formatDate(hike.date)}</p>
                </div>
              </div>
            )}
            {hike.distance && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Ruler size={14} className="text-[#2D6A4F]" />
                <div>
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="text-xs font-semibold text-gray-800">{hike.distance} km</p>
                </div>
              </div>
            )}
            {hike.elevation && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <TrendingUp size={14} className="text-[#2D6A4F]" />
                <div>
                  <p className="text-xs text-gray-400">Dénivelé</p>
                  <p className="text-xs font-semibold text-gray-800">{hike.elevation} m</p>
                </div>
              </div>
            )}
            {hike.duration && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Clock size={14} className="text-[#2D6A4F]" />
                <div>
                  <p className="text-xs text-gray-400">Durée</p>
                  <p className="text-xs font-semibold text-gray-800">{formatDuration(hike.duration)}</p>
                </div>
              </div>
            )}
          </div>

          {(hike.departureLocation || hike.arrivalLocation) && (
            <div className="flex flex-col gap-1.5 mt-3">
              {hike.departureLocation && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>🟢</span><span className="font-medium">Départ :</span><span>{hike.departureLocation.name}</span>
                </div>
              )}
              {hike.arrivalLocation && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>🔴</span><span className="font-medium">Arrivée :</span><span>{hike.arrivalLocation.name}</span>
                </div>
              )}
            </div>
          )}

          {hike.difficulty && <div className="mt-3"><DifficultyBadge difficulty={hike.difficulty} /></div>}
          {hike.status === 'faite' && hike.rating && (
            <div className="mt-3"><RatingStars value={hike.rating} size={20} /></div>
          )}
          {hike.tags && hike.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hike.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium rounded-xl">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {hike.description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{hike.description}</p>
          </div>
        )}

        {/* Companions */}
        {hike.companionNames && hike.companionNames.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">👥 Compagnons</h2>
            <div className="flex flex-wrap gap-2">
              {hike.companionNames.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 rounded-full text-sm font-medium border border-green-100">
                  <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs">{name[0].toUpperCase()}</span>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stops */}
        {hike.stops && hike.stops.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">🗺️ Étapes</h2>
            <div className="space-y-3">
              {hike.stops.map((stop, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{stop.name}</p>
                    {stop.notes && <p className="text-xs text-gray-500 mt-0.5">{stop.notes}</p>}
                    {stop.mealDetails && (
                      <div className="mt-1.5 bg-orange-50 rounded-lg px-2 py-1.5">
                        <p className="text-xs text-orange-700"><span className="font-medium">Menu : </span>{stop.mealDetails}</p>
                      </div>
                    )}
                    {stop.journal && (
                      <div className="mt-1.5 bg-white rounded-lg px-2.5 py-2 border-l-2 border-[#52B788]">
                        <p className="text-xs font-medium text-[#2D6A4F] mb-1">📓 Journal</p>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{stop.journal}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {hike.comments && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">💬 Commentaires</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{hike.comments}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Créé avec <span className="font-semibold text-[#2D6A4F]">TrailBook</span></p>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
