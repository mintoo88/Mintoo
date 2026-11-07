import React from 'react';
import { X, BarChart2, Flame, DollarSign, Award, Clock } from 'lucide-react';
import { GameStats } from '../../types/game';
import { soundService } from '../../services/audio';

interface StatsModalProps {
  isOpen: boolean;
  stats: GameStats;
  currentCredits: number;
  gearTokens: number;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  currentCredits,
  gearTokens,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col max-h-[85vh] overflow-y-auto">
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <h3 className="font-pixel text-xs text-amber-300">
            WORKSHOP METRICS
          </h3>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Key Totals Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Total Shredded</div>
              <div className="text-lg font-mono font-bold text-slate-100">
                {stats.totalNotesShredded.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Lifetime Revenue</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                ${stats.totalCreditsEarned.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Highest Combo</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {stats.highestCombo}x
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400">Workshop Expansions</div>
              <div className="text-lg font-mono font-bold text-purple-400">
                {stats.prestigeCount}
              </div>
            </div>
          </div>

          {/* Breakdown by Banknote Type */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="text-[11px] font-bold text-slate-300 mb-2">
              SHREDDED BY DENOMINATION
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-emerald-400">
                <span>Standard Notes ($10):</span>
                <span>{(stats.notesByType.standard || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-blue-400">
                <span>Reinforced Notes ($40):</span>
                <span>{(stats.notesByType.reinforced || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400">
                <span>Spark Notes ($75):</span>
                <span>{(stats.notesByType.spark || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-orange-400">
                <span>Burst Notes ($120):</span>
                <span>{(stats.notesByType.burst || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-amber-300">
                <span>Golden Bullion Notes ($500):</span>
                <span>{(stats.notesByType.golden || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Close Metrics
        </button>
      </div>
    </div>
  );
};
