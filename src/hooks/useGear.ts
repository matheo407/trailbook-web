'use client';

import { useState, useEffect, useCallback } from 'react';
import { GearItem } from '@/types';
import { getAllGearItems, saveGearItem, deleteGearItem as dbDeleteGearItem } from '@/lib/db';
import { genId } from '@/lib/utils';

export function useGear() {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGear = useCallback(async () => {
    try {
      const all = await getAllGearItems();
      setGearItems(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading gear:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadGear();
    }
  }, [loadGear]);

  const createGearItem = useCallback(async (data: Omit<GearItem, 'id' | 'createdAt'>): Promise<GearItem> => {
    const item: GearItem = {
      ...data,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    await saveGearItem(item);
    await loadGear();
    return item;
  }, [loadGear]);

  const updateGearItem = useCallback(async (id: string, data: Partial<GearItem>): Promise<void> => {
    const existing = gearItems.find((g) => g.id === id);
    if (!existing) throw new Error('Gear item not found');
    const updated = { ...existing, ...data };
    await saveGearItem(updated);
    await loadGear();
  }, [gearItems, loadGear]);

  const deleteGearItem = useCallback(async (id: string): Promise<void> => {
    await dbDeleteGearItem(id);
    await loadGear();
  }, [loadGear]);

  return { gearItems, loading, createGearItem, updateGearItem, deleteGearItem };
}
