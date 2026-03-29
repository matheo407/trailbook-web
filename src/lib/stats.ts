import { Hike, Companion } from '@/types';

export interface HikeStats {
  totalDone: number;
  totalPlanned: number;
  totalDistance: number;
  totalElevation: number;
  totalDuration: number;
}

export interface CompanionFrequency {
  companion: Companion;
  count: number;
}

export interface MonthData {
  label: string;
  count: number;
  year: number;
  month: number;
}

export interface DifficultyDistribution {
  facile: number;
  moyen: number;
  difficile: number;
}

export function calculateStats(hikes: Hike[]): HikeStats {
  const done = hikes.filter((h) => h.status === 'faite');
  const planned = hikes.filter((h) => h.status === 'planifiée');

  return {
    totalDone: done.length,
    totalPlanned: planned.length,
    totalDistance: done.reduce((sum, h) => sum + (h.distance || 0), 0),
    totalElevation: done.reduce((sum, h) => sum + (h.elevation || 0), 0),
    totalDuration: done.reduce((sum, h) => sum + (h.duration || 0), 0),
  };
}

export function getCompanionFrequency(
  hikes: Hike[],
  companions: Companion[]
): CompanionFrequency[] {
  const counts: Record<string, number> = {};

  hikes.forEach((hike) => {
    hike.companionIds.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
  });

  return companions
    .map((companion) => ({
      companion,
      count: counts[companion.id] || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function getHikesByMonth(hikes: Hike[]): MonthData[] {
  const months: MonthData[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    const count = hikes.filter((h) => {
      if (!h.date) return false;
      const hikeDate = new Date(h.date);
      return hikeDate.getFullYear() === year && hikeDate.getMonth() === month;
    }).length;

    months.push({ label, count, year, month });
  }

  return months;
}

export function getDifficultyDistribution(hikes: Hike[]): DifficultyDistribution {
  return {
    facile: hikes.filter((h) => h.difficulty === 'facile').length,
    moyen: hikes.filter((h) => h.difficulty === 'moyen').length,
    difficile: hikes.filter((h) => h.difficulty === 'difficile').length,
  };
}
