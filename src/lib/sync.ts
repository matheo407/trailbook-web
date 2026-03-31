import { supabase } from './supabase';
import {
  getAllHikes, saveHike,
  getAllCompanions, saveCompanion,
  getAllGearItems, saveGearItem,
  getAllStops, saveStop,
} from './db';
import { Hike, Companion, GearItem, Stop } from '@/types';

type Table = 'hikes' | 'companions' | 'gear_items' | 'stops';

// Debounce buffer: accumulate writes and flush after 3s of inactivity
const pendingWrites = new Map<string, { table: Table; obj: Record<string, unknown> }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushPending() {
  if (pendingWrites.size === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { pendingWrites.clear(); return; }

  const byTable = new Map<Table, Record<string, unknown>[]>();
  for (const { table, obj } of pendingWrites.values()) {
    if (!byTable.has(table)) byTable.set(table, []);
    byTable.get(table)!.push({
      id: obj.id as string,
      user_id: user.id,
      data: obj,
      updated_at: new Date().toISOString(),
    });
  }
  pendingWrites.clear();

  for (const [table, rows] of byTable.entries()) {
    await supabase.from(table).upsert(rows);
  }
}

// --- Write-through helpers (debounced) ---

export function pushRow(table: Table, obj: Record<string, unknown>): Promise<void> {
  const key = `${table}:${obj.id}`;
  pendingWrites.set(key, { table, obj });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushPending().catch(() => {});
  }, 3000);

  return Promise.resolve();
}

export async function deleteRow(table: Table, id: string): Promise<void> {
  // Remove any pending write for this id
  pendingWrites.delete(`${table}:${id}`);

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
