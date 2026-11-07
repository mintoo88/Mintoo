import { SaveData, GameSettings, GameStats } from '../types/game';
import { ALL_UPGRADES, PRESTIGE_TREE_NODES, CASH_SKILL_NODES } from '../game/upgrades';

export type { SaveData };

const STORAGE_KEY = 'what_the_buck_cash_crunch_v3';
const LEGACY_STORAGE_KEY_V2 = 'cash_crunch_save_v2';
const LEGACY_STORAGE_KEY_V1 = 'cash_crunch_save_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  vibration: true,
  reducedEffects: false,
  reducedMotion: false,
};

export const DEFAULT_STATS: GameStats = {
  totalNotesShredded: 0,
  notesByType: {
    standard: 0,
    reinforced: 0,
    spark: 0,
    burst: 0,
    golden: 0,
    burning: 0,
    collector: 0,
    diamond: 0,
    prestige_coin: 0,
  },
  totalCreditsEarned: 0,
  prestigeCount: 0,
  highestCombo: 0,
  highestFrenzyStage: 1,
  timePlayedSeconds: 0,
  wasteBinEmptiedCount: 0,
  stocksProfits: 0,
};

export function getDefaultSaveData(): SaveData {
  const initialUpgradeLevels: Record<string, number> = {};
  ALL_UPGRADES.forEach((u) => {
    initialUpgradeLevels[u.id] = u.level;
  });

  const initialPrestigeLevels: Record<string, number> = {};
  PRESTIGE_TREE_NODES.forEach((s) => {
    initialPrestigeLevels[s.id] = s.id === 'root' ? 1 : 0;
  });

  const initialCashSkills: Record<string, number> = {};
  CASH_SKILL_NODES.forEach((s) => {
    initialCashSkills[s.id] = s.id === 'cash_root' ? 1 : 0;
  });

  return {
    version: 3,
    credits: 0,
    lifetimeCredits: 0,
    prestigePoints: 0,
    totalPPEarned: 0,
    prestigeBarProgress: 0,
    prestigeBarMax: 60,
    spentPP: 0,
    spentCashSkills: 0,
    upgradeLevels: initialUpgradeLevels,
    skillLevels: initialCashSkills,
    prestigeTreeLevels: initialPrestigeLevels,
    stats: { ...DEFAULT_STATS },
    settings: { ...DEFAULT_SETTINGS },
    lastSavedTimestamp: Date.now(),
    wasteBinCount: 0,
    shiftBonusTimer: 0,
    seenPhoneCalls: [],
    stockHoldings: { bitcorn: 0, tulip: 0 },
  };
}

