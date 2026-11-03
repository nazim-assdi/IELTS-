/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wifi, WifiOff, CloudCheck, RefreshCw, HardDrive, 
  CheckCircle2, AlertTriangle, ShieldCheck, DownloadCloud, X 
} from 'lucide-react';
import { UseOfflineStatusReturn } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  status: UseOfflineStatusReturn;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPrecaching, setIsPrecaching] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await status.syncNow();
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handlePrecache = async () => {
    setIsPrecaching(true);
    await status.precacheAllUnits();
    setTimeout(() => setIsPrecaching(false), 600);
  };

  return (
    <>
      {/* Top Banner Status Chip */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all border ${
          status.isOffline
            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 animate-pulse'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900'
        }`}
        title="View Offline Immersion Status & Cache"
      >
        {status.isOffline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Offline Mode</span>
            {status.pendingSyncCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {status.pendingSyncCount}
              </span>
            )}
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Offline Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </>
        )}
      </button>

      {/* Offline Manager Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Offline Immersion & Cache
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Local-First Progress & Service Worker
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Offline Manager"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Connection Status
                </span>
                <div className="flex items-center gap-1.5 font-extrabold">
                  {status.isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Wifi className="w-3.5 h-3.5" />
                      Online (Active)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <WifiOff className="w-3.5 h-3.5" />
                      Offline Mode
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Local-First Core Path
                </span>
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100 Units Cached
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Queued Actions
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {status.pendingSyncCount} pending mutations
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Offline Readiness
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  100% Offline-Ready
                </span>
              </div>
            </div>

            {/* Offline Features Info Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Internet Dependency for Core Units:</span>
              </div>
              <ul className="text-[11px] list-disc list-inside space-y-0.5 opacity-90">
                <li>All 100 units (Part 1, 2 & 3 questions and collocations)</li>
                <li>Interactive lesson exercises, multiple choices & drills</li>
                <li>Daily goal XP calculations & streak preservation</li>
                <li>Automatic background sync when connection is restored</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handlePrecache}
                disabled={isPrecaching}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <DownloadCloud className={`w-4 h-4 ${isPrecaching ? 'animate-bounce' : ''}`} />
                <span>{isPrecaching ? 'Pre-caching Assets...' : 'Pre-cache All Curriculum Assets'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={status.toggleSimulatedOffline}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border ${
                    status.simulatedOffline
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>{status.simulatedOffline ? 'Exit Simulated Offline' : 'Test Offline Mode'}</span>
                </button>

                {status.pendingSyncCount > 0 && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Progress ({status.pendingSyncCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineBanner: React.FC<{ status: UseOfflineStatusReturn }> = ({ status }) => {
  if (!status.isOffline) return null;
  return (
    <div className="bg-amber-500/15 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-800/80 py-2 px-4 text-xs font-semibold text-amber-950 dark:text-amber-200">
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="leading-tight">
            <strong>Offline Mode Active:</strong> You can study all 100 curriculum units, exercises, and vocabulary drills without active internet. Your progress is saved locally.
          </span>
        </div>
        {status.pendingSyncCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold shrink-0 text-[11px] shadow-xs">
            {status.pendingSyncCount} action{status.pendingSyncCount > 1 ? 's' : ''} queued
          </span>
        )}
      </div>
    </div>
  );
};
