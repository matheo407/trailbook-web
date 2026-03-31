'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { pullFromCloud, pushToCloud } from '@/lib/sync';
import { Mountain } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'login') {
        await Promise.race([
          signIn(email, password),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connexion trop lente, réessaie.')), 20000)),
        ]);
        router.push('/');
        // Pull in background after redirect
        pullFromCloud().catch(() => {});
      } else {
        await Promise.race([
          signUp(email, password),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connexion trop lente, réessaie.')), 20000)),
        ]);
        pushToCloud().catch(() => {});
        setSuccess('Compte créé ! Vérifie tes emails pour confirmer, puis connecte-toi.');
        setMode('login');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2D6A4F] rounded-3xl mb-4 shadow-lg">
            <Mountain size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TrailBook</h1>
          <p className="text-sm text-gray-500 mt-1">Sync cloud avec Supabase</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-2">
            {(['login', 'signup'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                  mode === m ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-gray-500'
                }`}>
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
            />
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-green-700">{success}</p>
            </div>
          )}

          <button
            onClick={handle}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-3.5 rounded-2xl bg-[#2D6A4F] text-white font-semibold text-sm disabled:opacity-50 shadow-sm active:scale-[0.98] transition-transform"
          >
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
          Tes données sont synchronisées de façon sécurisée via Supabase.<br />
          Connecte-toi sur tous tes appareils avec le même compte.
        </p>
      </div>
    </div>
  );
}
