'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, RefreshCw, Droplets, Mountain, Tent, Eye, Trees, MapPin, Utensils, History, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useHikes } from '@/hooks/useHikes';
import { fetchPOIs, POI } from '@/lib/overpass';
import { Hike, Coordinate, SavedPOI } from '@/types';

const POIMap = dynamic(() => import('./POIMap'), { ssr: false });

const poiTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Sommet":             { icon: <Mountain size={16} />,     color: '#6741D9' },
  "Point d'eau":        { icon: <Droplets size={16} />,     color: '#1971C2' },
  "Refuge":             { icon: <Tent size={16} />,         color: '#2D6A4F' },
  "Point de vue":       { icon: <Eye size={16} />,          color: '#F4A261' },
  "Restaurant":         { icon: <Utensils size={16} />,     color: '#F03E3E' },
  "Parking":            { icon: <MapPin size={16} />,       color: '#495057' },
  "Site historique":    { icon: <History size={16} />,      color: '#845EF7' },
  "Aire de pique-nique":{ icon: <Trees size={16} />,        color: '#37B24D' },
  "Cascade":            { icon: <Droplets size={16} />,     color: '#339AF0' },
  "Grotte":             { icon: <Mountain size={16} />,     color: '#868E96' },
  "Point d'intérêt":   { icon: <MapPin size={16} />,       color: '#868E96' },
};

function getTypeConfig(type: string) {
  return poiTypeConfig[type] ?? poiTypeConfig["Point d'intérêt"];
}

const ALL_FILTER = 'Tous';

export default function POIsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getHike, updateHike } = useHikes();

  const [hike, setHike] = useState<Hike | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      getHike(id).then((h) => {
        if (h) setHike(h);
        else router.push('/randos');
      });
    }
  }, [id, getHike, router]);

  const loadPOIs = useCallback(async (route: Coordinate[]) => {
    if (route.length < 2) {
      setError('Ajoutez un tracé à cette randonnée pour découvrir les points d\'intérêt à proximité.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPOIs(route);
      setPois(results);
      if (results.length === 0) {
        setError('Aucun point d\'intérêt trouvé à proximité du tracé.');
      }
    } catch {
      setError('Erreur lors de la recherche. Vérifiez votre connexion internet et réessayez.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hike) {
      const allCoords = hike.routes.flatMap((s) => s.coordinates);
      loadPOIs(allCoords);
    }
  }, [hike, loadPOIs]);

  const toggleSavePOI = async (poi: POI) => {
    if (!hike) return;
    const isSaved = hike.savedPois.some((p) => p.id === poi.id);
    const newSaved: SavedPOI[] = isSaved
      ? hike.savedPois.filter((p) => p.id !== poi.id)
      : [...hike.savedPois, { id: poi.id, name: poi.name, type: poi.type, lat: poi.lat, lng: poi.lng }];
    const updated = { ...hike, savedPois: newSaved };
    setHike(updated);
    await updateHike(hike.id, { savedPois: newSaved });
  };

  const types = [ALL_FILTER, ...Array.from(new Set(pois.map((p) => p.type)))];
  const filtered = filter === ALL_FILTER ? pois : pois.filter((p) => p.type === filter);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 py-3 pt-12">
          <Link href={`/randos/${id}`} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Points d'intérêt</p>
            <h1 className="font-bold text-gray-900 truncate">{hike?.name ?? '...'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* List / Map toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  view === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Carte
              </button>
            </div>
            {hike && hike.routes.flatMap((s) => s.coordinates).length >= 2 && (
              <button
                onClick={() => loadPOIs(hike.routes.flatMap((s) => s.coordinates))}
                className="p-2 text-[#2D6A4F]"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm mt-4">Recherche en cours...</p>
          <p className="text-gray-400 text-xs mt-1">Interrogation OpenStreetMap</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mx-4 mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Information</p>
            <p className="text-sm text-amber-700 mt-0.5">{error}</p>
            {hike && hike.routes.flatMap((s) => s.coordinates).length < 2 && (
              <Link
                href={`/randos/${id}/edit`}
                className="inline-block mt-2 text-xs text-[#2D6A4F] font-medium underline underline-offset-2"
              >
                Modifier la rando pour ajouter un tracé
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && pois.length > 0 && (
        <>
          {/* Filter chips */}
          <div className="px-4 pt-4 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    filter === type
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {type}
                  {type !== ALL_FILTER && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {pois.filter((p) => p.type === type).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Map view */}
          {view === 'map' && hike && (
            <div className="mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 400 }}>
              <POIMap route={hike.routes.flatMap((s) => s.coordinates)} pois={filtered} />
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="px-4 pt-4 space-y-2">
              <p className="text-xs text-gray-500 mb-1">
                {filtered.length} point{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
              </p>
              {filtered.map((poi) => {
                const config = getTypeConfig(poi.type);
                return (
                  <div
                    key={poi.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{poi.name}</p>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: config.color }}>{poi.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}</p>
                    </div>
                    <button
                      onClick={() => toggleSavePOI(poi)}
                      className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                        hike?.savedPois.some((p) => p.id === poi.id)
                          ? 'text-[#2D6A4F] bg-green-50'
                          : 'text-gray-300 bg-gray-50'
                      }`}
                    >
                      {hike?.savedPois.some((p) => p.id === poi.id)
                        ? <BookmarkCheck size={16} />
                        : <Bookmark size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
