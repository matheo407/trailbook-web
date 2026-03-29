import { HikeStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  status: HikeStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  const isFinished = status === 'faite';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isFinished ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700',
        className
      )}
    >
      {isFinished ? 'Faite' : 'Planifiée'}
    </span>
  );
}
