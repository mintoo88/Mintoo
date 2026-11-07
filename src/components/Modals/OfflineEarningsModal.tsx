import React from 'react';
import { Bot, Clock, Sparkles } from 'lucide-react';
import { soundService } from '../../services/audio';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  offlineCredits: number;
  offlineSeconds: number;
  onClaim: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  isOpen,
  offlineCredits,
  offlineSeconds,
  onClaim,
}) => {
  if (!isOpen || offlineCredits <= 0) return null;

  const minutes = Math.floor(offlineSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  const timeString =
    hours > 0 ? `${hours}h ${remainingMins}m` : `${Math.max(1, minutes)} minutes`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col text-center">
        {/* Drone Icon */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <Bot className="w-6 h-6 animate-pulse" />
        </div>

        <h3 className="font-pixel text-xs text-cyan-300 mb-1">
          OFFLINE SHREDDING REPORT
        </h3>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Away for {timeString}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/60 mb-4">
          <div className="text-[11px] text-slate-400 mb-1">Autonomous Workshop Output</div>
          <div className="text-3xl font-mono font-extrabold text-emerald-400">
            +${offlineCredits.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-500/80 mt-1">
            Processed by Robo-Shredders while idle (75% efficiency)
          </div>
        </div>

        <button
          onClick={() => {
            soundService.playCashChime(4);
            onClaim();
          }}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm transition-transform active:scale-98 shadow-lg shadow-emerald-950/60"
        >
          Claim ${offlineCredits.toLocaleString()}
        </button>
      </div>
    </div>
  );
};
