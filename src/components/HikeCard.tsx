import Link from 'next/link';
import { Hike } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import StatusBadge from './StatusBadge';
import { formatDate } from '@/lib/utils';
import { MapPin, Ruler, TrendingUp } from 'lucide-react';

interface Props {
  hike: Hike;
}

export default function HikeCard({ hike }: Props) {
  const firstPhoto = hike.photos?.[0]?.url;

  return (
    <Link href={`/randos/${hike.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform duration-100">
        {firstPhoto ? (
          <div className="h-40 overflow-hidden">
            <img src={firstPhoto} alt={hike.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center">
            <span className="text-4xl opacity-60">🏔️</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1">{hike.name}</h3>
            <StatusBadge status={hike.status} />
          </div>

          {hike.date && (
            <p className="text-xs text-gray-500 mb-2">{formatDate(hike.date)}</p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            {hike.difficulty && <DifficultyBadge difficulty={hike.difficulty} />}

            {hike.distance && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                <Ruler size={10} />
                {hike.distance} km
              </span>
            )}

            {hike.elevation && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} />
                {hike.elevation} m
              </span>
            )}

            {hike.region && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={10} />
                {hike.region}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
