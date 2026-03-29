'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

export interface PlaceResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

interface Props {
  placeholder?: string;
  initialValue?: string;
  onSelect: (place: PlaceResult) => void;
  onClear?: () => void;
}

export default function PlaceSearch({
  placeholder = 'Rechercher un lieu...',
  initialValue = '',
  onSelect,
  onClear,
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(!!initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=json&q=${encodeURIComponent(q)}&limit=6&accept-language=fr`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data: Record<string, string>[] = await res.json();
      const mapped: PlaceResult[] = data.map((item) => ({
        name: item.name || item.display_name.split(',')[0].trim(),
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));
      setResults(mapped);
      setOpen(mapped.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 600);
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.name);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onSelect(place);
  };

  const handleClear = () => {
    setQuery('');
    setSelected(false);
    setResults([]);
    setOpen(false);
    onClear?.();
  };

  const typeIcon = (type: string) => {
    if (['peak', 'mountain', 'hill', 'ridge', 'volcano'].includes(type)) return '⛰️';
    if (['city', 'town', 'village', 'hamlet', 'suburb', 'municipality'].includes(type)) return '🏘️';
    if (['lake', 'river', 'water', 'stream', 'waterway'].includes(type)) return '💧';
    if (['forest', 'wood', 'nature_reserve', 'national_park', 'protected_area'].includes(type)) return '🌲';
    if (['parking', 'car_park'].includes(type)) return '🅿️';
    if (['administrative', 'county', 'state', 'region'].includes(type)) return '🗺️';
    if (['pass', 'saddle'].includes(type)) return '🏔️';
    return '📍';
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        {loading ? (
          <Loader2 size={16} className="absolute left-3 text-[#2D6A4F] animate-spin pointer-events-none" />
        ) : (
          <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 active:text-gray-600 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown — high z-index to appear above map and sticky headers */}
      {open && results.length > 0 && (
        <div
          className="absolute w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {results.map((place, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => {
                // Use onMouseDown to fire before onBlur closes the dropdown
                e.preventDefault();
                handleSelect(place);
              }}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0"
            >
              <span className="text-base flex-shrink-0 mt-0.5">{typeIcon(place.type)}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{place.name}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {place.displayName.split(',').slice(1, 3).join(',').trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation badge */}
      {selected && query && (
        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <MapPin size={11} className="text-[#2D6A4F]" />
          <span className="text-xs text-[#2D6A4F] font-medium">Position enregistrée</span>
        </div>
      )}
    </div>
  );
}
