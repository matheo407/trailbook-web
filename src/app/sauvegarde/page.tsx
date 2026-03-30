'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { exportAllData, importAllData } from '@/lib/db';

export default function SauvegardePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMsg, setImportMsg] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `trailbook_backup_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setPendingFile(content);
      setConfirmRestore(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!pendingFile) return;
    try {
      await importAllData(pendingFile);
      setImportStatus('success');
      setImportMsg('Données restaurées avec succès. Rechargez l\'app pour voir les changements.');
    } catch {
      setImportStatus('error');
      setImportMsg('Fichier invalide ou corrompu.');
    } finally {
      setConfirmRestore(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl text-gray-500">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Sauvegarde</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-800 mb-1">📲 Sync multi-appareils</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Exporte tes données en JSON, transfère-le via AirDrop, iCloud Drive ou email, puis importe-le sur un autre appareil.
          </p>
        </div>

        {/* Export */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-1">Exporter</h2>
          <p className="text-xs text-gray-500 mb-3">
            Télécharge toutes tes randonnées, matériel, compagnons et étapes dans un fichier JSON.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#2D6A4F] text-white text-sm font-semibold disabled:opacity-50 shadow-sm active:scale-[0.98] transition-transform"
          >
            <Download size={16} />
            {exporting ? 'Export en cours...' : 'Exporter les données'}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-1">Restaurer</h2>
          <p className="text-xs text-gray-500 mb-3">
            Importe un fichier de sauvegarde JSON. <span className="text-red-500 font-medium">Attention : remplace toutes les données actuelles.</span>
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-semibold active:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            Choisir un fichier de sauvegarde
          </button>
          <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />

          {importStatus === 'success' && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">{importMsg}</p>
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 rounded-xl">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{importMsg}</p>
            </div>
          )}
        </div>

        {/* Reload tip */}
        {importStatus === 'success' && (
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            <RefreshCw size={16} />
            Recharger l&apos;application
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full space-y-4">
            <h3 className="font-bold text-gray-900 text-center">Confirmer la restauration</h3>
            <p className="text-sm text-gray-600 text-center">
              Toutes tes données actuelles seront <span className="text-red-500 font-medium">remplacées</span> par celles du fichier. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmRestore(false); setPendingFile(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button onClick={handleImport}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">
                Restaurer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
