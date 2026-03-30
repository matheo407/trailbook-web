'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hike } from '@/types';
import { getAllHikes, getHike as dbGetHike, saveHike, deleteHike as dbDeleteHike } from '@/lib/db';
import { pushRow, deleteRow } from '@/lib/sync';
import { genId } from '@/lib/utils';

export function useHikes() {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHikes = useCallback(async () => {
    try {
      const all = await getAllHikes();
      setHikes(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading hikes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadHikes();
    }
  }, [loadHikes]);

  const createHike = useCallback(async (data: Omit<Hike, 'id' | 'createdAt'>): Promise<Hike> => {
    const hike: Hike = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    await saveHike(hike);
    pushRow('hikes', hike as unknown as Record<string, unknown>).catch(() => {});
    await loadHikes();
    return hike;
  }, [loadHikes]);

  const updateHike = useCallback(async (id: string, data: Partial<Hike>): Promise<void> => {
    const existing = await dbGetHike(id);
    if (!existing) throw new Error('Hike not found');
    const updated = { ...existing, ...data };
    await saveHike(updated);
    pushRow('hikes', updated as unknown as Record<string, unknown>).catch(() => {});
    await loadHikes();
  }, [loadHikes]);

  const deleteHike = useCallback(async (id: string): Promise<void> => {
    await dbDeleteHike(id);
    deleteRow('hikes', id).catch(() => {});
    await loadHikes();
  }, [loadHikes]);

  const getHike = useCallback(async (id: string): Promise<Hike | undefined> => {
    return dbGetHike(id);
  }, []);

  return { hikes, loading, createHike, updateHike, deleteHike, getHike };
}
