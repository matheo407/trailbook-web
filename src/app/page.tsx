'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useHikes } from '@/hooks/useHikes';
import HikeCard from '@/components/HikeCard';
import { calculateStats } from '@/lib/stats';
import { Plus, TrendingUp, Map, CheckCircle2, HardDrive } from 'lucide-react';

export default function DashboardPage() {
  const { hikes, loading } = useHikes();

  const stats = useMemo(() => calculateStats(hikes), [hikes]);

  const upcomingHikes = useMemo(() =>
    hikes
      .filter((h) => h.status === 'planifiée')
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 3),
    [hikes]
  );

  const recentHikes = useMemo(() =>
    hikes
      .filter((h) => h.status === 'faite')
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 3),
    [hikes]
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div
        className="px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏔️</span>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TrailBook</h1>
            <p className="text-green-100 text-sm">Votre carnet de randonnées</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center border border-gray-50">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle2 size={18} className="text-[#2D6A4F]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalDone}</p>
            <p className="text-xs text-gray-500 mt-0.5">Randos faites</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center border border-gray-50">
            <div className="flex items-center justify-center mb-1">
              <Map size={18} className="text-[#2D6A4F]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalDistance > 0 ? stats.totalDistance.toFixed(0) : '0'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Kilomètres</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 text-center border border-gray-50">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp size={18} className="text-[#2D6A4F]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalElevation > 0 ? (stats.totalElevation / 1000).toFixed(1) + 'k' : '0'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Dénivelé (m)</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4 flex gap-2">
        <Link href="/carte" className="flex-1 flex flex-col items-center gap-1 bg-white rounded-2xl border border-gray-100 py-3 shadow-sm active:scale-[0.98] transition-transform">
          <Map size={18} className="text-[#2D6A4F]" />
          <span className="text-xs font-medium text-gray-600">Carte</span>
        </Link>
        <Link href="/sauvegarde" className="flex-1 flex flex-col items-center gap-1 bg-white rounded-2xl border border-gray-100 py-3 shadow-sm active:scale-[0.98] transition-transform">
          <HardDrive size={18} className="text-[#2D6A4F]" />
          <span className="text-xs font-medium text-gray-600">Sauvegarde</span>
        </Link>
      </div>

      <div className="px-4 mt-6 space-y-6 pb-6">
        {/* Upcoming hikes */}
        {upcomingHikes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Prochaines randos</h2>
              <Link href="/randos" className="text-sm text-[#2D6A4F] font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingHikes.map((hike) => (
                <HikeCard key={hike.id} hike={hike} />
              ))}
            </div>
          </section>
        )}

        {/* Recent hikes */}
        {recentHikes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Dernières randos</h2>
              <Link href="/randos" className="text-sm text-[#2D6A4F] font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-3">
              {recentHikes.map((hike) => (
                <HikeCard key={hike.id} hike={hike} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && hikes.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl">🏕️</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">Bienvenue sur TrailBook !</h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Enregistrez vos randonnées, planifiez vos aventures et suivez vos progrès.
            </p>
            <Link
              href="/randos/new"
              className="inline-flex items-center gap-2 mt-6 bg-[#2D6A4F] text-white px-6 py-3 rounded-2xl font-semibold text-sm"
            >
              <Plus size={18} />
              Ajouter ma première rando
            </Link>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-3">Chargement...</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/randos/new"
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#2D6A4F] rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform z-40"
        style={{ boxShadow: '0 4px 20px rgba(45,106,79,0.4)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
