import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

const config: Record<Difficulty, { label: string; className: string }> = {
  facile: { label: 'Facile', className: 'bg-green-100 text-green-700' },
  moyen: { label: 'Moyen', className: 'bg-orange-100 text-orange-700' },
  difficile: { label: 'Difficile', className: 'bg-red-100 text-red-700' },
};

interface Props {
  difficulty: Difficulty;
  className?: string;
}

export default function DifficultyBadge({ difficulty, className }: Props) {
  const { label, className: colorClass } = config[difficulty];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorClass, className)}>
      {label}
    </span>
  );
}
