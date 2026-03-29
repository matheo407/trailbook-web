'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

export default function RatingStars({ value, onChange, size = 24, className }: Props) {
  const interactive = !!onChange;

  return (
    <div className={cn('flex gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!interactive}
          className={cn(
            'transition-transform duration-100',
            interactive && 'active:scale-110 cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            size={size}
            fill={star <= value ? '#F4A261' : 'none'}
            stroke={star <= value ? '#F4A261' : '#D1D5DB'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
