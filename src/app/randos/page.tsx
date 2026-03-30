'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useHikes } from '@/hooks/useHikes';
import HikeCard from '@/components/HikeCard';
import { Plus, Search, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'faite' | 'planifiée';

export default function RandosPage() {
  const { hikes, loading } = useHikes();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    hikes.forEach((h) => h.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [hikes]);

  const filtered = useMemo(() => {
    let result = [...hikes];

    if (filter !== 'all') {
      result = result.filter((h) => h.status === filter);
    }

    if (selectedTag) {
      result = result.filter((h) => h.tags?.includes(selectedTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.region?.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q) ||
          h.departureLocation?.name.toLowerCase().includes(q) ||
          h.arrivalLocation?.name.toLowerCase().includes(q) ||
          h.tags?.some((t) => t.includes(q))
      );
    }

    return result.sort((a, b) => {
      if (!a.date && !b.date) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [hikes, search, filter, selectedTag]);

  const tabs: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'faite', label: 'Faites' },
    { value: 'planifiée', label: 'Planifiées' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-3 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Mes randonnées</h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une rando..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150',
                filter === tab.value
                  ? 'bg-[#2D6A4F] text-white shadow-sm'
                  : 'bg-[#F8F9FA] text-gray-500 border border-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 mt-2 scrollbar-hide">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  'flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-150',
                  selectedTag === tag
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#F8F9FA] text-gray-500 border border-gray-200'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-3">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mountain size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700">
              {search || filter !== 'all' ? 'Aucun résultat' : 'Aucune randonnée'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {search || filter !== 'all'
                ? 'Modifiez vos critères de recherche'
                : 'Commencez par ajouter une randonnée'}
            </p>
            {!search && filter === 'all' && (
              <Link
                href="/randos/new"
                className="inline-flex items-center gap-2 mt-4 bg-[#2D6A4F] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm"
              >
                <Plus size={16} />
                Nouvelle rando
              </Link>
            )}
          </div>
        ) : (
          filtered.map((hike) => <HikeCard key={hike.id} hike={hike} />)
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
