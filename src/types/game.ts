export type NoteType =
  | 'standard'
  | 'reinforced'
  | 'spark'
  | 'burst'
  | 'golden'
  | 'burning'
  | 'collector'
  | 'diamond'
  | 'prestige_coin';

export interface Note {
  id: string;
  type: NoteType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  baseValue: number;
  isDestroyed: boolean;
  flutterTime: number;
  scale: number;
  isShredding: boolean;
  tearProgress: number; // 0 to 1
  isBundle?: boolean; // Wrapped in burgundy band
  bundleCount?: number;
  denomination: number; // 1, 2, 5, 10, 20, 100
  // Master physics & chain reaction attributes
  contactTimer?: number; // Golden conversion timer (5.0s)
  burnTimer?: number; // DoT tick timer for burning notes
  isBurning?: boolean;
  absorbedHp?: number; // Collector gravity well total absorbed HP
  absorbedValue?: number; // Collector compounded payout
  interestMultiplier?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'strip' | 'square' | 'spark' | 'ring' | 'flame';
  widthRatio?: number;
  targetBin?: boolean; // Travelling towards the lower-right waste bin
  targetBinX?: number;
  targetBinY?: number;
}

export interface ShardProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  damage: number;
  angle: number;
}

export interface PrestigeOrb {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

export interface StockCertificate {
  id: 'bitcorn' | 'tulip';
  name: string;
  ticker: string;
  currentPrice: number;
  basePrice: number;
  history: number[];
  ownedShares: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isDragging?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
  vy: number;
}

export interface UpgradeItem {
  id: string;
  name: string;
  panel: 'breaker' | 'cash';
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  getEffectValue: (level: number) => number;
  getEffectLabel: (level: number) => string;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  currency: 'pp' | 'cash';
  cost: number;
  costPP?: number;
  treeType: 'prestige' | 'skill';
  level: number;
  maxLevel: number;
  icon: string;
  x: number;
  y: number;
  prerequisites: string[];
  getEffectBenefit: (level: number) => string;
}

export interface GameSettings {
  sound: boolean;
  vibration: boolean;
  reducedEffects: boolean;
  reducedMotion: boolean;
}

export interface GameStats {
  totalNotesShredded: number;
  notesByType: Record<NoteType, number>;
  totalCreditsEarned: number;
  prestigeCount: number;
  highestCombo: number;
  highestFrenzyStage: number;
  timePlayedSeconds: number;
  wasteBinEmptiedCount: number;
  stocksProfits: number;
}

export interface PhoneCallMilestone {
  id: string;
  triggerCash: number;
  title: string;
  speaker: string;
  dialogue: string[];
  unlockedFeature?: string;
}

export interface SaveData {
  version: number;
  credits: number;
  lifetimeCredits: number;
  prestigePoints: number;
  totalPPEarned: number;
  prestigeBarProgress: number; // 0 to 100 progress towards next PP
  prestigeBarMax: number; // required progress for next PP (e.g. 60)
  spentPP: number;
  spentCashSkills: number;
  upgradeLevels: Record<string, number>;
  skillLevels: Record<string, number>;
  prestigeTreeLevels: Record<string, number>;
  stats: GameStats;
  settings: GameSettings;
  lastSavedTimestamp: number;
  wasteBinCount: number;
  shiftBonusTimer: number;
  seenPhoneCalls: string[];
  stockHoldings: Record<string, number>;
}

