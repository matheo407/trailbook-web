'use client';

import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

const SUGGESTIONS = [
  'famille', 'solo', 'amis', 'technique', 'vue', 'sommet',
  'lac', 'forêt', 'canyon', 'cascade', 'bivouac', 'facile',
  'engagement', 'sauvage', 'classique', 'insolite',
];

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filtered = SUGGESTIONS.filter(
    (s) => s.includes(input.toLowerCase()) && !tags.includes(s)
  ).slice(0, 6);

  return (
    <div>
      {/* Tags + input */}
      <div
        className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl border border-gray-200 bg-white min-h-[48px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F] text-white text-xs font-medium rounded-xl"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-0.5 opacity-70 hover:opacity-100"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? 'Ajouter un tag...' : ''}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder-gray-400"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">Appuie sur Entrée pour valider</p>

      {/* Suggestions */}
      {showSuggestions && (input.length > 0 || tags.length === 0) && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl border border-gray-200 active:bg-[#2D6A4F] active:text-white"
            >
              <Plus size={10} />#{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
