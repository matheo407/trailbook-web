'use client';

import { useMemo } from 'react';
import { RouteSegment } from '@/types';

interface Props {
  routes: RouteSegment[];
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const SEGMENT_COLORS = ['#2D6A4F', '#1971C2', '#F03E3E', '#F4A261', '#845EF7', '#20C997'];

export default function ElevationProfile({ routes }: Props) {
  const segmentData = useMemo(() => {
    return routes.map((seg) => {
      const withEle = seg.coordinates.filter((c) => c.ele !== undefined);
      if (withEle.length < 2) return null;
      const points: { dist: number; ele: number }[] = [{ dist: 0, ele: withEle[0].ele! }];
      for (let i = 1; i < withEle.length; i++) {
        const d = points[i - 1].dist + haversineKm(withEle[i - 1], withEle[i]);
        points.push({ dist: d, ele: withEle[i].ele! });
      }
      const minEle = Math.min(...points.map((p) => p.ele));
      const maxEle = Math.max(...points.map((p) => p.ele));
      return { seg, points, minEle, maxEle, totalDist: points[points.length - 1].dist };
    }).filter(Boolean) as { seg: RouteSegment; points: { dist: number; ele: number }[]; minEle: number; maxEle: number; totalDist: number }[];
  }, [routes]);

  if (segmentData.length === 0) return null;

  const globalMin = Math.min(...segmentData.map((d) => d.minEle));
  const globalMax = Math.max(...segmentData.map((d) => d.maxEle));
  const eleRange = globalMax - globalMin || 1;
  const maxDist = Math.max(...segmentData.map((d) => d.totalDist));

  const W = 320; const H = 100;
  const PAD = { top: 8, bottom: 20, left: 32, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (dist: number) => PAD.left + (dist / maxDist) * chartW;
  const toY = (ele: number) => PAD.top + chartH - ((ele - globalMin) / eleRange) * chartH;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-700 mb-3">Profil altimétrique</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }} preserveAspectRatio="none">
        <defs>
          {segmentData.map((_, idx) => (
            <linearGradient key={idx} id={`eleGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid */}
        {[globalMin, (globalMin + globalMax) / 2, globalMax].map((tick) => (
          <line key={tick} x1={PAD.left} y1={toY(tick)} x2={W - PAD.right} y2={toY(tick)} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}

        {segmentData.map((d, idx) => {
          const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
          const polyline = d.points.map((p) => `${toX(p.dist).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ');
          const fill = `M${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} ` +
            d.points.map((p) => `L${toX(p.dist).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ') +
            ` L${toX(d.totalDist).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;
          return (
            <g key={d.seg.id}>
              <path d={fill} fill={`url(#eleGrad${idx})`} />
              <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Y labels */}
        {[globalMin, globalMax].map((tick) => (
          <text key={tick} x={PAD.left - 3} y={toY(tick) + 3} textAnchor="end" fontSize="7" fill="#9ca3af">{Math.round(tick)}</text>
        ))}
        {/* X labels */}
        {[0, maxDist / 2, maxDist].map((dist, i) => (
          <text key={i} x={toX(dist)} y={H - 4} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontSize="7" fill="#9ca3af">{dist.toFixed(1)}km</text>
        ))}
      </svg>

      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>↑ {Math.round(globalMax)} m max</span>
        <span>↓ {Math.round(globalMin)} m min</span>
        <span>Δ {Math.round(globalMax - globalMin)} m</span>
      </div>

      {segmentData.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {segmentData.map((d, idx) => (
            <div key={d.seg.id} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }} />
              <span className="text-xs text-gray-500">{d.seg.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
