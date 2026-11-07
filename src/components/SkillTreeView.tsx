import React, { useState, useEffect, useRef } from 'react';
import { PRESTIGE_TREE_NODES, CASH_SKILL_NODES, SkillNode, calculatePPGained } from '../game/upgrades';
import { soundService } from '../services/audio';
import { hapticsService } from '../services/haptics';

interface SkillTreeViewProps {
  funds: number;
  prestigePoints: number;
  lifetimeCredits: number;
  prestigeCount: number;
  cashSkillLevels: Record<string, number>;
  prestigeTreeLevels: Record<string, number>;
  prestigeBarProgress?: number;
  prestigeBarMax?: number;
  initialTab?: 'skill' | 'prestige';
  onBuyCashSkill: (nodeId: string, costCash: number) => void;
  onBuyPrestigeSkill: (nodeId: string, costPP: number) => void;
  onResetCashSkills: () => void;
  onResetPrestigePoints: () => void;
  onPrestigeShift: () => void;
  onStartShift: () => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  funds,
  prestigePoints,
  lifetimeCredits,
  prestigeCount,
  cashSkillLevels,
  prestigeTreeLevels,
  prestigeBarProgress = 0,
  prestigeBarMax = 60,
  initialTab = 'skill',
  onBuyCashSkill,
  onBuyPrestigeSkill,
  onResetCashSkills,
  onResetPrestigePoints,
  onPrestigeShift,
  onStartShift,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'skill' | 'prestige'>(initialTab);

  const [selectedSkillId, setSelectedSkillId] = useState<string>('skill_blade_hone');
  const [selectedPrestigeId, setSelectedPrestigeId] = useState<string>('deep_pockets');

  // Compute uniform scale to fit 1280x720 inside whatever container dimensions exist
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const s = Math.min(clientWidth / 1280, clientHeight / 720);
      setScale(Math.max(0.2, s));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const isSkillTab = activeTab === 'skill';
  const currentNodes = isSkillTab ? CASH_SKILL_NODES : PRESTIGE_TREE_NODES;
  const currentLevels = isSkillTab ? cashSkillLevels : prestigeTreeLevels;
  const selectedNodeId = isSkillTab ? selectedSkillId : selectedPrestigeId;

  const selectedNode = currentNodes.find((n) => n.id === selectedNodeId) || currentNodes[1] || currentNodes[0];
  const currentLvl = currentLevels[selectedNode.id] || 0;
  const isMax = currentLvl >= selectedNode.maxLevel;

  // Prerequisites check
  const prereqsMet =
    selectedNode.prerequisites.length === 0 ||
    selectedNode.prerequisites.every((pid) => (currentLevels[pid] || 0) > 0);

  // Affordability check
  const canAfford = isSkillTab
    ? !isMax && prereqsMet && funds >= selectedNode.cost
    : !isMax && prereqsMet && prestigePoints >= selectedNode.cost;

  const ppGainedOnShift = calculatePPGained(lifetimeCredits, prestigeCount);

