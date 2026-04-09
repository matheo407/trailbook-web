'use client';

import { useRef } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { HikePhoto } from '@/types';

interface Props {
  photos: HikePhoto[];
  onAdd: (photo: HikePhoto) => void;
  onRemove: (index: number) => void;
}

export default function PhotoUpload({ photos, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });

      const photo: HikePhoto = { url, takenAt: new Date().toISOString() };

      // 1. Try EXIF GPS metadata from the file itself
      try {
        const exifr = await import('exifr');
        const gps = await exifr.gps(file);
        if (gps?.latitude && gps?.longitude) {
          onAdd({ ...photo, coordinate: { lat: gps.latitude, lng: gps.longitude } });
          continue;
        }
      } catch { /* exifr not available or no EXIF */ }

      // 2. Fallback: current GPS position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => onAdd({ ...photo, coordinate: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
          () => onAdd(photo),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        onAdd(photo);
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
            >
              <X size={14} />
            </button>
            {photo.coordinate && (
              <div className="absolute bottom-1 left-1 bg-black/50 rounded-full p-0.5">
                <MapPin size={10} className="text-white" />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <Plus size={20} />
          <span className="text-xs mt-1">Ajouter</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
