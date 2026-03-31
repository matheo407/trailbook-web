'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Download, UtensilsCrossed, Coffee, Tent, Eye, MapPin, Check, Map, X
} from 'lucide-react';
import { useHikes } from '@/hooks/useHikes';
import { useStops } from '@/hooks/useStops';
import { useGear } from '@/hooks/useGear';
import { useCompanions } from '@/hooks/useCompanions';
import RouteMap from '@/components/RouteMap';
import { Coordinate, Hike, Stop, StopType, GearItem, RouteSegment } from '@/types';
import { genId, formatDuration } from '@/lib/utils';
import { saveStop } from '@/lib/db';
import { generateHikeMarkdown } from '@/lib/markdown';

const StopMapPicker = dynamic(() => import('@/components/StopMapPickerInner'), { ssr: false });

const stopTypeConfig: Record<StopType, { label: string; icon: React.ReactNode; color: string }> = {
  repas:       { label: 'Repas',        icon: <UtensilsCrossed size={16} />, color: '#F4A261' },
  repos:       { label: 'Repos',        icon: <Coffee size={16} />,          color: '#74C0FC' },
  bivouac:     { label: 'Bivouac',      icon: <Tent size={16} />,            color: '#845EF7' },
  point_de_vue:{ label: 'Point de vue', icon: <Eye size={16} />,             color: '#20C997' },
  autre:       { label: 'Autre',        icon: <MapPin size={16} />,          color: '#868E96' },
};

const gearCategoryLabel: Record<string, string> = {
  vêtements: 'Vêtements',
  nourriture: 'Nourriture',
  équipement: 'Équipement',
  sécurité: 'Sécurité',
  navigation: 'Navigation',
  médical: 'Médical',
  autre: 'Autre',
};

interface StopFormData {
  name: string;
  type: StopType;
  notes: string;
  mealDetails: string;
  journal: string;
  coordinate?: Coordinate;
}

