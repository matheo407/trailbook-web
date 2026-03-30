'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHikes } from '@/hooks/useHikes';
import { useCompanions } from '@/hooks/useCompanions';
import { getHike } from '@/lib/db';
import CompanionSelector from '@/components/CompanionSelector';
import PhotoUpload from '@/components/PhotoUpload';
import RatingStars from '@/components/RatingStars';
import MultiRouteDrawer from '@/components/MultiRouteDrawer';
import PlaceSearch, { PlaceResult } from '@/components/PlaceSearch';
import TagInput from '@/components/TagInput';
import { RouteSegment, Difficulty, HikeStatus, Hike, NamedLocation } from '@/types';
import { genId } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyOptions: { value: Difficulty; label: string; color: string }[] = [
  { value: 'facile', label: 'Facile', color: 'bg-green-500' },
  { value: 'moyen', label: 'Moyen', color: 'bg-orange-400' },
  { value: 'difficile', label: 'Difficile', color: 'bg-red-500' },
];

export default function EditHikePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { updateHike } = useHikes();
  const { companions, createCompanion } = useCompanions();

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hike, setHike] = useState<Hike | null>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<HikeStatus>('planifiée');
  const [date, setDate] = useState('');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [routes, setRoutes] = useState<RouteSegment[]>([]);
  const [comments, setComments] = useState('');
  const [departureLocation, setDepartureLocation] = useState<NamedLocation | undefined>();
  const [arrivalLocation, setArrivalLocation] = useState<NamedLocation | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    async function load() {
      const h = await getHike(id);
      if (!h) { router.push('/randos'); return; }
      setHike(h);
      setName(h.name);
      setStatus(h.status);
      setDate(h.date || '');
      setDistance(h.distance?.toString() || '');
      setElevation(h.elevation?.toString() || '');
      if (h.duration) {
        setDurationHours(Math.floor(h.duration / 60).toString());
        setDurationMinutes((h.duration % 60).toString());
      }
      setDifficulty(h.difficulty || '');
      setRegion(h.region || '');
      setDescription(h.description || '');
      setRating(h.rating || 0);
      setCompanionIds(h.companionIds);
      setPhotos(h.photos);
      setRoutes(h.routes.length > 0 ? h.routes : [{ id: genId(), name: 'Tracé principal', coordinates: [] }]);
      setComments(h.comments || '');
      setDateEnd(h.dateEnd || '');
      setDepartureLocation(h.departureLocation);
      setArrivalLocation(h.arrivalLocation);
      setTags(h.tags || []);
      setLoaded(true);
    }
    if (typeof window !== 'undefined') load();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hike) return;
    setSaving(true);
    try {
      const hours = parseInt(durationHours || '0');
      const minutes = parseInt(durationMinutes || '0');
      const duration = hours * 60 + minutes || undefined;
      await updateHike(id, {
        name: name.trim(), status,
        date: date || undefined,
        distance: distance ? parseFloat(distance) : undefined,
        elevation: elevation ? parseInt(elevation) : undefined,
        duration,
        difficulty: difficulty || undefined,
        region: region.trim() || undefined,
        description: description.trim() || undefined,
        rating: status === 'faite' && rating > 0 ? rating : undefined,
        companionIds, photos,
        routes: routes.filter((s) => s.coordinates.length > 0),
        comments: comments.trim() || undefined,
        departureLocation,
        arrivalLocation,
        tags,
        dateEnd: dateEnd || undefined,
      });
      router.push(`/randos/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href={`/randos/${id}`} className="p-2 -ml-2 rounded-xl text-gray-500">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Modifier la randonnée</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5 pb-8">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nom <span className="text-red-400">*</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Statut</label>
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {(['planifiée', 'faite'] as HikeStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={cn('flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-150',
                  status === s ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-gray-500')}>
                {s === 'planifiée' ? 'Planifiée' : 'Faite'}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de départ</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de fin</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
              min={date || undefined}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
          </div>
        </div>

        {/* Distance & Dénivelé */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Distance (km)</label>
            <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)}
              placeholder="0" min="0" step="0.1"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dénivelé (m)</label>
            <input type="number" value={elevation} onChange={(e) => setElevation(e.target.value)}
              placeholder="0" min="0"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
          </div>
        </div>

        {/* Durée */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Durée</label>
          <div className="grid grid-cols-2 gap-3">
            <select value={durationHours} onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]">
              <option value="">-- heures</option>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
            </select>
            <select value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]">
              <option value="">-- minutes</option>
              {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{m}min</option>)}
            </select>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulté</label>
          <div className="flex gap-2">
            {difficultyOptions.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => setDifficulty(difficulty === opt.value ? '' : opt.value)}
                className={cn('flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-all duration-150',
                  difficulty === opt.value ? `${opt.color} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200')}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Departure & Arrival */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Points de départ / arrivée</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">🟢 Départ</label>
            <PlaceSearch
              placeholder="Village, parking, col de départ..."
              initialValue={departureLocation?.name}
              onSelect={(p: PlaceResult) => setDepartureLocation({ name: p.name, lat: p.lat, lng: p.lng })}
              onClear={() => setDepartureLocation(undefined)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">🔴 Arrivée</label>
            <PlaceSearch
              placeholder="Identique au départ ou autre lieu..."
              initialValue={arrivalLocation?.name}
              onSelect={(p: PlaceResult) => setArrivalLocation({ name: p.name, lat: p.lat, lng: p.lng })}
              onClear={() => setArrivalLocation(undefined)}
            />
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Région</label>
          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] resize-none" />
        </div>

        {/* Rating */}
        {status === 'faite' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note</label>
            <RatingStars value={rating} onChange={setRating} size={28} />
          </div>
        )}

        {/* Companions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Compagnons</label>
          <CompanionSelector companions={companions} selectedIds={companionIds}
            onChange={setCompanionIds} onCreateCompanion={(name) => createCompanion({ name })} />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos</label>
          <PhotoUpload photos={photos}
            onAdd={(url) => setPhotos([...photos, url])}
            onRemove={(idx) => setPhotos(photos.filter((_, i) => i !== idx))} />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {/* Routes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tracés sur la carte</label>
          <MultiRouteDrawer routes={routes} onChange={setRoutes} hikeName={name || 'tracé'} />
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commentaires</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href={`/randos/${id}`}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-center text-sm font-semibold text-gray-600 bg-white">
            Annuler
          </Link>
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 py-3.5 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold disabled:opacity-50 shadow-sm active:scale-[0.98] transition-transform">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
