'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hike, Companion, GearItem } from '@/types';
import { getHike, getAllCompanions, getAllGearItems, getStopsForHike } from '@/lib/db';
import { deleteHike } from '@/lib/db';
import { generateHikeMarkdown } from '@/lib/markdown';
import { formatDate, formatDuration } from '@/lib/utils';
import DifficultyBadge from '@/components/DifficultyBadge';
import StatusBadge from '@/components/StatusBadge';
import RatingStars from '@/components/RatingStars';
import RouteMap from '@/components/RouteMap';
import StopCard from '@/components/StopCard';
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Download,
  MapPin,
  Calendar,
  Ruler,
  TrendingUp,
  Clock,
  Map,
  Users,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { Stop } from '@/types';

export default function HikeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [hike, setHike] = useState<Hike | null>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [h, c, g, s] = await Promise.all([
          getHike(id),
          getAllCompanions(),
          getAllGearItems(),
          getStopsForHike(id),
        ]);
        if (!h) {
          router.push('/randos');
          return;
        }
        setHike(h);
        setCompanions(c);
        setGearItems(g);
        setStops(s.sort((a, b) => a.order - b.order));
      } finally {
        setLoading(false);
      }
    }
    if (typeof window !== 'undefined') load();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette randonnée ? Cette action est irréversible.')) return;
    setDeleting(true);
    try {
      await deleteHike(id);
      router.push('/randos');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!hike) return;
    const markdown = generateHikeMarkdown(hike, stops, companions, gearItems);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hike.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hike) return null;

  const hikeCompanions = companions.filter((c) => hike.companionIds.includes(c.id));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero */}
      <div className="relative">
        {hike.photos[0] ? (
          <div className="h-56 overflow-hidden">
            <img src={hike.photos[0]} alt={hike.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-[#2D6A4F] to-[#52B788]" />
        )}

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-14 pb-4">
          <Link href="/randos" className="bg-black/30 backdrop-blur-sm rounded-full p-2 text-white">
            <ChevronLeft size={20} />
          </Link>
          <Link href={`/randos/${id}/edit`} className="bg-black/30 backdrop-blur-sm rounded-full p-2 text-white">
            <Pencil size={18} />
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        {/* Title card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-xl font-bold text-gray-900 flex-1">{hike.name}</h1>
            <StatusBadge status={hike.status} />
          </div>

          {hike.region && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              <MapPin size={13} />
              {hike.region}
            </div>
          )}

          {/* Departure / Arrival */}
          {(hike.departureLocation || hike.arrivalLocation) && (
            <div className="flex flex-col gap-1.5 mb-3">
              {hike.departureLocation && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-base leading-none">🟢</span>
                  <span className="font-medium">Départ :</span>
                  <span>{hike.departureLocation.name}</span>
                </div>
              )}
              {hike.arrivalLocation && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-base leading-none">🔴</span>
                  <span className="font-medium">Arrivée :</span>
                  <span>{hike.arrivalLocation.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Info grid */}
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

          {hike.difficulty && (
            <div className="mt-3">
              <DifficultyBadge difficulty={hike.difficulty} />
            </div>
          )}

          {hike.status === 'faite' && hike.rating && (
            <div className="mt-3">
              <RatingStars value={hike.rating} size={20} />
            </div>
          )}
        </div>

        {/* Route map */}
        {hike.route.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Map size={16} className="text-[#2D6A4F]" />
              <h2 className="font-semibold text-gray-900 text-sm">Tracé</h2>
            </div>
            <RouteMap route={hike.route} stops={stops} />
          </section>
        )}

        {/* Description */}
        {hike.description && (
          <section className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{hike.description}</p>
          </section>
        )}

        {/* Companions */}
        {hikeCompanions.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-[#2D6A4F]" />
              <h2 className="font-semibold text-gray-900 text-sm">Compagnons</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {hikeCompanions.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 rounded-full text-sm font-medium border border-green-100"
                >
                  <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs">
                    {c.name[0].toUpperCase()}
                  </span>
                  {c.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Stops */}
        {stops.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={16} className="text-[#2D6A4F]" />
              <h2 className="font-semibold text-gray-900 text-sm">Étapes</h2>
            </div>
            <div className="space-y-2">
              {stops.map((stop, index) => (
                <StopCard key={stop.id} stop={stop} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Photos */}
        {hike.photos.length > 1 && (
          <section className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Photos ({hike.photos.length})</h2>
            <div className="grid grid-cols-3 gap-2">
              {hike.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhoto(photo)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        {hike.comments && (
          <section className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-[#2D6A4F]" />
              <h2 className="font-semibold text-gray-900 text-sm">Commentaires</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{hike.comments}</p>
          </section>
        )}

        {/* Planning buttons for planned hikes */}
        {hike.status === 'planifiée' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              href={`/randos/${id}/plan`}
              className="flex flex-col items-center gap-2 bg-[#2D6A4F] text-white py-4 rounded-2xl font-semibold text-sm shadow-sm active:scale-[0.98] transition-transform"
            >
              <ClipboardList size={22} />
              Planifier
            </Link>
            <Link
              href={`/randos/${id}/pois`}
              className="flex flex-col items-center gap-2 bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-semibold text-sm shadow-sm active:scale-[0.98] transition-transform"
            >
              <MapPin size={22} className="text-[#2D6A4F]" />
              Points d&apos;intérêt
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
          >
            <Download size={16} />
            Exporter .md
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Photo lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <img src={activePhoto} alt="Photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