const defaultForm: StopFormData = { name: '', type: 'repos', notes: '', mealDetails: '', journal: '', coordinate: undefined };

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getHike, updateHike } = useHikes();
  const { stops, createStop, updateStop, deleteStop, reorderStops, loading: stopsLoading } = useStops(id);
  const { gearItems, loading: gearLoading } = useGear();
  const { companions } = useCompanions();

  const [hike, setHike] = useState<Hike | null>(null);
  const [addingStop, setAddingStop] = useState(false);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [form, setForm] = useState<StopFormData>(defaultForm);
  const [activeTab, setActiveTab] = useState<'etapes' | 'materiel'>('etapes');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      getHike(id).then((h) => {
        if (h) setHike(h);
        else router.push('/randos');
      });
    }
  }, [id, getHike, router]);

  const handleAddStop = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createStop({
        name: form.name.trim(),
        type: form.type,
        notes: form.notes.trim() || undefined,
        mealDetails: form.type === 'repas' && form.mealDetails.trim() ? form.mealDetails.trim() : undefined,
        journal: form.journal.trim() || undefined,
        coordinate: form.coordinate,
      });
      setForm(defaultForm);
      setAddingStop(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditStop = async (stopId: string) => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await updateStop(stopId, {
        name: form.name.trim(),
        type: form.type,
        notes: form.notes.trim() || undefined,
        mealDetails: form.type === 'repas' && form.mealDetails.trim() ? form.mealDetails.trim() : undefined,
        journal: form.journal.trim() || undefined,
        coordinate: form.coordinate,
      });
      setEditingStopId(null);
      setForm(defaultForm);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (stop: Stop) => {
    setEditingStopId(stop.id);
    setForm({
      name: stop.name,
      type: stop.type,
      notes: stop.notes || '',
      mealDetails: stop.mealDetails || '',
      journal: stop.journal || '',
      coordinate: stop.coordinate,
    });
    setAddingStop(false);
  };

  const moveStop = async (index: number, dir: -1 | 1) => {
    const newStops = [...stops];
    const target = index + dir;
    if (target < 0 || target >= newStops.length) return;
    [newStops[index], newStops[target]] = [newStops[target], newStops[index]];
    await reorderStops(newStops);
  };

  const toggleGear = async (gearId: string) => {
    if (!hike) return;
    const existing = hike.gear.find((g) => g.gearId === gearId);
    let newGear;
    if (existing) {
      newGear = hike.gear.map((g) =>
        g.gearId === gearId ? { ...g, packed: !g.packed } : g
      );
    } else {
      newGear = [...hike.gear, { gearId, packed: true, quantity: 1 }];
    }
    const updated = { ...hike, gear: newGear };
    setHike(updated);
    await updateHike(hike.id, { gear: newGear });
  };

  const setGearQuantity = async (gearId: string, quantity: number) => {
    if (!hike || quantity < 1) return;
    const existing = hike.gear.find((g) => g.gearId === gearId);
    let newGear;
    if (existing) {
      newGear = hike.gear.map((g) => g.gearId === gearId ? { ...g, quantity } : g);
    } else {
      newGear = [...hike.gear, { gearId, packed: true, quantity }];
    }
    const updated = { ...hike, gear: newGear };
    setHike(updated);
    await updateHike(hike.id, { gear: newGear });
  };

  const handleExportMarkdown = () => {
    if (!hike) return;
    const md = generateHikeMarkdown(hike, stops, companions, gearItems);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hike.name.replace(/\s+/g, '_')}_preparation.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const groupedGear = gearItems.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (!hike) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 py-3 pt-12">
          <Link href={`/randos/${id}`} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Planification</p>
            <h1 className="font-bold text-gray-900 truncate">{hike.name}</h1>
          </div>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 text-sm bg-[#2D6A4F] text-white px-3 py-1.5 rounded-xl"
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-0 gap-4 border-t border-gray-50">
          <button
            onClick={() => setActiveTab('etapes')}
            className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'etapes'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500'
            }`}
          >
            Étapes ({stops.length})
          </button>
          <button
            onClick={() => setActiveTab('materiel')}
            className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'materiel'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500'
            }`}
          >
            Matériel ({hike.gear.filter((g) => g.packed).length}/{gearItems.length})
          </button>
        </div>
      </div>

      {/* Map (always visible) */}
      {hike.routes.some((s) => s.coordinates.length > 0) && (
        <div className="px-4 pt-4">
          <RouteMap routes={hike.routes} stops={stops} height={200} />
        </div>
      )}

      {/* Tab: Étapes */}
      {activeTab === 'etapes' && (
        <div className="px-4 pt-4 space-y-3">
          {stopsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : stops.length === 0 && !addingStop ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <span className="text-4xl">🗺️</span>
              <p className="text-gray-500 text-sm mt-3">Aucune étape planifiée</p>
              <p className="text-gray-400 text-xs mt-1">Ajoutez des arrêts, repas, bivouacs...</p>
            </div>
          ) : (
            stops.map((stop, index) => (
              <div key={stop.id}>
                {editingStopId === stop.id ? (
                  <StopForm
                    form={form}
                    setForm={setForm}
                    onSave={() => handleEditStop(stop.id)}
                    onCancel={() => { setEditingStopId(null); setForm(defaultForm); }}
                    saving={saving}
                    label="Modifier l'étape"
                    routes={hike.routes}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: stopTypeConfig[stop.type].color }}
                      >
                        {stopTypeConfig[stop.type].icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-lg font-medium text-white"
                            style={{ backgroundColor: stopTypeConfig[stop.type].color }}
                          >
                            {stopTypeConfig[stop.type].label}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 mt-0.5">{stop.name}</p>
                        {stop.coordinate && (
                          <p className="text-xs text-[#2D6A4F] mt-0.5 flex items-center gap-1">
                            <MapPin size={11} />
                            {stop.coordinate.lat.toFixed(5)}, {stop.coordinate.lng.toFixed(5)}
                          </p>
                        )}
                        {stop.notes && <p className="text-sm text-gray-500 mt-0.5">{stop.notes}</p>}
                        {stop.mealDetails && (
                          <div className="mt-1.5 bg-orange-50 rounded-xl px-2.5 py-1.5">
                            <p className="text-xs font-medium text-orange-700">Menu</p>
                            <p className="text-xs text-orange-600 mt-0.5">{stop.mealDetails}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveStop(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 text-gray-400 disabled:opacity-20"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveStop(index, 1)}
                          disabled={index === stops.length - 1}
                          className="p-1.5 text-gray-400 disabled:opacity-20"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => startEdit(stop)}
                        className="flex-1 text-xs text-[#2D6A4F] font-medium py-1.5 bg-green-50 rounded-xl"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteStop(stop.id)}
                        className="flex-1 text-xs text-red-500 font-medium py-1.5 bg-red-50 rounded-xl"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {addingStop && (
            <StopForm
              form={form}
              setForm={setForm}
              onSave={handleAddStop}
              onCancel={() => { setAddingStop(false); setForm(defaultForm); }}
              saving={saving}
              label="Ajouter l'étape"
              routes={hike.routes}
            />
          )}

          {!addingStop && editingStopId === null && (
            <button
              onClick={() => { setAddingStop(true); setForm(defaultForm); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#52B788] text-[#2D6A4F] font-medium text-sm"
            >
              <Plus size={18} />
              Ajouter une étape
            </button>
          )}
        </div>
      )}

      {/* Tab: Matériel */}
      {activeTab === 'materiel' && (
        <div className="px-4 pt-4 space-y-4">
          {/* Bag weight summary */}
          {(() => {
            const totalWeight = hike.gear
              .filter((g) => g.packed)
              .reduce((sum, g) => {
                const item = gearItems.find((i) => i.id === g.gearId);
                return sum + (item?.weight || 0) * (g.quantity ?? 1);
              }, 0);
            if (totalWeight === 0) return null;
            const kg = (totalWeight / 1000).toFixed(2);
            return (
              <div className="flex items-center justify-between bg-[#2D6A4F]/10 rounded-2xl px-4 py-3">
                <span className="text-sm font-semibold text-[#2D6A4F]">🎒 Poids total du sac</span>
                <span className="text-sm font-bold text-[#2D6A4F]">{totalWeight >= 1000 ? `${kg} kg` : `${totalWeight} g`}</span>
              </div>
            );
          })()}
          {gearLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : gearItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <span className="text-4xl">🎒</span>
              <p className="text-gray-500 text-sm mt-3">Aucun matériel enregistré</p>
              <Link
                href="/materiel"
                className="inline-block mt-3 text-sm text-[#2D6A4F] font-medium underline underline-offset-2"
              >
                Gérer le matériel
              </Link>
            </div>
          ) : (
            Object.entries(groupedGear).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {gearCategoryLabel[category] || category}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const hikeGear = hike.gear.find((g) => g.gearId === item.id);
                    const isPacked = hikeGear?.packed ?? false;
                    const qty = hikeGear?.quantity ?? 1;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => toggleGear(item.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isPacked ? 'bg-[#2D6A4F] border-[#2D6A4F]' : 'border-gray-300'
                          }`}
                        >
                          {isPacked && <Check size={14} strokeWidth={3} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isPacked ? 'text-gray-900' : 'text-gray-500'}`}>{item.name}</p>
                          {item.weight && (
                            <p className="text-xs text-gray-400">{item.weight * qty}g {qty > 1 ? `(${qty}×${item.weight}g)` : ''}</p>
                          )}
                        </div>
                        {isPacked && (
                          <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-1.5 py-0.5">
                            <button type="button" onClick={() => setGearQuantity(item.id, qty - 1)} disabled={qty <= 1}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 disabled:opacity-30 text-base font-bold">−</button>
                            <span className="text-xs font-semibold text-gray-800 min-w-[16px] text-center">{qty}</span>
                            <button type="button" onClick={() => setGearQuantity(item.id, qty + 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 text-base font-bold">+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StopForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  label,
  routes,
}: {
  form: StopFormData;
  setForm: (f: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  label: string;
  routes: RouteSegment[];
}) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#52B788] shadow-sm p-4 space-y-3">
      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(stopTypeConfig) as StopType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm((f: any) => ({ ...f, type: t }))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              form.type === t
                ? 'text-white border-transparent'
                : 'text-gray-600 bg-gray-50 border-gray-200'
            }`}
            style={form.type === t ? { backgroundColor: stopTypeConfig[t].color, borderColor: stopTypeConfig[t].color } : {}}
          >
            {stopTypeConfig[t].icon}
            {stopTypeConfig[t].label}
          </button>
        ))}
      </div>

      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F]"
        placeholder="Nom de l'étape *"
        value={form.name}
        onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
      />

      {form.type === 'repas' && (
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F] resize-none"
          placeholder="Menu / repas prévu..."
          rows={2}
          value={form.mealDetails}
          onChange={(e) => setForm((f: any) => ({ ...f, mealDetails: e.target.value }))}
        />
      )}

      <input
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F]"
        placeholder="Notes (optionnel)"
        value={form.notes}
        onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
      />

      <textarea
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F] resize-none"
        placeholder="📓 Journal — raconte cette étape librement..."
        rows={3}
        value={form.journal}
        onChange={(e) => setForm((f: any) => ({ ...f, journal: e.target.value }))}
      />

      {/* Map coordinate picker */}
      <div>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
            form.coordinate
              ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          <Map size={13} />
          {form.coordinate
            ? `📍 ${form.coordinate.lat.toFixed(4)}, ${form.coordinate.lng.toFixed(4)}`
            : 'Placer sur la carte'}
        </button>
        {form.coordinate && (
          <button
            type="button"
            onClick={() => setForm((f: any) => ({ ...f, coordinate: undefined }))}
            className="ml-2 text-xs text-red-400 underline"
          >
            Supprimer
          </button>
        )}
        {showMap && (
          <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200" style={{ height: 220 }}>
            <StopMapPicker
              routes={routes}
              coordinate={form.coordinate}
              onPick={(coord) => {
                setForm((f: any) => ({ ...f, coordinate: coord }));
                setShowMap(false);
              }}
            />
          </div>
        )}
        {showMap && (
          <p className="text-xs text-gray-400 mt-1.5 text-center">Appuie sur la carte pour placer l&apos;étape</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-xl font-medium"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={!form.name.trim() || saving}
          className="flex-1 py-2.5 text-sm text-white bg-[#2D6A4F] rounded-xl font-medium disabled:opacity-50"
        >
          {saving ? '...' : label}
        </button>
      </div>
    </div>
  );
}
