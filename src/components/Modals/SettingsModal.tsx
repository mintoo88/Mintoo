import React, { useState } from 'react';
import { X, Volume2, VolumeX, Zap, Sparkles, Activity, Trash2 } from 'lucide-react';
import { GameSettings } from '../../types/game';
import { soundService } from '../../services/audio';
import { hapticsService } from '../../services/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onHardReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onHardReset,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            soundService.playClick();
            setShowConfirmReset(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-pixel text-xs text-amber-300 mb-4">
          WORKSHOP SETTINGS
        </h3>

        <div className="space-y-3 mb-5">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              {settings.sound ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <div className="text-xs font-semibold">Sound Effects</div>
                <div className="text-[10px] text-slate-400">Mechanical shredder & cash chimes</div>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.sound;
                onUpdateSettings({ sound: next });
                soundService.setEnabled(next);
                if (next) soundService.playCashChime(1);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.sound ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.sound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic Vibration */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold">Vibration / Haptics</div>
                <div className="text-[10px] text-slate-400">Tactile shred & explosion pulses</div>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.vibration;
                onUpdateSettings({ vibration: next });
                hapticsService.setEnabled(next);
                if (next) hapticsService.medium();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.vibration ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Effects */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold">Reduced Effects</div>
                <div className="text-[10px] text-slate-400">Caps active particle count</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundService.playClick();
                onUpdateSettings({ reducedEffects: !settings.reducedEffects });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.reducedEffects ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.reducedEffects ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-semibold">Reduced Motion</div>
                <div className="text-[10px] text-slate-400">Calmer physics & confetti drift</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundService.playClick();
                onUpdateSettings({ reducedMotion: !settings.reducedMotion });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.reducedMotion ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reset Progress Section */}
        <div className="pt-3 border-t border-slate-800">
          {!showConfirmReset ? (
            <button
              onClick={() => {
                soundService.playClick();
                setShowConfirmReset(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Reset Game Progress</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-center animate-fade-in">
              <p className="text-xs text-red-200 mb-2 font-semibold">
                Are you sure? This deletes ALL credits, upgrades, prestige tokens, and statistics.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onHardReset();
                    setShowConfirmReset(false);
                    onClose();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono"
                >
                  Yes, Wipe Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
