'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { RouteSegment, Coordinate } from '@/types';
import { Undo2, Trash2, Download, Plus, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react';
import PlaceSearch, { PlaceResult } from './PlaceSearch';
import GPXImport from './GPXImport';
import { exportGPX } from '@/lib/gpx';
import { genId } from '@/lib/utils';

const RouteDrawerMap = dynamic(() => import('./RouteDrawerMap'), { ssr: false });

const SEGMENT_COLORS = ['#2D6A4F', '#1971C2', '#F03E3E', '#F4A261', '#845EF7', '#20C997'];

interface Props {
  routes: RouteSegment[];
  onChange: (routes: RouteSegment[]) => void;
  hikeName?: string;
}

export default function MultiRouteDrawer({ routes, onChange, hikeName = 'tracé' }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const active = routes[activeIdx] ?? null;

  const updateActive = (coords: Coordinate[]) => {
    const updated = routes.map((s, i) => i === activeIdx ? { ...s, coordinates: coords } : s);
    onChange(updated);
  };

  const addSegment = () => {
    const idx = routes.length;
    const newSeg: RouteSegment = { id: genId(), name: `Tracé ${idx + 1}`, coordinates: [] };
    onChange([...routes, newSeg]);
    setActiveIdx(idx);
  };

  const removeSegment = (idx: number) => {
    const updated = routes.filter((_, i) => i !== idx);
    onChange(updated);
    setActiveIdx(Math.max(0, idx - 1));
  };

  const importToActive = (coords: Coordinate[]) => {
    updateActive(coords);
  };

  const handleExportGPX = () => {
    if (!active) return;
    const gpx = exportGPX(active.name, active.coordinates);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.name.replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveName = (idx: number) => {
    const updated = routes.map((s, i) => i === idx ? { ...s, name: draftName.trim() || s.name } : s);
    onChange(updated);
    setEditingName(null);
  };

  return (
    <div className="space-y-3">
      {/* Segment tabs */}
      <div className="space-y-1.5">
        {routes.map((seg, idx) => {
          const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
          const isActive = idx === activeIdx;
          return (
            <div key={seg.id} className={`rounded-2xl border transition-all ${isActive ? 'border-[#2D6A4F] bg-white shadow-sm' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {editingName === seg.id ? (
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveName(idx)}
                    className="flex-1 text-sm border-b border-[#2D6A4F] outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <button className="flex-1 text-left text-sm font-medium text-gray-800" onClick={() => setActiveIdx(idx)}>
                    {seg.name}
                    <span className="ml-1.5 text-xs text-gray-400 font-normal">({seg.coordinates.length} pts)</span>
                  </button>
                )}
                <div className="flex items-center gap-1">
                  {editingName === seg.id ? (
                    <button onClick={() => saveName(idx)} className="p-1 text-[#2D6A4F]"><Check size={13} /></button>
                  ) : (
                    <button onClick={() => { setEditingName(seg.id); setDraftName(seg.name); }} className="p-1 text-gray-400"><Pencil size={13} /></button>
                  )}
                  <button onClick={() => setActiveIdx(idx)} className="p-1 text-gray-400">
                    {isActive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {routes.length > 1 && (
                    <button onClick={() => removeSegment(idx)} className="p-1 text-red-400"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>

              {/* Expanded editor for active segment */}
              {isActive && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                  <PlaceSearch
                    placeholder="Chercher un lieu..."
                    onSelect={(p: PlaceResult) => setCenterOn({ lat: p.lat, lng: p.lng })}
                  />
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 240 }}>
                    <RouteDrawerMap
                      route={active?.coordinates ?? []}
                      onChange={updateActive}
                      centerOn={centerOn}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {(active?.coordinates.length ?? 0) === 0
                        ? 'Touchez la carte pour tracer'
                        : `${active?.coordinates.length} point${(active?.coordinates.length ?? 0) > 1 ? 's' : ''}`}
                    </p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => updateActive((active?.coordinates ?? []).slice(0, -1))}
                        disabled={(active?.coordinates.length ?? 0) === 0}
                        className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1.5 rounded-xl disabled:opacity-40">
                        <Undo2 size={11} /> Annuler
                      </button>
                      <button type="button" onClick={() => updateActive([])}
                        disabled={(active?.coordinates.length ?? 0) === 0}
                        className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-xl disabled:opacity-40">
                        <Trash2 size={11} /> Effacer
                      </button>
                      {(active?.coordinates.length ?? 0) > 1 && (
                        <button type="button" onClick={handleExportGPX}
                          className="flex items-center gap-1 text-xs text-[#2D6A4F] bg-green-50 px-2 py-1.5 rounded-xl">
                          <Download size={11} /> GPX
                        </button>
                      )}
                    </div>
                  </div>
                  <GPXImport onImport={importToActive} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add segment */}
      <button type="button" onClick={addSegment}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-[#52B788] text-[#2D6A4F] text-sm font-medium active:bg-green-50 transition-colors">
        <Plus size={15} /> Ajouter un tracé
      </button>
    </div>
  );
}
