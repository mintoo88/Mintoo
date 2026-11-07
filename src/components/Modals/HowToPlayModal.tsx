import React from 'react';
import { X, Scissors, Layers, Zap, Flame, Sparkles, Shield, Cpu } from 'lucide-react';
import { soundService } from '../../services/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-pixel text-xs text-amber-300 mb-3">
          HOW TO PLAY
        </h3>

        <div className="space-y-3.5 text-xs">
          {/* Core Loop */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <Scissors className="w-4 h-4" />
              <span>THE SHREDDER LOOP</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              1. Tap the green <strong className="text-emerald-400">FEED</strong> button to dispense fictional banknotes onto the wooden tabletop.
              <br />
              2. <strong className="text-amber-300">Drag your finger or cursor</strong> across notes to spin the rotary shredder teeth. Hold on a note to continue cutting!
              <br />
              3. Shredded notes yield instant credits to buy shop upgrades and unlock automation.
            </p>
          </div>

          {/* 5 Note Types */}
          <div>
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              THE 5 BANKNOTE SPECIES
            </div>
            <div className="space-y-1.5">
              {/* Standard */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0">
                  $10
                </div>
                <div>
                  <div className="font-bold text-emerald-300 text-[11px]">Standard Note</div>
                  <div className="text-[10px] text-slate-400">Mint-green paper, normal health and baseline credit reward.</div>
                </div>
              </div>

              {/* Reinforced */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-950/40 border border-blue-500/30">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-blue-300 text-[11px]">Reinforced Note</div>
                  <div className="text-[10px] text-slate-400">Steel security border. High durability, 4x credit payout ($40).</div>
                </div>
              </div>

              {/* Spark */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0">
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                </div>
                <div>
                  <div className="font-bold text-cyan-300 text-[11px]">Spark Note ($75)</div>
                  <div className="text-[10px] text-slate-400">Detonates electrical arcs that damage adjacent notes on the table!</div>
                </div>
              </div>

              {/* Burst */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-950/40 border border-orange-500/30">
                <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0">
                  <Flame className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-orange-300 text-[11px]">Burst Note ($120)</div>
                  <div className="text-[10px] text-slate-400">Creates a fiery area explosion shredding all nearby banknotes.</div>
                </div>
              </div>

              {/* Golden */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
                <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center font-mono font-bold text-[10px] text-slate-950 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-amber-300 text-[11px]">Golden Note ($500)</div>
                  <div className="text-[10px] text-slate-400">Rare bullion note with glittering shimmer and enormous payout.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Combos & Automation */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Flame className="w-4 h-4" />
              <span>COMBOS & AUTOMATION</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Shred notes quickly to pump the <strong className="text-amber-400">Combo Multiplier</strong> up to 5x. Unlock the <strong className="text-cyan-400">Auto-Dispenser Belt</strong> and autonomous <strong className="text-cyan-400">Robo-Shredder Drone</strong> to generate hands-free profits, even earning offline credits when you return!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundService.playClick();
            onClose();
          }}
          className="mt-4 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs"
        >
          Got It, Let's Shred!
        </button>
      </div>
    </div>
  );
};
