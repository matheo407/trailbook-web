'use client';

import { useState } from 'react';
import { Companion } from '@/types';
import { Plus, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  companions: Companion[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateCompanion: (name: string) => Promise<Companion>;
}

export default function CompanionSelector({ companions, selectedIds, onChange, onCreateCompanion }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleCompanion = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const companion = await onCreateCompanion(newName.trim());
      onChange([...selectedIds, companion.id]);
      setNewName('');
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {companions.map((companion) => {
          const selected = selectedIds.includes(companion.id);
          return (
            <button
              key={companion.id}
              type="button"
              onClick={() => toggleCompanion(companion.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150',
                selected
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {companion.name[0].toUpperCase()}
              </span>
              {companion.name}
              {selected && <X size={12} className="ml-0.5" />}
            </button>
          );
        })}

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 bg-white"
          >
            <UserPlus size={14} />
            Nouveau
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du compagnon"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
              if (e.key === 'Escape') { setShowForm(false); setNewName(''); }
            }}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-3 py-2 bg-[#2D6A4F] text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setNewName(''); }}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
