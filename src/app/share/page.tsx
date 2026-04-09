'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatDate, formatDuration } from '@/lib/utils';
import DifficultyBadge from '@/components/DifficultyBadge';
import RatingStars from '@/components/RatingStars';
import { Calendar, Ruler, TrendingUp, Clock, MapPin, Mountain, PlusCircle } from 'lucide-react';
import { Difficulty, HikeStatus, StopType, Hike, Stop } from '@/types';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { saveHike, saveStop } from '@/lib/db';
import { pushRow } from '@/lib/sync';

const ShareMap = dynamic(() => import('./ShareMap'), { ssr: false });

interface SharedCoord { lat: number; lng: number; ele?: number }
interface SharedRoute { name: string; coordinates: SharedCoord[] }
interface SharedStop {
  name: string;
  type: StopType;
  notes?: string;
  coordinate?: SharedCoord;
  mealDetails?: string;
  journal?: string;
}
interface SharedPOI { id: string; name: string; type: string; lat: number; lng: number }

interface SharedHike {
  name: string;
  status: HikeStatus;
  date?: string;
  dateEnd?: string;
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
  stops?: SharedStop[];
  routes?: SharedRoute[];
  savedPois?: SharedPOI[];
  sharedAt: string;
}

function decode(encoded: string): SharedHike | null {
  try {
    // Try lz-string first (new format)
    const decompressed = decompressFromEncodedURIComponent(encoded);
    if (decompressed) return JSON.parse(decompressed) as SharedHike;
  } catch { /* fall through */ }
  try {
    // Fallback: old base64 format
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as SharedHike;
  } catch { return null; }
}

function ShareContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [hike, setHike] = useState<SharedHike | null>(null);
  const [error, setError] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const d = params.get('d');
    if (!d) { setError(true); return; }
    const decoded = decode(d);
    if (!decoded) { setError(true); return; }
    setHike(decoded);
  }, [params]);

  const handleImport = async () => {
    if (!hike) return;
    setImporting(true);
    try {
      const hikeId = crypto.randomUUID();
      const newHike: Hike = {
        id: hikeId,
        name: hike.name,
        status: hike.status,
        date: hike.date,
        dateEnd: hike.dateEnd,
        distance: hike.distance,
        elevation: hike.elevation,
        duration: hike.duration,
        difficulty: hike.difficulty,
        region: hike.region,
        description: hike.description,
        rating: hike.rating,
        comments: hike.comments,
        tags: hike.tags ?? [],
        departureLocation: hike.departureLocation as Hike['departureLocation'],
        arrivalLocation: hike.arrivalLocation as Hike['arrivalLocation'],
        photos: [],
        companionIds: [],
        gear: [],
        routes: (hike.routes ?? []).map((r) => ({
          id: crypto.randomUUID(),
          name: r.name,
          coordinates: r.coordinates,
        })),
        savedPois: hike.savedPois ?? [],
        createdAt: new Date().toISOString(),
      };
      await saveHike(newHike);
      pushRow('hikes', newHike as unknown as Record<string, unknown>).catch(() => {});

      if (hike.stops) {
        for (let i = 0; i < hike.stops.length; i++) {
          const s = hike.stops[i];
          const stop: Stop = {
            id: crypto.randomUUID(),
            hikeId,
            name: s.name,
            type: s.type,
            notes: s.notes,
            coordinate: s.coordinate,
            mealDetails: s.mealDetails,
            journal: s.journal,
            order: i,
          };
          await saveStop(stop);
          pushRow('stops', stop as unknown as Record<string, unknown>).catch(() => {});
        }
      }

      setImported(true);
      setTimeout(() => router.push(`/randos/${hikeId}`), 800);
    } catch {
      setImporting(false);
    }
  };

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

  const hasRoutes = hike.routes && hike.routes.some((r) => r.coordinates.length > 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D6A4F] to-[#52B788] px-4 pt-14 pb-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white flex-1">{hike.name}</h1>
          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
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
                  <p className="text-xs font-semibold text-gray-800">
                    {formatDate(hike.date)}{hike.dateEnd ? ` → ${formatDate(hike.dateEnd)}` : ''}
                  </p>
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

        {/* Map */}
        {hasRoutes && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-64">
              <ShareMap routes={hike.routes!} stops={hike.stops} />
            </div>
          </div>
        )}

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

        {/* Saved POIs */}
        {hike.savedPois && hike.savedPois.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">📍 Points d&apos;intérêt</h2>
            <div className="space-y-2">
              {hike.savedPois.map((poi) => (
                <div key={poi.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-base">📍</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{poi.name}</p>
                    <p className="text-xs text-[#2D6A4F]">{poi.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={importing || imported}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#2D6A4F] text-white font-semibold text-sm shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <PlusCircle size={18} />
          {imported ? 'Importé !' : importing ? 'Import en cours...' : 'Ajouter à mes randos'}
        </button>

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
