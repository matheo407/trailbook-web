import { Stop } from '@/types';

const stopTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  repas: { icon: '🍽️', label: 'Repas', color: 'bg-orange-50 border-orange-100' },
  repos: { icon: '🛋️', label: 'Repos', color: 'bg-blue-50 border-blue-100' },
  bivouac: { icon: '⛺', label: 'Bivouac', color: 'bg-purple-50 border-purple-100' },
  point_de_vue: { icon: '🏔️', label: 'Point de vue', color: 'bg-sky-50 border-sky-100' },
  autre: { icon: '📍', label: 'Autre', color: 'bg-gray-50 border-gray-100' },
};

interface Props {
  stop: Stop;
  index: number;
}

export default function StopCard({ stop, index }: Props) {
  const config = stopTypeConfig[stop.type] || stopTypeConfig.autre;

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${config.color}`}>
      <div className="flex flex-col items-center gap-1">
        <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-bold text-gray-600">
          {index + 1}
        </div>
        <span className="text-lg">{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 text-sm">{stop.name}</h4>
          <span className="text-xs text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-full">
            {config.label}
          </span>
        </div>
        {stop.notes && (
          <p className="text-xs text-gray-600 mb-1">{stop.notes}</p>
        )}
        {stop.type === 'repas' && stop.mealDetails && (
          <div className="text-xs bg-white/70 rounded-lg p-2 mt-1">
            <span className="font-medium text-orange-700">Menu : </span>
            <span className="text-gray-600">{stop.mealDetails}</span>
          </div>
        )}
        {stop.journal && (
          <div className="mt-2 bg-white/70 rounded-lg p-2.5 border-l-2 border-[#52B788]">
            <p className="text-xs font-medium text-[#2D6A4F] mb-1">📓 Journal</p>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{stop.journal}</p>
          </div>
        )}
        {stop.coordinate && (
          <p className="text-xs text-gray-400 mt-1">
            {stop.coordinate.lat.toFixed(4)}, {stop.coordinate.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
