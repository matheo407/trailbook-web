'use client';

import { GearItem, HikeGearItem } from '@/types';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  vêtements: 'Vêtements',
  nourriture: 'Nourriture',
  équipement: 'Équipement',
  sécurité: 'Sécurité',
  navigation: 'Navigation',
  autre: 'Autre',
};

const categoryIcons: Record<string, string> = {
  vêtements: '👕',
  nourriture: '🍎',
  équipement: '🎒',
  sécurité: '🩹',
  navigation: '🧭',
  autre: '📦',
};

interface Props {
  gearItems: GearItem[];
  hikeGear: HikeGearItem[];
  onChange: (gear: HikeGearItem[]) => void;
}

export default function GearChecklist({ gearItems, hikeGear, onChange }: Props) {
  const categories = Array.from(new Set(gearItems.map((g) => g.category)));

  const toggleItem = (gearId: string) => {
    const existing = hikeGear.find((g) => g.gearId === gearId);
    if (existing) {
      onChange(hikeGear.map((g) => g.gearId === gearId ? { ...g, packed: !g.packed } : g));
    } else {
      onChange([...hikeGear, { gearId, packed: true }]);
    }
  };

  const isPacked = (gearId: string) => {
    return hikeGear.find((g) => g.gearId === gearId)?.packed ?? false;
  };

  const packedCount = hikeGear.filter((g) => g.packed).length;
  const totalCount = gearItems.length;

  if (gearItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <span className="text-3xl">🎒</span>
        <p className="mt-2 text-sm">Aucun équipement enregistré</p>
        <p className="text-xs text-gray-400 mt-1">Ajoutez du matériel dans l&apos;onglet Matériel</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {packedCount}/{totalCount} articles préparés
        </span>
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D6A4F] rounded-full transition-all duration-300"
            style={{ width: totalCount ? `${(packedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const items = gearItems.filter((g) => g.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{categoryIcons[category] || '📦'}</span>
                <h4 className="text-sm font-semibold text-gray-700">{categoryLabels[category] || category}</h4>
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const packed = isPacked(item.id);
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer',
                        packed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-100'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={packed}
                        onChange={() => toggleItem(item.id)}
                        className="w-5 h-5 rounded-md accent-[#2D6A4F] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', packed && 'line-through text-gray-400')}>
                          {item.name}
                        </p>
                        {item.weight && (
                          <p className="text-xs text-gray-400">{item.weight}g</p>
                        )}
                      </div>
                      {item.photo && (
                        <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
