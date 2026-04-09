import clsx, { ClassValue } from 'clsx';

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function cn(...classes: ClassValue[]): string {
  return clsx(...classes);
}

// Haversine distance in meters between two lat/lng points
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface TrailInfo {
  distanceM: number;       // meters to next stop (along track)
  elevationGain: number;   // positive elevation to next stop
  elevationLoss: number;   // negative elevation to next stop
  nextStopName: string;
  offTrackM: number;       // distance from track in meters (0 = on track)
}

interface Coord { lat: number; lng: number; ele?: number }
interface RouteSegment { coordinates: Coord[] }
interface Stop { name: string; coordinate?: Coord; order: number }

export function computeTrailInfo(
  userLat: number,
  userLng: number,
  routes: RouteSegment[],
  stops: Stop[]
): TrailInfo | null {
  // Flatten all route coordinates into a single sequence
  const track: Coord[] = routes.flatMap((r) => r.coordinates);
  if (track.length < 2) return null;

  // Find the closest point on the track
  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < track.length; i++) {
    const d = haversine(userLat, userLng, track[i].lat, track[i].lng);
    if (d < minDist) { minDist = d; closestIdx = i; }
  }

  // Find next stop that has a coordinate and is ahead on the track
  const stopsWithCoord = stops
    .filter((s) => s.coordinate)
    .sort((a, b) => a.order - b.order);

  if (stopsWithCoord.length === 0) return null;

  // Find which track index each stop is closest to
  const stopTrackIdx = stopsWithCoord.map((s) => {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < track.length; i++) {
      const d = haversine(s.coordinate!.lat, s.coordinate!.lng, track[i].lat, track[i].lng);
      if (d < bestD) { bestD = d; best = i; }
    }
    return { stop: s, trackIdx: best };
  });

  // Pick the first stop ahead of our position
  const nextEntry = stopTrackIdx.find((e) => e.trackIdx > closestIdx);
  if (!nextEntry) return null;

  // Sum distance + elevation from closestIdx to stopTrackIdx
  let distanceM = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  for (let i = closestIdx; i < nextEntry.trackIdx; i++) {
    distanceM += haversine(track[i].lat, track[i].lng, track[i + 1].lat, track[i + 1].lng);
    if (track[i].ele !== undefined && track[i + 1].ele !== undefined) {
      const diff = track[i + 1].ele! - track[i].ele!;
      if (diff > 0) elevationGain += diff;
      else elevationLoss += Math.abs(diff);
    }
  }

  return {
    distanceM,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    nextStopName: nextEntry.stop.name,
    offTrackM: Math.round(minDist),
  };
}
