'use client';

import { useMemo } from 'react';
import { Trophy, Route, TrendingUp, Clock, Users } from 'lucide-react';
import { useHikes } from '@/hooks/useHikes';
import { useCompanions } from '@/hooks/useCompanions';
import {
  calculateStats,
  getCompanionFrequency,
  getHikesByMonth,
  getDifficultyDistribution,
} from '@/lib/stats';
import { formatDuration } from '@/lib/utils';

export default function StatsPage() {
  const { hikes, loading: hikesLoading } = useHikes();
  const { companions, loading: companionsLoading } = useCompanions();

  const stats = useMemo(() => calculateStats(hikes), [hikes]);
  const companionFreq = useMemo(() => getCompanionFrequency(hikes, companions), [hikes, companions]);
  const monthData = useMemo(() => getHikesByMonth(hikes), [hikes]);
  const diffDist = useMemo(() => getDifficultyDistribution(hikes), [hikes]);

  const loading = hikesLoading || companionsLoading;

  const maxMonthCount = Math.max(...monthData.map((m) => m.count), 1);
  const totalDiff = (diffDist.facile + diffDist.moyen + diffDist.difficile) || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Header */}
      <div
        className="px-5 pt-14 pb-6"
        style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}
      >
        <h1 className="text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-green-100 text-sm mt-0.5">Votre bilan de randonnée</p>
      </div>

      <div className="px-4 space-y-5 pt-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Trophy size={20} className="text-[#2D6A4F]" />}
            value={stats.totalDone.toString()}
            label="Randos faites"
            sub={`${stats.totalPlanned} planifiée${stats.totalPlanned !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={<Route size={20} className="text-[#2D6A4F]" />}
            value={stats.totalDistance > 0 ? `${stats.totalDistance.toFixed(0)} km` : '0 km'}
            label="Distance totale"
            sub={stats.totalDistance > 0 ? `~${(stats.totalDistance / Math.max(stats.totalDone, 1)).toFixed(1)} km/rando` : undefined}
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-[#2D6A4F]" />}
            value={stats.totalElevation > 0 ? `${stats.totalElevation.toFixed(0)} m` : '0 m'}
            label="Dénivelé total"
            sub={stats.totalElevation > 0 ? `~${(stats.totalElevation / Math.max(stats.totalDone, 1)).toFixed(0)} m/rando` : undefined}
          />
          <StatCard
            icon={<Clock size={20} className="text-[#2D6A4F]" />}
            value={stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '0h'}
            label="Temps en nature"
            sub={stats.totalDuration > 0 ? `~${formatDuration(Math.round(stats.totalDuration / Math.max(stats.totalDone, 1)))}/rando` : undefined}
          />
        </div>

        {/* Companions */}
        {companionFreq.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Users size={16} className="text-[#2D6A4F]" />
              <h2 className="font-bold text-gray-900 text-sm">Compagnons les plus fréquents</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {companionFreq.map(({ companion, count }, index) => (
                <div key={companion.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: `hsl(${(index * 67) % 360}, 60%, 50%)` }}
                  >
                    {companion.photo ? (
                      <img src={companion.photo} alt={companion.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      companion.name[0].toUpperCase()
                    )}
                  </div>
                  <p className="flex-1 font-medium text-gray-900 text-sm">{companion.name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full bg-[#2D6A4F]" style={{ width: `${(count / companionFreq[0].count) * 60}px` }} />
                    <span className="text-sm font-bold text-[#2D6A4F]">
                      {count}×
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Randos par mois (12 derniers mois)</h2>
          </div>
          <div className="px-4 py-4">
            {monthData.every((m) => m.count === 0) ? (
              <p className="text-center text-gray-400 text-sm py-4">Aucune rando enregistrée avec une date</p>
            ) : (
              <div className="flex items-end gap-1.5 h-24">
                {monthData.map((month) => (
                  <div key={`${month.year}-${month.month}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${(month.count / maxMonthCount) * 72}px`,
                          minHeight: month.count > 0 ? '6px' : '0',
                          backgroundColor: month.count > 0 ? '#2D6A4F' : '#E9ECEF',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Difficulty distribution */}
        {(diffDist.facile + diffDist.moyen + diffDist.difficile) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 text-sm">Répartition par difficulté</h2>
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { label: 'Facile', count: diffDist.facile, color: '#37B24D' },
                { label: 'Moyen', count: diffDist.moyen, color: '#F4A261' },
                { label: 'Difficile', count: diffDist.difficile, color: '#F03E3E' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">{label}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / totalDiff) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {hikes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="text-5xl">📊</span>
            <h2 className="text-base font-bold text-gray-800 mt-4">Pas encore de données</h2>
            <p className="text-gray-500 text-sm mt-2">Ajoutez des randonnées pour voir vos statistiques.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
