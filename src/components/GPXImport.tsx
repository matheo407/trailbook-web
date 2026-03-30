'use client';

import { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseGPX } from '@/lib/gpx';
import { Coordinate } from '@/types';

interface Props {
  onImport: (coords: Coordinate[]) => void;
}

export default function GPXImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pointCount, setPointCount] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const coords = parseGPX(content);
        if (coords.length === 0) throw new Error('Aucun point trouvé');
        setPointCount(coords.length);
        setStatus('success');
        onImport(coords);
      } catch {
        setStatus('error');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-[#52B788] text-[#2D6A4F] text-sm font-medium active:bg-green-50 transition-colors"
      >
        <Upload size={16} />
        Importer un fichier GPX
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        className="hidden"
        onChange={handleFile}
      />
      {status === 'success' && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <CheckCircle2 size={13} className="text-green-500" />
          <span className="text-xs text-green-600 font-medium">
            {pointCount} points importés
          </span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <AlertCircle size={13} className="text-red-400" />
          <span className="text-xs text-red-500">Fichier GPX invalide</span>
        </div>
      )}
    </div>
  );
}
