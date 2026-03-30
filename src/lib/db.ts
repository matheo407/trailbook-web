import { openDB, IDBPDatabase } from 'idb';
import { Hike, Companion, GearItem, Stop } from '@/types';

// Migrate hikes from old schema (route: Coordinate[]) to new (routes: RouteSegment[])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateHike(raw: any): Hike {
  const h = raw as Hike & { route?: unknown[] };
  if (!h.routes || h.routes.length === 0) {
    const legacyRoute = h.route;
    if (Array.isArray(legacyRoute) && legacyRoute.length > 0) {
      h.routes = [{ id: 'main', name: 'Tracé principal', coordinates: legacyRoute as Hike['routes'][0]['coordinates'] }];
    } else {
      h.routes = [];
    }
  }
  if (!h.savedPois) h.savedPois = [];
  if (!h.tags) h.tags = [];
  h.gear = (h.gear || []).map((g: Hike['gear'][0] & { quantity?: number }) => ({
    ...g,
    quantity: g.quantity ?? 1,
  }));
  return h as Hike;
}

const DB_NAME = 'trailbook-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('hikes')) {
        db.createObjectStore('hikes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('companions')) {
        db.createObjectStore('companions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('gear_items')) {
        db.createObjectStore('gear_items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('stops')) {
        const stopStore = db.createObjectStore('stops', { keyPath: 'id' });
        stopStore.createIndex('hikeId', 'hikeId', { unique: false });
      }
    },
  });

  return dbInstance;
}

// Hikes
export async function getAllHikes(): Promise<Hike[]> {
  const db = await getDb();
  const raw = await db.getAll('hikes');
  return raw.map(migrateHike);
}

export async function getHike(id: string): Promise<Hike | undefined> {
  const db = await getDb();
  const raw = await db.get('hikes', id);
  return raw ? migrateHike(raw) : undefined;
}

export async function saveHike(hike: Hike): Promise<void> {
  const db = await getDb();
  await db.put('hikes', hike);
}

export async function deleteHike(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('hikes', id);
}

// Companions
export async function getAllCompanions(): Promise<Companion[]> {
  const db = await getDb();
  return db.getAll('companions');
}

export async function saveCompanion(companion: Companion): Promise<void> {
  const db = await getDb();
  await db.put('companions', companion);
}

export async function deleteCompanion(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('companions', id);
}

// Gear Items
export async function getAllGearItems(): Promise<GearItem[]> {
  const db = await getDb();
  return db.getAll('gear_items');
}

export async function saveGearItem(item: GearItem): Promise<void> {
  const db = await getDb();
  await db.put('gear_items', item);
}

export async function deleteGearItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('gear_items', id);
}

// Stops
export async function getAllStops(): Promise<Stop[]> {
  const db = await getDb();
  return db.getAll('stops');
}

export async function getStopsForHike(hikeId: string): Promise<Stop[]> {
  const db = await getDb();
  const stops = await db.getAllFromIndex('stops', 'hikeId', hikeId);
  return stops.sort((a, b) => a.order - b.order);
}

export async function saveStop(stop: Stop): Promise<void> {
  const db = await getDb();
  await db.put('stops', stop);
}

export async function deleteStop(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('stops', id);
}

export async function deleteStopsForHike(hikeId: string): Promise<void> {
  const db = await getDb();
  const stops = await db.getAllFromIndex('stops', 'hikeId', hikeId);
  const tx = db.transaction('stops', 'readwrite');
  await Promise.all(stops.map((stop) => tx.store.delete(stop.id)));
  await tx.done;
}

// Backup & Restore
export async function exportAllData(): Promise<string> {
  const db = await getDb();
  const [hikes, companions, gearItems, stops] = await Promise.all([
    db.getAll('hikes'),
    db.getAll('companions'),
    db.getAll('gear_items'),
    db.getAll('stops'),
  ]);
  return JSON.stringify({ hikes, companions, gearItems, stops, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  const db = await getDb();
  const tx = db.transaction(['hikes', 'companions', 'gear_items', 'stops'], 'readwrite');
  await Promise.all([
    tx.objectStore('hikes').clear(),
    tx.objectStore('companions').clear(),
    tx.objectStore('gear_items').clear(),
    tx.objectStore('stops').clear(),
  ]);
  const puts: Promise<unknown>[] = [];
  (data.hikes || []).forEach((h: Hike) => puts.push(tx.objectStore('hikes').put(h)));
  (data.companions || []).forEach((c: Companion) => puts.push(tx.objectStore('companions').put(c)));
  (data.gearItems || []).forEach((g: GearItem) => puts.push(tx.objectStore('gear_items').put(g)));
  (data.stops || []).forEach((s: Stop) => puts.push(tx.objectStore('stops').put(s)));
  await Promise.all(puts);
  await tx.done;
}
