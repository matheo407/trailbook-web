'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stop } from '@/types';
import { getStopsForHike, saveStop, deleteStop as dbDeleteStop } from '@/lib/db';
import { genId } from '@/lib/utils';

export function useStops(hikeId: string) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStops = useCallback(async () => {
    if (!hikeId) return;
    try {
      const all = await getStopsForHike(hikeId);
      setStops(all.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading stops:', error);
    } finally {
      setLoading(false);
    }
  }, [hikeId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadStops();
    }
  }, [loadStops]);

  const createStop = useCallback(async (data: Omit<Stop, 'id' | 'hikeId' | 'order'>): Promise<Stop> => {
    const stop: Stop = {
      ...data,
      id: genId(),
      hikeId,
      order: stops.length,
    };
    await saveStop(stop);
    await loadStops();
    return stop;
  }, [hikeId, stops.length, loadStops]);

  const updateStop = useCallback(async (id: string, data: Partial<Stop>): Promise<void> => {
    const existing = stops.find((s) => s.id === id);
    if (!existing) throw new Error('Stop not found');
    const updated = { ...existing, ...data };
    await saveStop(updated);
    await loadStops();
  }, [stops, loadStops]);

  const deleteStop = useCallback(async (id: string): Promise<void> => {
    await dbDeleteStop(id);
    await loadStops();
  }, [loadStops]);

  const reorderStops = useCallback(async (reordered: Stop[]): Promise<void> => {
    const updated = reordered.map((stop, index) => ({ ...stop, order: index }));
    await Promise.all(updated.map((stop) => saveStop(stop)));
    setStops(updated);
  }, []);

  return { stops, loading, createStop, updateStop, deleteStop, reorderStops };
}
