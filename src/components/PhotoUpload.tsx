'use client';

import { useRef } from 'react';
import { Plus, X } from 'lucide-react';

interface Props {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  onRemove: (index: number) => void;
}

export default function PhotoUpload({ photos, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) onAdd(result);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
            >
              <X size={14} />
            </button>
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
