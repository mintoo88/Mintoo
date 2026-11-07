import React, { useState, useEffect } from 'react';
import { PhoneCallMilestone } from '../../types/game';
import { soundService } from '../../services/audio';

interface PhoneDialogueModalProps {
  isOpen: boolean;
  activeMilestone: PhoneCallMilestone | null;
  allMilestones: PhoneCallMilestone[];
  seenIds: string[];
  onClose: () => void;
  onSelectMilestone?: (milestone: PhoneCallMilestone) => void;
}

export const PhoneDialogueModal: React.FC<PhoneDialogueModalProps> = ({
  isOpen,
  activeMilestone,
  allMilestones,
  seenIds,
  onClose,
  onSelectMilestone,
}) => {
  const [currentMilestone, setCurrentMilestone] = useState<PhoneCallMilestone | null>(activeMilestone);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [mouthOpen, setMouthOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeMilestone) {
      setCurrentMilestone(activeMilestone);
      setPageIndex(0);
    } else {
      // Find latest seen milestone or first one
      const seenMilestones = allMilestones.filter((m) => seenIds.includes(m.id));
      const latest = seenMilestones[seenMilestones.length - 1] || allMilestones[0];
      setCurrentMilestone(latest);
      setPageIndex(0);
    }
  }, [activeMilestone, isOpen, allMilestones, seenIds]);

  const targetLine = currentMilestone ? currentMilestone.dialogue[pageIndex] || '' : '';

  // Typewriter effect + mouth animation
  useEffect(() => {
    if (!isOpen || !targetLine) return;

    let charIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      charIdx++;
      setDisplayedText(targetLine.slice(0, charIdx));

      // Blip audio & toggle mouth
      if (charIdx % 3 === 0) {
        soundService.playPhoneChatter();
        setMouthOpen((prev) => !prev);
      }

      if (charIdx >= targetLine.length) {
        clearInterval(interval);
        setIsTyping(false);
        setMouthOpen(false);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [targetLine, isOpen]);

  if (!isOpen || !currentMilestone) return null;

  const totalPages = currentMilestone.dialogue.length;

  const handleNext = () => {
    soundService.playClick();
    if (isTyping) {
      // Skip typewriter to full line
      setDisplayedText(targetLine);
      setIsTyping(false);
      setMouthOpen(false);
      return;
    }
    if (pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs font-pixel select-none p-4">
      {/* Vintage Desktop Telephone Terminal Box */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#241e17] via-[#1a140f] to-[#120d09] border-4 border-[#b45309] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-6 overflow-hidden">
        {/* Brass Header Bezel */}
        <div className="flex items-center justify-between border-b-2 border-[#b45309]/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">☎</span>
            <div>
              <div className="text-[11px] text-[#fbbf24] font-bold tracking-widest uppercase">
                BUCK CAPITAL PRIVATE HOTLINE
              </div>
              <div className="text-[8px] text-[#94a3b8] font-mono">
                SECURE ENCRYPTED DESK TRANSCEIVER • CHANNEL #001
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] text-[#86efac] font-mono">CALL CONNECTED</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Mr. Buck Pixel Portrait */}
          <div className="shrink-0 w-32 h-36 bg-[#0f172a] border-3 border-[#f59e0b] rounded-xl p-2 relative shadow-lg flex flex-col items-center justify-between">
            {/* Pixel Character Canvas / SVG */}
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow">
                {/* Hair / Top Hat */}
                <rect x="12" y="4" width="24" height="12" fill="#1e1b18" />
                <rect x="8" y="14" width="32" height="4" fill="#b45309" />
                {/* Head */}
                <rect x="12" y="18" width="24" height="20" fill="#fcd34d" />
                {/* Sunglasses / Monocle */}
                <rect x="14" y="22" width="9" height="6" fill="#0f172a" />
                <rect x="25" y="22" width="9" height="6" fill="#0f172a" />
                <circle cx="20" cy="25" r="1.5" fill="#38bdf8" />
                <circle cx="31" cy="25" r="1.5" fill="#38bdf8" />
                <line x1="23" y1="25" x2="25" y2="25" stroke="#f59e0b" strokeWidth="1.5" />
                {/* Golden Monocle Chain */}
                <line x1="34" y1="26" x2="38" y2="34" stroke="#fbbf24" strokeWidth="1" strokeDasharray="1,1" />
                {/* Lavish Mustache */}
                <path d="M14 31 Q24 28 34 31 Q24 35 14 31" fill="#78350f" />
                {/* Talking Mouth */}
                {mouthOpen ? (
                  <ellipse cx="24" cy="35" rx="3.5" ry="2.5" fill="#450a0a" />
                ) : (
                  <line x1="22" y1="35" x2="26" y2="35" stroke="#450a0a" strokeWidth="1.5" />
                )}
                {/* Luxury Pinstripe Suit & Gold Tie */}
                <rect x="10" y="38" width="28" height="10" fill="#1e293b" />
                <polygon points="24,38 27,45 24,47 21,45" fill="#eab308" />
              </svg>
            </div>

            {/* Nameplate */}
            <div className="w-full py-1 bg-[#1e1b18] border border-[#f59e0b]/50 rounded text-center">
              <span className="text-[8px] text-[#fef08a] font-bold uppercase">Mr. Buck</span>
            </div>
          </div>

          {/* Dialogue Speech Box */}
          <div className="flex-1 min-h-[140px] flex flex-col justify-between w-full">
            <div className="bg-[#0b0f0d] border-2 border-[#2b3b30] rounded-xl p-4 shadow-inner min-h-[120px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-[#fbbf24] font-bold">
                  {currentMilestone.title}
                </span>
                <span className="text-[8px] text-[#64748b] font-mono">
                  {pageIndex + 1} / {totalPages}
                </span>
              </div>

              {/* Typewritten Dialogue */}
              <p className="text-xs sm:text-sm text-[#f1f5f9] leading-relaxed font-mono min-h-[64px]">
                "{displayedText}"
                {isTyping && <span className="inline-block w-2 h-3.5 bg-[#4ade80] ml-1 animate-pulse" />}
              </p>

              {/* Unlocked feature pill */}
              {currentMilestone.unlockedFeature && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e2922] border border-[#4ade80]/60 text-[8px] text-[#86efac]">
                  <span>✦ UNLOCKED:</span>
                  <span className="font-bold">{currentMilestone.unlockedFeature}</span>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="text-[8px] text-[#94a3b8] font-mono">
                {isTyping ? 'TAP NEXT TO SKIP' : pageIndex < totalPages - 1 ? 'TAP NEXT TO CONTINUE' : 'TAP TO HANG UP'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded bg-[#26202e] hover:bg-[#342c3f] border border-[#5a4d6b] text-[9px] text-[#cbd5e1] active:scale-95 cursor-pointer"
                >
                  Hang Up
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#d97706] hover:to-[#f59e0b] border-2 border-[#fef08a] text-xs text-white font-bold shadow-lg shadow-amber-950/50 active:scale-95 cursor-pointer"
                >
                  {isTyping ? 'Skip >' : pageIndex < totalPages - 1 ? 'Next >' : 'Close ☎'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Historic Milestones Selector Bar at bottom */}
        {allMilestones.length > 1 && (
          <div className="mt-4 pt-3 border-t border-[#b45309]/30 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[7.5px] text-[#94a3b8] shrink-0 font-mono uppercase mr-1">
              Call Log:
            </span>
            {allMilestones.map((m) => {
              const isSeen = seenIds.includes(m.id) || m.triggerCash === 0;
              const isSelected = currentMilestone.id === m.id;
              if (!isSeen) return null;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundService.playClick();
                    setCurrentMilestone(m);
                    setPageIndex(0);
                    if (onSelectMilestone) onSelectMilestone(m);
                  }}
                  className={`px-2 py-1 rounded text-[7.5px] shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#f59e0b] text-[#1e1b18] font-bold border-[#fef08a]'
                      : 'bg-[#1e1b18] text-[#94a3b8] hover:text-[#f1f5f9] border-[#3f382f]'
                  }`}
                >
                  {m.title}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
