'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mountain, Clock, Backpack, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Tableau', icon: Home },
  { href: '/randos', label: 'Randos', icon: Mountain },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/materiel', label: 'Matériel', icon: Backpack },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/auth') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 min-w-[60px] min-h-[56px] transition-colors duration-150',
                isActive ? 'text-[#2D6A4F]' : 'text-gray-400'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="mb-0.5"
              />
              <span className={cn('text-[10px] font-medium', isActive ? 'text-[#2D6A4F]' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
