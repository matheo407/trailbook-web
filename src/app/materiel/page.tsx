'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, X, Check } from 'lucide-react';
import { useGear } from '@/hooks/useGear';
import { GearCategory, GearItem } from '@/types';

const categories: GearCategory[] = [
  'vêtements', 'nourriture', 'équipement', 'sécurité', 'navigation', 'autre'
];

const categoryLabel: Record<GearCategory, string> = {
  vêtements:   'Vêtements',
  nourriture:  'Nourriture',
  équipement:  'Équipement',
  sécurité:    'Sécurité',
  navigation:  'Navigation',
  autre:       'Autre',
};

const categoryEmoji: Record<GearCategory, string> = {
  vêtements:   '👕',
  nourriture:  '🍫',
  équipement:  '🎒',
  sécurité:    '🩹',
  navigation:  '🧭',
  autre:       '📦',
};

interface GearFormData {
  name: string;
  category: GearCategory;
  weight: string;
  notes: string;
  photo: string;
}

const defaultForm: GearFormData = {
  name: '', category: 'équipement', weight: '', notes: '', photo: '',
};

export default function MaterielPage() {
  const { gearItems, loading, createGearItem, updateGearItem, deleteGearItem } = useGear();

  const [filterCategory, setFilterCategory] = useState<GearCategory | 'tous'>('tous');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GearFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = filterCategory === 'tous'
    ? gearItems
    : gearItems.filter((g) => g.category === filterCategory);

  const grouped = filtered.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (item: GearItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      weight: item.weight?.toString() ?? '',
      notes: item.notes ?? '',
      photo: item.photo ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        weight: form.weight ? parseInt(form.weight) : undefined,
        notes: form.notes.trim() || undefined,
        photo: form.photo || undefined,
      };
      if (editingId) {
        await updateGearItem(editingId, data);
      } else {
        await createGearItem(data);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteGearItem(id);
    setConfirmDeleteId(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, photo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 pt-12">
        <h1 className="text-lg font-bold text-gray-900">Matériel</h1>
        <p className="text-xs text-gray-500">{gearItems.length} article{gearItems.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Category filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory('tous')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filterCategory === 'tous'
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Tous ({gearItems.length})
          </button>
          {categories.map((cat) => {
            const count = gearItems.filter((g) => g.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {categoryEmoji[cat]} {categoryLabel[cat]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : gearItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="text-5xl">🎒</span>
            <h2 className="text-base font-bold text-gray-800 mt-4">Aucun matériel</h2>
            <p className="text-gray-500 text-sm mt-2">Ajoutez votre équipement pour le retrouver dans la planification.</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 mt-5 bg-[#2D6A4F] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm"
            >
              <Plus size={16} />
              Ajouter du matériel
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <span>{categoryEmoji[category as GearCategory]}</span>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {categoryLabel[category as GearCategory] || category}
                </p>
                <span className="text-xs text-gray-400 ml-auto">{items.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.weight && (
                          <span className="text-xs text-gray-400">{item.weight}g</span>
                        )}
                        {item.notes && (
                          <span className="text-xs text-gray-400 truncate">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 text-gray-400 active:bg-gray-100 rounded-xl"
                      >
                        <Pencil size={16} />
                      </button>
                      {confirmDeleteId === item.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 active:bg-red-50 rounded-xl"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2 text-gray-400 active:bg-gray-100 rounded-xl"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 text-gray-400 active:bg-gray-100 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#2D6A4F] rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform z-40"
        style={{ boxShadow: '0 4px 20px rgba(45,106,79,0.4)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center px-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl flex flex-col" style={{ maxHeight: '80dvh' }}>
            {/* Header — fixed */}
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                {editingId ? 'Modifier le matériel' : 'Nouveau matériel'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400">
                <X size={22} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Photo
                </label>
                <div className="flex items-center gap-3">
                  {form.photo ? (
                    <div className="relative">
                      <img src={form.photo} alt="preview" className="w-16 h-16 rounded-xl object-cover" />
                      <button
                        onClick={() => setForm((f) => ({ ...f, photo: '' }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer bg-gray-50">
                      <Package size={20} className="text-gray-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                  {!form.photo && (
                    <label className="text-sm text-[#2D6A4F] font-medium cursor-pointer">
                      Choisir une photo
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Nom *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F]"
                  placeholder="Ex: Veste imperméable"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Catégorie
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        form.category === cat
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {categoryEmoji[cat]} {categoryLabel[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Poids (g)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F]"
                  placeholder="Ex: 350"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Notes
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2D6A4F]"
                  placeholder="Ex: Taille M, couleur rouge..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

            </div>

            {/* Footer — always visible */}
            <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
                className="flex-1 py-3.5 bg-[#2D6A4F] text-white rounded-2xl font-semibold text-sm disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
