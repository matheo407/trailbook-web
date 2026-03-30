import { supabase } from './supabase';
import {
  getAllHikes, saveHike,
  getAllCompanions, saveCompanion,
  getAllGearItems, saveGearItem,
  getAllStops, saveStop,
} from './db';
import { Hike, Companion, GearItem, Stop } from '@/types';

type Table = 'hikes' | 'companions' | 'gear_items' | 'stops';

// --- Write-through helpers (fire-and-forget) ---

export async function pushRow(table: Table, obj: Record<string, unknown>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from(table).upsert({
    id: obj.id as string,
    user_id: user.id,
    data: obj,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteRow(table: Table, id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
}

// --- Full pull: Supabase → IndexedDB ---

export async function pullFromCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [hikesRes, companionsRes, gearRes, stopsRes] = await Promise.all([
    supabase.from('hikes').select('data').eq('user_id', user.id),
    supabase.from('companions').select('data').eq('user_id', user.id),
    supabase.from('gear_items').select('data').eq('user_id', user.id),
    supabase.from('stops').select('data').eq('user_id', user.id),
  ]);

  await Promise.all([
    ...(hikesRes.data || []).map((r) => saveHike(r.data as Hike)),
    ...(companionsRes.data || []).map((r) => saveCompanion(r.data as Companion)),
    ...(gearRes.data || []).map((r) => saveGearItem(r.data as GearItem)),
    ...(stopsRes.data || []).map((r) => saveStop(r.data as Stop)),
  ]);
}

// --- Full push: IndexedDB → Supabase ---

export async function pushToCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [hikes, companions, gearItems, stops] = await Promise.all([
    getAllHikes(),
    getAllCompanions(),
    getAllGearItems(),
    getAllStops(),
  ]);

  const now = new Date().toISOString();
  const uid = user.id;

  const toRow = (obj: { id: string }) => ({
    id: obj.id,
    user_id: uid,
    data: obj as unknown as Record<string, unknown>,
    updated_at: now,
  });

  await Promise.all([
    hikes.length ? supabase.from('hikes').upsert(hikes.map(toRow)) : Promise.resolve(),
    companions.length ? supabase.from('companions').upsert(companions.map(toRow)) : Promise.resolve(),
    gearItems.length ? supabase.from('gear_items').upsert(gearItems.map(toRow)) : Promise.resolve(),
    stops.length ? supabase.from('stops').upsert(stops.map(toRow)) : Promise.resolve(),
  ]);
}
