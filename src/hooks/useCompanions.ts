'use client';

import { useState, useEffect, useCallback } from 'react';
import { Companion } from '@/types';
import { getAllCompanions, saveCompanion, deleteCompanion as dbDeleteCompanion } from '@/lib/db';
import { genId } from '@/lib/utils';

export function useCompanions() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanions = useCallback(async () => {
    try {
      const all = await getAllCompanions();
      setCompanions(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading companions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadCompanions();
    }
  }, [loadCompanions]);

  const createCompanion = useCallback(async (data: Omit<Companion, 'id' | 'createdAt'>): Promise<Companion> => {
    const companion: Companion = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    await saveCompanion(companion);
    await loadCompanions();
    return companion;
  }, [loadCompanions]);

  const updateCompanion = useCallback(async (id: string, data: Partial<Companion>): Promise<void> => {
    const existing = companions.find((c) => c.id === id);
    if (!existing) throw new Error('Companion not found');
    const updated = { ...existing, ...data };
    await saveCompanion(updated);
    await loadCompanions();
  }, [companions, loadCompanions]);

  const deleteCompanion = useCallback(async (id: string): Promise<void> => {
    await dbDeleteCompanion(id);
    await loadCompanions();
  }, [loadCompanions]);

  return { companions, loading, createCompanion, updateCompanion, deleteCompanion };
}
