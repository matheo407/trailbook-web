'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { pullFromCloud, pushToCloud } from '@/lib/sync';
import { Cloud, CloudOff, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

export default function SyncBanner() {
  const { user, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      await pullFromCloud();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
      // Reload page to refresh data from IndexedDB
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  };

  const handlePush = async () => {
    setSyncing(true);
    try {
      await pushToCloud();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return (
      <Link href="/auth" className="flex items-center gap-2 bg-[#2D6A4F]/10 rounded-2xl px-4 py-3 border border-[#2D6A4F]/20 active:bg-[#2D6A4F]/20 transition-colors">
        <CloudOff size={16} className="text-[#2D6A4F]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#2D6A4F]">Sync cloud désactivée</p>
          <p className="text-xs text-[#2D6A4F]/70">Connecte-toi pour sauvegarder dans le cloud</p>
        </div>
        <span className="text-xs font-semibold text-[#2D6A4F] bg-[#2D6A4F]/15 px-2.5 py-1 rounded-xl">Se connecter</span>
      </Link>
    );
  }

  return (
    <div className="bg-green-50 rounded-2xl px-4 py-3 border border-green-100">
      <div className="flex items-center gap-2">
        {syncDone ? (
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
        ) : (
          <Cloud size={16} className="text-green-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">
            {syncDone ? 'Synchronisé !' : 'Cloud actif'}
          </p>
          <p className="text-xs text-green-600 truncate">{user.email}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Récupérer depuis le cloud"
            className="p-2 rounded-xl bg-green-100 text-green-700 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={signOut}
            title="Se déconnecter"
            className="p-2 rounded-xl bg-green-100 text-green-700 active:scale-95 transition-transform"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
