import { openDB, IDBPDatabase } from 'idb';
import { Hike, Companion, GearItem, Stop } from '@/types';

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
  return db.getAll('hikes');
}

export async function getHike(id: string): Promise<Hike | undefined> {
  const db = await getDb();
  return db.get('hikes', id);
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
