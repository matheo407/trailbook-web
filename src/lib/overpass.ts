import { Coordinate } from '@/types';

export interface POI {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  tags: Record<string, string>;
}

function getBoundingBox(route: Coordinate[], margin = 0.02) {
  if (route.length === 0) return null;

  const lats = route.map((c) => c.lat);
  const lngs = route.map((c) => c.lng);

  return {
    minLat: Math.min(...lats) - margin,
    maxLat: Math.max(...lats) + margin,
    minLng: Math.min(...lngs) - margin,
    maxLng: Math.max(...lngs) + margin,
  };
}

function getPOIType(tags: Record<string, string>): string {
  if (tags.natural === 'peak') return 'Sommet';
  if (tags.natural === 'spring' || tags.amenity === 'drinking_water') return 'Point d\'eau';
  if (tags.tourism === 'alpine_hut' || tags.amenity === 'shelter') return 'Refuge';
  if (tags.tourism === 'viewpoint') return 'Point de vue';
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') return 'Restaurant';
  if (tags.amenity === 'parking') return 'Parking';
  if (tags.historic) return 'Site historique';
  if (tags.tourism === 'picnic_site' || tags.leisure === 'picnic_table') return 'Aire de pique-nique';
  if (tags.natural === 'waterfall') return 'Cascade';
  if (tags.natural === 'cave_entrance') return 'Grotte';
  return 'Point d\'intérêt';
}

export async function fetchPOIs(route: Coordinate[]): Promise<POI[]> {
  const bbox = getBoundingBox(route);
  if (!bbox) return [];

  const { minLat, maxLat, minLng, maxLng } = bbox;

  const query = `
[out:json][timeout:25];
(
  node["natural"="peak"](${minLat},${minLng},${maxLat},${maxLng});
  node["natural"="spring"](${minLat},${minLng},${maxLat},${maxLng});
  node["amenity"="drinking_water"](${minLat},${minLng},${maxLat},${maxLng});
  node["tourism"="alpine_hut"](${minLat},${minLng},${maxLat},${maxLng});
  node["amenity"="shelter"](${minLat},${minLng},${maxLat},${maxLng});
  node["tourism"="viewpoint"](${minLat},${minLng},${maxLat},${maxLng});
  node["natural"="waterfall"](${minLat},${minLng},${maxLat},${maxLng});
  node["tourism"="picnic_site"](${minLat},${minLng},${maxLat},${maxLng});
  node["amenity"="parking"]["access"!="private"](${minLat},${minLng},${maxLat},${maxLng});
  node["historic"](${minLat},${minLng},${maxLat},${maxLng});
);
out body;
`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  return (data.elements || []).map((el: Record<string, unknown>) => {
    const tags = (el.tags as Record<string, string>) || {};
    return {
      id: String(el.id),
      name: tags.name || tags['name:fr'] || getPOIType(tags),
      type: getPOIType(tags),
      lat: el.lat as number,
      lng: el.lon as number,
      tags,
    };
  });
}
