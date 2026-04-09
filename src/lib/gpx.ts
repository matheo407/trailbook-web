import { Coordinate } from '@/types';

export function parseGPX(content: string): Coordinate[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  const coords: Coordinate[] = [];

  // Try trkpt first (track points), then rtept (route points), then wpt (waypoints)
  const selectors = ['trkpt', 'rtept', 'wpt'];
  for (const selector of selectors) {
    const points = doc.getElementsByTagName(selector);
    if (points.length > 0) {
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const lat = parseFloat(pt.getAttribute('lat') || '');
        const lng = parseFloat(pt.getAttribute('lon') || '');
        if (!isNaN(lat) && !isNaN(lng)) {
          const eleEl = pt.getElementsByTagName('ele')[0];
          const ele = eleEl ? parseFloat(eleEl.textContent || '') : undefined;
          coords.push({ lat, lng, ...(ele !== undefined && !isNaN(ele) ? { ele } : {}) });
        }
      }
      break;
    }
  }

  return coords;
}

export function exportGPX(name: string, route: Coordinate[]): string {
  const now = new Date().toISOString();
  const trkpts = route
    .map((c) => c.ele !== undefined
      ? `    <trkpt lat="${c.lat}" lon="${c.lng}"><ele>${c.ele.toFixed(1)}</ele></trkpt>`
      : `    <trkpt lat="${c.lat}" lon="${c.lng}"></trkpt>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailBook"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${now}</time>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import { Hike, Stop } from '@/types';

export function exportHikeGPX(hike: Hike, stops: Stop[]): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<gpx version="1.1" creator="TrailBook" xmlns="http://www.topografix.com/GPX/1/1">');
  lines.push('  <metadata>');
  lines.push(`    <name>${escapeXml(hike.name)}</name>`);
  lines.push(`    <time>${now}</time>`);
  lines.push('  </metadata>');

  // Waypoints — stops with a coordinate
  for (const stop of stops) {
    if (!stop.coordinate) continue;
    lines.push(`  <wpt lat="${stop.coordinate.lat}" lon="${stop.coordinate.lng}">`);
    if (stop.coordinate.ele !== undefined) lines.push(`    <ele>${stop.coordinate.ele.toFixed(1)}</ele>`);
    lines.push(`    <name>${escapeXml(stop.name)}</name>`);
    if (stop.notes) lines.push(`    <desc>${escapeXml(stop.notes)}</desc>`);
    lines.push(`    <type>${escapeXml(stop.type)}</type>`);
    lines.push('  </wpt>');
  }

  // Tracks — one per route segment
  for (const segment of hike.routes) {
    if (segment.coordinates.length === 0) continue;
    lines.push('  <trk>');
    lines.push(`    <name>${escapeXml(segment.name)}</name>`);
    lines.push('    <trkseg>');
    for (const c of segment.coordinates) {
      if (c.ele !== undefined) {
        lines.push(`      <trkpt lat="${c.lat}" lon="${c.lng}"><ele>${c.ele.toFixed(1)}</ele></trkpt>`);
      } else {
        lines.push(`      <trkpt lat="${c.lat}" lon="${c.lng}"/>`);
      }
    }
    lines.push('    </trkseg>');
    lines.push('  </trk>');
  }

  lines.push('</gpx>');
  return lines.join('\n');
}
