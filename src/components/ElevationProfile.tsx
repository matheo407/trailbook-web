'use client';

import { useMemo } from 'react';
import { Coordinate } from '@/types';

interface Props {
  route: Coordinate[];
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function ElevationProfile({ route }: Props) {
  const withEle = useMemo(() => route.filter((c) => c.ele !== undefined), [route]);

  const data = useMemo(() => {
    if (withEle.length < 2) return null;

    // Build cumulative distance array
    const points: { dist: number; ele: number }[] = [{ dist: 0, ele: withEle[0].ele! }];
    for (let i = 1; i < withEle.length; i++) {
      const d = points[i - 1].dist + haversineKm(withEle[i - 1], withEle[i]);
      points.push({ dist: d, ele: withEle[i].ele! });
    }

    const minEle = Math.min(...points.map((p) => p.ele));
    const maxEle = Math.max(...points.map((p) => p.ele));
    const totalDist = points[points.length - 1].dist;
    const eleRange = maxEle - minEle || 1;

    return { points, minEle, maxEle, totalDist, eleRange };
  }, [withEle]);

  if (!data || data.points.length < 2) return null;

  const W = 320;
  const H = 100;
  const PAD = { top: 8, bottom: 20, left: 30, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (dist: number) => PAD.left + (dist / data.totalDist) * chartW;
  const toY = (ele: number) => PAD.top + chartH - ((ele - data.minEle) / data.eleRange) * chartH;

  const polylinePoints = data.points.map((p) => `${toX(p.dist).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ');
  const fillPath =
    `M${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} ` +
    data.points.map((p) => `L${toX(p.dist).toFixed(1)},${toY(p.ele).toFixed(1)}`).join(' ') +
    ` L${toX(data.totalDist).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;

  // Y axis labels (min, max)
  const yTicks = [data.minEle, Math.round((data.minEle + data.maxEle) / 2), data.maxEle];
  // X axis labels
  const xTicks = [0, data.totalDist / 2, data.totalDist];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-700 mb-3">Profil altimétrique</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 100 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            y1={toY(tick)}
            x2={W - PAD.right}
            y2={toY(tick)}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Fill area */}
        <path d={fillPath} fill="url(#eleGrad)" />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Y axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 3}
            y={toY(tick) + 3}
            textAnchor="end"
            fontSize="7"
            fill="#9ca3af"
          >
            {Math.round(tick)}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((dist, i) => (
          <text
            key={i}
            x={toX(dist)}
            y={H - 4}
            textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            fontSize="7"
            fill="#9ca3af"
          >
            {dist.toFixed(1)}km
          </text>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>↑ {Math.round(data.maxEle)} m max</span>
        <span>↓ {Math.round(data.minEle)} m min</span>
        <span>Δ {Math.round(data.maxEle - data.minEle)} m</span>
      </div>
    </div>
  );
}