export function loadSaveData(): { data: SaveData; offlineEarnings: number; offlineSeconds: number } {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
    if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY_V1);

    if (!raw) {
      return { data: getDefaultSaveData(), offlineEarnings: 0, offlineSeconds: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<SaveData> & Record<string, unknown>;
    const defaultData = getDefaultSaveData();

    // Map legacy upgrade names if present
    const upgradeLevels = { ...defaultData.upgradeLevels };
    if (parsed.upgradeLevels) {
      Object.entries(parsed.upgradeLevels).forEach(([k, v]) => {
        if (typeof v === 'number') {
          if (k === 'sharp_blades') upgradeLevels['damage'] = Math.max(upgradeLevels['damage'] || 1, v);
          else if (k === 'wider_teeth') upgradeLevels['radius'] = Math.max(upgradeLevels['radius'] || 1, v);
          else if (k === 'hopper_capacity') upgradeLevels['bundled_bills'] = Math.max(upgradeLevels['bundled_bills'] || 0, v);
          else if (k === 'rapid_feeder') upgradeLevels['dispense_rate'] = Math.max(upgradeLevels['dispense_rate'] || 0, v);
          else if (k === 'crisp_mint') upgradeLevels['bill_value'] = Math.max(upgradeLevels['bill_value'] || 0, v);
          else if (k === 'quality_sort') upgradeLevels['special_bills'] = Math.max(upgradeLevels['special_bills'] || 0, v);
          else if (k === 'motorized_conveyor' || k === 'roaming_blade') upgradeLevels['automation'] = Math.max(upgradeLevels['automation'] || 0, v);
          else upgradeLevels[k] = v;
        }
      });
    }

    // Map prestige tree levels (PP)
    const prestigeTreeLevels = { ...defaultData.prestigeTreeLevels };
    if (parsed.prestigeTreeLevels) {
      Object.assign(prestigeTreeLevels, parsed.prestigeTreeLevels);
    } else if (parsed.skillLevels) {
      // Migrate legacy prestige skills that were in skillLevels
      PRESTIGE_TREE_NODES.forEach((node) => {
        if (parsed.skillLevels && typeof parsed.skillLevels[node.id] === 'number') {
          prestigeTreeLevels[node.id] = parsed.skillLevels[node.id];
        }
      });
    }
    prestigeTreeLevels['root'] = 1;

    // Map cash skill levels ($)
    const skillLevels = { ...defaultData.skillLevels };
    if (parsed.skillLevels) {
      CASH_SKILL_NODES.forEach((node) => {
        if (parsed.skillLevels && typeof parsed.skillLevels[node.id] === 'number') {
          skillLevels[node.id] = parsed.skillLevels[node.id];
        }
      });
    }
    skillLevels['cash_root'] = 1;

    const data: SaveData = {
      version: 3,
      credits: typeof parsed.credits === 'number' ? parsed.credits : 0,
      lifetimeCredits: typeof parsed.lifetimeCredits === 'number' ? parsed.lifetimeCredits : 0,
      prestigePoints: typeof parsed.prestigePoints === 'number' ? parsed.prestigePoints : (typeof parsed.gearTokens === 'number' ? parsed.gearTokens : 0),
      totalPPEarned: typeof parsed.totalPPEarned === 'number' ? parsed.totalPPEarned : 0,
      prestigeBarProgress: typeof parsed.prestigeBarProgress === 'number' ? parsed.prestigeBarProgress : 0,
      prestigeBarMax: typeof parsed.prestigeBarMax === 'number' && parsed.prestigeBarMax > 0 ? parsed.prestigeBarMax : 60,
      spentPP: typeof parsed.spentPP === 'number' ? parsed.spentPP : 0,
      spentCashSkills: typeof parsed.spentCashSkills === 'number' ? parsed.spentCashSkills : 0,
      upgradeLevels: {
        ...upgradeLevels,
        radius: Math.max(1, upgradeLevels['radius'] || 1),
        damage: Math.max(1, upgradeLevels['damage'] || 1),
        amount: Math.max(1, upgradeLevels['amount'] || 1),
      },
      skillLevels,
      prestigeTreeLevels,
      stats: { ...defaultData.stats, ...((parsed.stats as GameStats) || {}) },
      settings: { ...defaultData.settings, ...((parsed.settings as GameSettings) || {}) },
      lastSavedTimestamp: parsed.lastSavedTimestamp || Date.now(),
      wasteBinCount: typeof parsed.wasteBinCount === 'number' ? parsed.wasteBinCount : 0,
      shiftBonusTimer: 0,
      seenPhoneCalls: Array.isArray(parsed.seenPhoneCalls) ? parsed.seenPhoneCalls : [],
      stockHoldings: (parsed.stockHoldings as Record<string, number>) || { bitcorn: 0, tulip: 0 },
    };

    // Calculate offline earnings if automation is active
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - data.lastSavedTimestamp) / 1000));
    const cappedSeconds = Math.min(elapsedSeconds, 7200);

    let offlineEarnings = 0;
    const autoLevel = data.upgradeLevels['automation'] || 0;
    if (autoLevel > 0 && cappedSeconds > 30) {
      const valLvl = data.upgradeLevels['bill_value'] || 0;
      const rateLvl = data.upgradeLevels['dispense_rate'] || 0;
      const rate = 0.5 + rateLvl * 0.1;
      const val = 10 * (1 + valLvl * 0.35);
      offlineEarnings = Math.floor(rate * val * cappedSeconds * 0.75);

      if (offlineEarnings > 0) {
        data.credits += offlineEarnings;
        data.lifetimeCredits += offlineEarnings;
        data.stats.totalCreditsEarned += offlineEarnings;
      }
    }

    data.lastSavedTimestamp = now;
    return { data, offlineEarnings, offlineSeconds: cappedSeconds };
  } catch {
    return { data: getDefaultSaveData(), offlineEarnings: 0, offlineSeconds: 0 };
  }
}

export function saveGameData(data: SaveData) {
  try {
    data.lastSavedTimestamp = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or sandboxed
  }
}

export function hardResetSave(): SaveData {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
  localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  return getDefaultSaveData();
}