  const formatCompact = (num: number) => {
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const handleBuyCurrentSelected = () => {
    if (!canAfford || isMax) return;
    soundService.playGoldenChime();
    hapticsService.medium();
    if (isSkillTab) {
      onBuyCashSkill(selectedNode.id, selectedNode.cost);
    } else {
      onBuyPrestigeSkill(selectedNode.id, selectedNode.cost);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 bg-[#171221] overflow-hidden flex items-center justify-center select-none font-pixel"
    >
      {/* 1280x720 Virtual Landscape Canvas Container */}
      <div
        className="relative shadow-2xl overflow-hidden shrink-0"
        style={{
          width: 1280,
          height: 720,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: '#191424',
        }}
      >
        {/* Subtle Ambient Stardust Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f8fafc_1px,transparent_1px)] [background-size:28px_28px]" />

        {/* 1. TOP-LEFT RETRO INDUSTRIAL MONITOR (MATCHING SCREENSHOT 1 & 2) */}
        <div className="absolute top-6 left-8 z-30 w-48 h-36 bg-gradient-to-b from-[#8f949c] via-[#696e77] to-[#484d56] rounded-xl p-2.5 border-[3px] border-[#22262d] shadow-[0_10px_25px_rgba(0,0,0,0.85)] flex flex-col justify-between">
          {/* Beveled Screw Heads in 4 Corners */}
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#3a3e46] border border-[#a2a7b0]" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3a3e46] border border-[#a2a7b0]" />
          <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-[#3a3e46] border border-[#a2a7b0]" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3a3e46] border border-[#a2a7b0]" />

          {/* CRT Screen Display */}
          <div className="relative flex-1 bg-[#101712] rounded-lg p-2.5 flex flex-col justify-between border-2 border-[#1a211e] overflow-hidden">
            <div className="text-[8px] text-[#9ca3af] tracking-widest text-center font-bold">
              FUNDS
            </div>
            <div className="text-sm text-[#4ade80] text-center font-bold tracking-wider drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]">
              {formatCompact(funds)}
            </div>
            <div className="text-[10px] text-[#fbbf24] text-center font-bold">
              {prestigePoints} PP
            </div>
            <div className="w-full h-1.5 bg-[#0f172a] rounded-xs overflow-hidden border border-[#23352d]">
              <div
                className="h-full bg-gradient-to-r from-[#d97706] to-[#eab308] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, (prestigeBarProgress / (prestigeBarMax || 60)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-1 flex justify-between items-center px-1">
            <span className="text-[7px] text-[#a1a1aa] font-mono uppercase">
              {isSkillTab ? 'Skill: Cash ($)' : 'Prestige: PP'}
            </span>
            <div className="w-3.5 h-1.5 bg-[#2d3139] rounded-xs border border-[#1f2227]" />
          </div>
        </div>

        {/* 2. TOP CENTER DUAL TABS: [SKILL TREE (CASH $)] vs [PRESTIGE TREE (PP)] */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          <button
            onClick={() => {
              soundService.playClick();
              setActiveTab('skill');
            }}
            className={`px-6 py-2.5 rounded-lg border-2 font-pixel text-xs transition-all shadow-xl cursor-pointer ${
              isSkillTab
                ? 'bg-[#1e2922] border-[#4ade80] text-[#86efac] scale-105 shadow-[0_0_15px_rgba(74,222,128,0.35)]'
                : 'bg-[#1b1924] border-[#3f3b4d] text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            🧪 SKILL TREE (CASH $)
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              setActiveTab('prestige');
            }}
            className={`px-6 py-2.5 rounded-lg border-2 font-pixel text-xs transition-all shadow-xl cursor-pointer ${
              !isSkillTab
                ? 'bg-[#2b2416] border-[#f59e0b] text-[#fef08a] scale-105 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-[#1b1924] border-[#3f3b4d] text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            🏛️ PRESTIGE TREE (PP)
          </button>
        </div>

        {/* 3. SELECTED NODE INFO CARD */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[440px] bg-[#1a1724]/95 border-2 border-[#524b61] rounded-lg p-3.5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.85)]">
          {/* Tag */}
          <div className="text-[8px] uppercase tracking-wider mb-1 font-mono font-bold text-[#94a3b8]">
            {isSkillTab ? 'In-Shift Workshop Perk' : 'Permanent Shift Meta-Talent'}
          </div>

          {/* Node Title & Level */}
          <div className="text-xs text-[#fef08a] font-bold tracking-wide mb-1.5 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {selectedNode.name} ({currentLvl}/{selectedNode.maxLevel})
          </div>

          {/* Detailed Description */}
          <p className="text-[10.5px] text-[#e2e8f0] leading-relaxed font-sans mb-2 px-2">
            {selectedNode.description}
          </p>

          {/* Effect Progression */}
          <div className="text-[10px] text-[#4ade80] font-mono font-bold mb-2.5">
            {selectedNode.getEffectBenefit(currentLvl)}
          </div>

          {/* Cost / Buy Button (Styled like reference screenshots) */}
          {selectedNode.id !== 'root' && selectedNode.id !== 'cash_root' && (
            <button
              disabled={!canAfford}
              onClick={handleBuyCurrentSelected}
              className={`w-56 py-2.5 mx-auto rounded-md font-pixel text-xs tracking-wider transition-all border ${
                isMax
                  ? 'bg-[#221f2d] text-[#64748b] border-[#3f3b4d] cursor-not-allowed'
                  : canAfford
                  ? isSkillTab
                    ? 'bg-[#15803d] hover:bg-[#16a34a] text-white border-[#4ade80] active:scale-95 shadow-lg shadow-green-950/40 cursor-pointer'
                    : 'bg-[#2b2416] hover:bg-[#382b18] text-[#fef08a] border-[#f59e0b] active:scale-95 shadow-lg shadow-amber-950/40 cursor-pointer'
                  : 'bg-[#221f2d] text-[#64748b] border-[#3f3b4d] cursor-not-allowed'
              }`}
            >
              {isMax
                ? 'MAX LEVEL'
                : isSkillTab
                ? `BUY FOR ${formatCompact(selectedNode.cost)}`
                : `${selectedNode.cost} PP`}
            </button>
          )}
        </div>

        {/* 4. CENTER BRANCHING TREE: CONNECTOR LINES SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1280 720"
        >
          <g transform="translate(640, 440)">
            {currentNodes.map((node) => {
              return node.prerequisites.map((pid) => {
                const parent = currentNodes.find((p) => p.id === pid);
                if (!parent) return null;

                const isParentUnlocked = (currentLevels[parent.id] || 0) > 0;
                const isNodeUnlocked = (currentLevels[node.id] || 0) > 0;
                const isGold = isParentUnlocked && isNodeUnlocked;

                return (
                  <g key={`${parent.id}-${node.id}`}>
                    {/* Shadow line */}
                    <line
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke="#0d0a14"
                      strokeWidth={isGold ? 6 : 4}
                      strokeLinecap="round"
                    />
                    {/* Core Line */}
                    <line
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={isGold ? (isSkillTab ? '#4ade80' : '#eab308') : '#4b4759'}
                      strokeWidth={isGold ? 3.5 : 2}
                      strokeLinecap="round"
                    />
                  </g>
                );
              });
            })}
          </g>
        </svg>

        {/* 5. OCTAGONAL SKILL NODES (Positioned relative to center 640, 440) */}
        <div className="absolute inset-0 pointer-events-auto z-20">
          <div className="absolute left-[640px] top-[440px] w-0 h-0">
            {currentNodes.map((node) => {
              const nodeLvl = currentLevels[node.id] || 0;
              const isUnlocked = nodeLvl > 0;
              const prereqsMet =
                node.prerequisites.length === 0 ||
                node.prerequisites.every((pid) => (currentLevels[pid] || 0) > 0);
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    if (selectedNodeId === node.id) {
                      const nodeLvl = currentLevels[node.id] || 0;
                      const isNodeMax = nodeLvl >= node.maxLevel;
                      const nodeCanAfford = isSkillTab
                        ? !isNodeMax && prereqsMet && funds >= node.cost
                        : !isNodeMax && prereqsMet && prestigePoints >= node.cost;

                      if (nodeCanAfford && node.id !== 'root' && node.id !== 'cash_root') {
                        soundService.playGoldenChime();
                        hapticsService.medium();
                        if (isSkillTab) {
                          onBuyCashSkill(node.id, node.cost);
                        } else {
                          onBuyPrestigeSkill(node.id, node.cost);
                        }
                        return;
                      }
                    }
                    soundService.playClick();
                    if (isSkillTab) setSelectedSkillId(node.id);
                    else setSelectedPrestigeId(node.id);
                  }}
                  style={{
                    transform: `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`,
                  }}
                  className={`absolute w-14 h-14 cursor-pointer flex items-center justify-center transition-transform hover:scale-115 active:scale-95 ${
                    isSelected ? 'scale-115' : ''
                  }`}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <div className="absolute -inset-1.5 rounded-xl border-2 border-[#fef08a] animate-pulse pointer-events-none" />
                  )}

                  {/* Octagonal Node Body */}
                  <div
                    className={`relative w-12 h-12 flex items-center justify-center rounded-lg border-2 shadow-xl ${
                      isUnlocked
                        ? isSkillTab
                          ? 'bg-[#152e20] border-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.35)]'
                          : 'bg-[#292215] border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : prereqsMet
                        ? 'bg-[#221f2d] border-[#94a3b8]'
                        : 'bg-[#181520] border-[#3f3b4d] opacity-60'
                    }`}
                  >
                    {/* Node Icon Graphic */}
                    {renderNodeIcon(node.icon, isUnlocked, isSkillTab)}

                    {/* Unlocked Green Arrow Badge in corner */}
                    {isUnlocked && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#15803d] border border-[#4ade80] flex items-center justify-center text-[9px] text-white font-pixel font-bold">
                        ↑
                      </span>
                    )}

                    {/* Padlock for locked nodes */}
                    {!prereqsMet && (
                      <span className="absolute -top-1.5 -right-1.5 text-[10px] text-[#f59e0b] drop-shadow">
                        🔒
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. BOTTOM ACTION BUTTONS */}
        <div className="absolute bottom-6 inset-x-8 z-30 flex items-center justify-between pointer-events-auto">
          {/* Reset Action */}
          <button
            onClick={() => {
              soundService.playClick();
              if (isSkillTab) onResetCashSkills();
              else onResetPrestigePoints();
            }}
            className="px-6 py-3 bg-[#1f1a27] hover:bg-[#2b2436] border-2 border-[#5c4a32] rounded-lg text-xs font-pixel text-[#f87171] hover:text-red-300 transition-all active:scale-95 shadow-[0_6px_20px_rgba(0,0,0,0.7)]"
          >
            {isSkillTab ? 'Reset Skills (Refund $)' : 'Reset Points (Refund PP)'}
          </button>

          {/* Center Prestige Action (in Prestige Tab) */}
          {!isSkillTab && (
            <button
              onClick={() => {
                soundService.playPrestige();
                onPrestigeShift();
              }}
              className="px-6 py-3 bg-[#241c10] hover:bg-[#382b18] border-2 border-[#f59e0b] rounded-lg text-xs font-pixel text-[#fbbf24] hover:text-white transition-all active:scale-95 shadow-[0_6px_20px_rgba(245,158,11,0.3)]"
            >
              Prestige Shift (+{ppGainedOnShift} PP)
            </button>
          )}

          {/* Start Shift / Return to Workbench */}
          <button
            onClick={() => {
              soundService.playCashChime(2);
              onStartShift();
            }}
            className="px-8 py-3 bg-[#1f1a27] hover:bg-[#2b2436] border-2 border-[#eab308] rounded-lg text-xs font-pixel text-[#fef08a] hover:text-white transition-all active:scale-95 shadow-[0_6px_20px_rgba(234,179,8,0.25)]"
          >
            Start Shift
          </button>
        </div>
      </div>
    </div>
  );
};

function renderNodeIcon(icon: string, isUnlocked: boolean, isSkillTab: boolean) {
  const textColor = isUnlocked ? (isSkillTab ? '#86efac' : '#fef08a') : '#cbd5e1';

  switch (icon) {
    case 'root_tent':
      return <span className="font-pixel text-lg text-[#f59e0b]">▲</span>;
    case 'infinity':
      return <span className="font-pixel text-base text-[#38bdf8] font-bold">∞</span >;
    case 'piggy':
      return <span className="font-pixel text-sm">🐷</span>;
    case 'bill_1':
      return <span className="font-pixel text-[9px] font-bold" style={{ color: textColor }}>$1</span>;
    case 'bill_5':
      return <span className="font-pixel text-[9px] font-bold" style={{ color: textColor }}>$5</span>;
    case 'bill_10':
      return <span className="font-pixel text-[9px] font-bold" style={{ color: textColor }}>$10</span>;
    case 'bill_20':
      return <span className="font-pixel text-[9px] font-bold" style={{ color: textColor }}>$20</span>;
    case 'bill_100':
      return <span className="font-pixel text-[9px] font-bold" style={{ color: textColor }}>$100</span>;
    case 'card_swipe':
      return <span className="font-pixel text-sm">💳</span>;
    case 'battery':
      return <span className="font-pixel text-sm text-[#38bdf8]">🔋</span>;
    case 'phone':
      return <span className="font-pixel text-sm text-[#f59e0b]">☎</span>;
    case 'stars':
      return <span className="font-pixel text-sm text-[#f59e0b]">★</span>;
    case 'gold_coin':
      return <span className="font-pixel text-sm text-[#eab308]">🪙</span>;
    case 'ring':
      return <span className="font-pixel text-sm text-[#cbd5e1]">⚙</span>;
    case 'ring_double':
      return <span className="font-pixel text-sm text-[#eab308]">🗑️</span>;
    default:
      return <span className="font-pixel text-sm text-[#94a3b8]">✦</span>;
  }
}
