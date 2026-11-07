import React from 'react';
import { Play, HelpCircle, Settings, Code2, Award, Sparkles } from 'lucide-react';
import { soundService } from '../../services/audio';

interface MainMenuModalProps {
  isOpen: boolean;
  lifetimeCredits: number;
  gearTokens: number;
  onPlay: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenAndroidExport: () => void;
}

export const MainMenuModal: React.FC<MainMenuModalProps> = ({
  isOpen,
  lifetimeCredits,
  gearTokens,
  onPlay,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenAndroidExport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center">
        {/* Animated Workshop Gear Mascot */}
        <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-emerald-400 p-0.5 shadow-xl shadow-amber-950/60">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <span className="font-pixel text-xl text-amber-400">$</span>
            </div>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="font-pixel text-xl sm:text-2xl text-amber-400 tracking-wider mb-1 drop-shadow-md">
          CASH CRUNCH
        </h1>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Rotary Shredder Workshop · 2D Incremental
        </p>

        {/* Lifetime badges */}
        {(lifetimeCredits > 0 || gearTokens > 0) && (
          <div className="flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-emerald-400 font-bold">${lifetimeCredits.toLocaleString()}</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400 font-bold">{gearTokens} Gears</span>
          </div>
        )}

        {/* Menu Buttons */}
        <div className="w-full space-y-2.5 max-w-xs">
          <button
            onClick={() => {
              soundService.playCashChime(2);
              onPlay();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm font-mono flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/60 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>PLAY WORKSHOP</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onOpenHowToPlay();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>HOW TO PLAY</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onOpenAndroidExport();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>ANDROID KOTLIN PROJECT</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              onOpenSettings();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>SETTINGS</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-[11px] text-slate-500 font-mono">
          Pure Offline Incremental · No Login Required
        </div>
      </div>
    </div>
  );
};
