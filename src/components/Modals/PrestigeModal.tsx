import React from 'react';
import { X, Award, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { calculatePPGained } from '../../game/upgrades';
import { soundService } from '../../services/audio';

interface PrestigeModalProps {
  isOpen: boolean;
  lifetimeCredits: number;
  currentGearTokens: number;
  prestigeCount?: number;
  onClose: () => void;
  onConfirmPrestige: () => void;
}

export const PrestigeModal: React.FC<PrestigeModalProps> = ({
  isOpen,
  lifetimeCredits,
  currentGearTokens,
  prestigeCount = 0,
  onClose,
  onConfirmPrestige,
}) => {
  if (!isOpen) return null;

  const newPP = calculatePPGained(lifetimeCredits, prestigeCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-pixel select-none">
      <div className="relative w-full max-w-md bg-[#1e1728] border-2 border-[#d97706] rounded-xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-amber-300 hover:text-white p-1 rounded-md bg-[#2d223c] border border-amber-600/50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#3b2b52] border-2 border-amber-500 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-pixel text-sm text-amber-300 uppercase tracking-wider">
              NEW SHIFT PRESTIGE
            </h3>
            <p className="text-[11px] text-amber-100/70 font-sans">
              Wrap up the current run and claim Prestige Points (PP)
            </p>
          </div>
        </div>

        {/* PP Payout Card matching Screenshot 1/2 Monitor */}
        <div className="p-4 mb-4 rounded-lg bg-[#140e1e] border-2 border-amber-500/60 text-center">
          <div className="text-xs text-amber-200/80 uppercase tracking-wide">Prestige Points to Claim</div>
          <div className="text-3xl font-pixel font-bold text-amber-400 my-1.5 tracking-wider">
            +{newPP} PP
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            Total Available after Prestige: <span className="text-amber-300 font-bold font-pixel">{currentGearTokens + newPP} PP</span>
          </div>
        </div>

        {/* Breakdown of Resets vs Kept */}
        <div className="space-y-3 mb-4 text-xs font-sans">
          {/* What Resets */}
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30">
            <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1.5 font-pixel text-[11px]">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>WHAT RESETS</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="text-red-400">×</span> Active table notes & current cash (unless saved by Deep Pockets)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400">×</span> Standard Breaker & Cash upgrade levels
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-red-400">×</span> Waste bin accumulation
              </li>
            </ul>
          </div>

          {/* What Remains Permanent */}
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1.5 font-pixel text-[11px]">
              <Check className="w-3.5 h-3.5" />
              <span>WHAT REMAINS PERMANENT</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> All acquired Prestige Points & Radial Skill Tree unlocks
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Deep Pockets start money & Piggy Bank shift multipliers
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Lifetime statistics, records, and sound preferences
              </li>
            </ul>
          </div>
        </div>

        {/* Warning if 0 PP */}
        {newPP <= 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] font-sans">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Process more money to earn at least 1 Prestige Point (PP).</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg bg-[#2d223c] hover:bg-[#3b2b52] border border-slate-600 text-slate-300 font-pixel text-xs"
          >
            Cancel
          </button>

          <button
            disabled={newPP <= 0}
            onClick={() => {
              soundService.playPrestige();
              onConfirmPrestige();
            }}
            className={`flex-1 py-2.5 rounded-lg font-pixel text-xs transition-transform border ${
              newPP > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 active:scale-98 shadow-md shadow-amber-900/60'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            Confirm (+{newPP} PP)
          </button>
        </div>
      </div>
    </div>
  );
};
