import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BREAKER_UPGRADES,
  CASH_UPGRADES,
  ALL_UPGRADES,
  PRESTIGE_COST,
  calculatePPGained,
  getUpgradeCost,
  getShiftThreshold,
} from './game/upgrades';
import {
  SimulationState,
  createInitialSimulation,
  updateSimulation,
  dispenseNotes,
  emptyWasteBin,
  SimulationConfig,
} from './game/simulation';
import {
  renderWhatTheBuckScene,
  LAYOUT,
} from './game/canvasRenderer';
import { MR_BUCK_MILESTONES } from './game/narrative';
import { SkillTreeView } from './components/SkillTreeView';
import { PrestigeModal } from './components/Modals/PrestigeModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { HowToPlayModal } from './components/Modals/HowToPlayModal';
import { OfflineEarningsModal } from './components/Modals/OfflineEarningsModal';
import { StatsModal } from './components/Modals/StatsModal';
import { PhoneDialogueModal } from './components/Modals/PhoneDialogueModal';
import { loadSaveData, saveGameData, hardResetSave } from './services/storage';
import { SaveData, UpgradeItem, PhoneCallMilestone } from './types/game';
import { soundService } from './services/audio';
import { hapticsService } from './services/haptics';

export default function App() {
  // Save State
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData().data);
  const [offlineReport, setOfflineReport] = useState<{ credits: number; seconds: number }>({
    credits: 0,
    seconds: 0,
  });
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);

  // Scene Mode: 'gameplay' | 'skill_tree'
  const [sceneMode, setSceneMode] = useState<'gameplay' | 'skill_tree'>('gameplay');
  const [treeInitialTab, setTreeInitialTab] = useState<'skill' | 'prestige'>('skill');

  // Modals
  const [showPrestigeModal, setShowPrestigeModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [activeMilestone, setActiveMilestone] = useState<PhoneCallMilestone | null>(null);

  // Upgrade selection/hover state
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [hoveredUpgradeId, setHoveredUpgradeId] = useState<string | null>(null);

  // Simulation & Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<SimulationState>(createInitialSimulation());
  const saveDataRef = useRef<SaveData>(saveData);
  saveDataRef.current = saveData;

  // Breaker Pointer Input
  const breakerInputRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    radius: number;
    rotation: number;
  }>({
    x: 640,
    y: 360,
    active: false,
    radius: 34,
    rotation: 0,
  });

  // Calculate Breaker Radius
  const currentRadius = useCallback(() => {
    const radLvl = saveData.upgradeLevels['radius'] ?? 1;
    return 34 + (radLvl - 1) * 5;
  }, [saveData.upgradeLevels]);

  // Initial load check & phone milestone trigger check
  useEffect(() => {
    const loaded = loadSaveData();
    soundService.setEnabled(loaded.data.settings.sound);
    hapticsService.setEnabled(loaded.data.settings.vibration);
    if (loaded.offlineEarnings > 0) {
      setOfflineReport({ credits: loaded.offlineEarnings, seconds: loaded.offlineSeconds });
      setShowOfflineModal(true);
    }

    // Trigger initial welcome call if not seen
    const seen = loaded.data.seenPhoneCalls || [];
    if (!seen.includes('milestone_start')) {
      const startMilestone = MR_BUCK_MILESTONES[0];
      setActiveMilestone(startMilestone);
      setShowPhoneModal(true);
      soundService.playPhoneRing();
    }
  }, []);

  // Monitor narrative milestones
  useEffect(() => {
    const seen = saveData.seenPhoneCalls || [];
    const nextMilestone = MR_BUCK_MILESTONES.find(
      (m) => !seen.includes(m.id) && saveData.lifetimeCredits >= m.triggerCash
    );

    if (nextMilestone && !showPhoneModal) {
      setActiveMilestone(nextMilestone);
      soundService.playPhoneRing();
      // Auto show or display badge
      setShowPhoneModal(true);
    }
  }, [saveData.lifetimeCredits, saveData.seenPhoneCalls, showPhoneModal]);

  // Autosave
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveGameData(saveDataRef.current);
    }, 4000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveGameData(saveDataRef.current);
        soundService.stopShredLoop();
        breakerInputRef.current.active = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => saveGameData(saveDataRef.current));

    return () => {
      clearInterval(saveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Main 60 FPS Landscape Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      const sim = simRef.current;
      const currentSave = saveDataRef.current;

      if (canvas && sceneMode === 'gameplay') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Update breaker radius & rotation
          breakerInputRef.current.radius = currentRadius();
          if (breakerInputRef.current.active) {
            breakerInputRef.current.rotation += dt * 18;
          }

          // Simulation Config (in 1280x720 virtual space)
          const config: SimulationConfig = {
            deskBounds: {
              left: LAYOUT.mat.x,
              top: LAYOUT.mat.y,
              right: LAYOUT.mat.x + LAYOUT.mat.w,
              bottom: LAYOUT.mat.y + LAYOUT.mat.h,
            },
            binPos: {
              x: LAYOUT.bin.x + LAYOUT.bin.w / 2,
              y: LAYOUT.bin.y + 20,
            },
            dispenserPos: {
              x: LAYOUT.dispenser.x,
              y: LAYOUT.dispenser.y,
            },
            upgrades: currentSave.upgradeLevels,
            skills: currentSave.skillLevels,
            prestigeSkills: currentSave.prestigeTreeLevels,
            upgradeDefs: ALL_UPGRADES,
            reducedEffects: currentSave.settings.reducedEffects,
            reducedMotion: currentSave.settings.reducedMotion,
          };

          // Step Simulation
          const { creditsDelta, ppDelta, prestigeProgressDelta } = updateSimulation(
            sim,
            dt,
            config,
            breakerInputRef.current,
            currentSave.stats
          );

          if (creditsDelta > 0 || ppDelta > 0 || prestigeProgressDelta > 0) {
            setSaveData((prev: SaveData) => {
              let newProg = (prev.prestigeBarProgress || 0) + (prestigeProgressDelta || 0);
              let newMax = prev.prestigeBarMax || 60;
              let gainedPP = ppDelta || 0;

              while (newProg >= newMax) {
                newProg -= newMax;
                newMax = Math.round(newMax * 1.25 + 10);
                gainedPP += 1;

                sim.floatingTexts.push({
                  id: `pp_bar_${Date.now()}_${Math.random()}`,
                  x: 640,
                  y: 280,
                  text: '+1 PRESTIGE POINT!',
                  color: '#fbbf24',
                  life: 1.4,
                  maxLife: 1.4,
                  scale: 1.35,
                  vy: -40,
                });
                soundService.playCoinSound();
                hapticsService.heavy();
              }

              const updated: SaveData = {
                ...prev,
                credits: prev.credits + creditsDelta,
                lifetimeCredits: prev.lifetimeCredits + creditsDelta,
                prestigePoints: prev.prestigePoints + gainedPP,
                totalPPEarned: prev.totalPPEarned + gainedPP,
                prestigeBarProgress: newProg,
                prestigeBarMax: newMax,
                wasteBinCount: sim.wasteBinCount,
              };
              saveDataRef.current = updated;
              return updated;
            });
          }

          const hasUnseenCalls = MR_BUCK_MILESTONES.some(
            (m) =>
              !(currentSave.seenPhoneCalls || []).includes(m.id) &&
              currentSave.lifetimeCredits >= m.triggerCash
          );

          const autoSwiperUnlocked =
            (currentSave.prestigeTreeLevels?.['vip_card'] || 0) > 0 ||
            (currentSave.upgradeLevels['automation'] || 0) > 0;

          // Render 1280x720 Landscape Frame
          renderWhatTheBuckScene({
            ctx,
            width,
            height,
            notes: sim.notes,
            particles: sim.particles,
            floatingTexts: sim.floatingTexts,
            breaker: breakerInputRef.current,
            credits: currentSave.credits,
            lifetimeCredits: currentSave.lifetimeCredits,
            prestigePoints: currentSave.prestigePoints,
            prestigeBarProgress: currentSave.prestigeBarProgress || 0,
            prestigeBarMax: currentSave.prestigeBarMax || 60,
            currentShiftThreshold: getShiftThreshold(currentSave.stats.prestigeCount),
            wasteBinCount: sim.wasteBinCount,
            maxBinCapacity: sim.maxBinCapacity,
            dispenserPulse: sim.dispenserPulse,
            dispenserDisplayText: sim.dispenserDisplayText,
            breakerUpgrades: BREAKER_UPGRADES,
            cashUpgrades: CASH_UPGRADES,
            upgradeLevels: currentSave.upgradeLevels,
            selectedUpgradeId,
            hoveredUpgradeId,
            shockwaves: sim.shockwaves,
            lightningArcs: sim.lightningArcs,
            prestigeOrbs: sim.prestigeOrbs,
            shardProjectiles: sim.shardProjectiles,
            stockCertificates: sim.stockCertificates,
            comboCount: sim.comboCount,
            comboMultiplier: sim.comboMultiplier,
            comboTimer: sim.comboTimer,
            frenzyStage: sim.frenzyStage,
            frenzyMultiplier: sim.frenzyMultiplier,
            autoSwiperAngle: sim.autoSwiperAngle,
            autoSwiperUnlocked,
            hasUnreadPhoneCall: hasUnseenCalls,
            reducedEffects: currentSave.settings.reducedEffects,
          });
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentRadius, sceneMode, selectedUpgradeId, hoveredUpgradeId]);

  // Canvas Resize Handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Virtual Coordinate Mapper (screen clientX/Y -> 1280x720 space)
  const getVirtualCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasW = canvas.width / dpr;
    const canvasH = canvas.height / dpr;

    const scale = Math.min(canvasW / 1280, canvasH / 720);
    const offsetX = (canvasW - 1280 * scale) / 2;
    const offsetY = (canvasH - 720 * scale) / 2;

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const vx = (clickX - offsetX) / scale;
    const vy = (clickY - offsetY) / scale;

    return { x: vx, y: vy };
  };

  // Trigger Dispensing
  const handleDispense = () => {
    const currentSave = saveDataRef.current;
    const config: SimulationConfig = {
      deskBounds: {
        left: LAYOUT.mat.x,
        top: LAYOUT.mat.y,
        right: LAYOUT.mat.x + LAYOUT.mat.w,
        bottom: LAYOUT.mat.y + LAYOUT.mat.h,
      },
      binPos: {
        x: LAYOUT.bin.x + LAYOUT.bin.w / 2,
        y: LAYOUT.bin.y + 20,
      },
      dispenserPos: {
        x: LAYOUT.dispenser.x,
        y: LAYOUT.dispenser.y,
      },
      upgrades: currentSave.upgradeLevels,
      skills: currentSave.skillLevels,
      prestigeSkills: currentSave.prestigeTreeLevels,
      upgradeDefs: ALL_UPGRADES,
      reducedEffects: currentSave.settings.reducedEffects,
      reducedMotion: currentSave.settings.reducedMotion,
    };

    dispenseNotes(simRef.current, config, 1);
    hapticsService.light();
  };

  // Buy Upgrade
  const handleBuyUpgrade = (upgrade: UpgradeItem) => {
    const currentLvl = saveData.upgradeLevels[upgrade.id] ?? upgrade.level;
    const cost = getUpgradeCost(upgrade, currentLvl);

    if (saveData.credits >= cost && currentLvl < upgrade.maxLevel) {
      soundService.playCashChime(3);
      hapticsService.light();

      setSaveData((prev: SaveData) => {
        const next = {
          ...prev,
          credits: prev.credits - cost,
          upgradeLevels: {
            ...prev.upgradeLevels,
            [upgrade.id]: currentLvl + 1,
          },
        };
        saveDataRef.current = next;
        saveGameData(next);
        return next;
      });
    } else {
      soundService.playClick();
    }
  };

  // Handle Stock Asset Interaction (Shredding or Liquidation)
  const handleStockClick = (relX: number) => {
    const sim = simRef.current;
    const isBitcorn = relX < 112;
    const stock = isBitcorn ? sim.stockCertificates[0] : sim.stockCertificates[1];
    if (!stock) return;

    // Instant shredding for volatile cash payout!
    const multiplier = 1.25 + Math.random() * 0.5;
    const payout = Math.round(stock.currentPrice * multiplier);

    soundService.playGoldenChime();
    hapticsService.heavy();

    sim.floatingTexts.push({
      id: `stock_${Date.now()}`,
      x: LAYOUT.stockTray.x + (isBitcorn ? 50 : 160),
      y: LAYOUT.stockTray.y - 10,
      text: `+$${payout.toLocaleString()} ${stock.ticker} SHREDDED!`,
      color: isBitcorn ? '#fbbf24' : '#f472b6',
      life: 1.2,
      maxLife: 1.2,
      scale: 1.2,
      vy: -35,
    });

    setSaveData((prev: SaveData) => {
      const next = {
        ...prev,
        credits: prev.credits + payout,
        lifetimeCredits: prev.lifetimeCredits + payout,
        stats: {
          ...prev.stats,
          stocksProfits: prev.stats.stocksProfits + payout,
        },
      };
      saveDataRef.current = next;
      saveGameData(next);
      return next;
    });
  };

  // Pointer Down on 1280x720 Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (sceneMode !== 'gameplay') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getVirtualCoords(e.clientX, e.clientY);
    if (!coords) return;

    const { x, y } = coords;
    const { leftPanel, rightPanel, upperBar, dispenser, bin, mat, monitor, utilityBar, stockTray } = LAYOUT;

    // 1. Check Top-Left Retro Monitor click (Opens Settings)
    if (x >= monitor.x && x <= monitor.x + monitor.w && y >= monitor.y && y <= monitor.y + monitor.h) {
      soundService.playClick();
      setShowSettings(true);
      return;
    }

    // 2. Check Lower-Left Arcade Utility Console (Settings, Stats, Help, Phone)
    if (x >= utilityBar.x && x <= utilityBar.x + utilityBar.w && y >= utilityBar.y && y <= utilityBar.y + utilityBar.h) {
      const relX = x - utilityBar.x;
      soundService.playClick();
      if (relX < 45) {
        setShowSettings(true);
      } else if (relX < 90) {
        setShowStats(true);
      } else if (relX < 135) {
        setShowHowToPlay(true);
      } else {
        // Open Mr. Buck Phone Hotline!
        setShowPhoneModal(true);
      }
      return;
    }

    // 3. Check Left Breaker Upgrades Panel Click
    if (x >= leftPanel.x && x <= leftPanel.x + leftPanel.w && y >= leftPanel.y && y <= leftPanel.y + leftPanel.h) {
      const headerH = 34;
      if (y > leftPanel.y + headerH) {
        const rowH = (leftPanel.h - headerH) / BREAKER_UPGRADES.length;
        const idx = Math.floor((y - (leftPanel.y + headerH)) / rowH);
        if (idx >= 0 && idx < BREAKER_UPGRADES.length) {
          handleBuyUpgrade(BREAKER_UPGRADES[idx]);
          setSelectedUpgradeId(BREAKER_UPGRADES[idx].id);
        }
      }
      return;
    }

    // 4. Check Right Withdrawal Upgrades Panel Click
    if (x >= rightPanel.x && x <= rightPanel.x + rightPanel.w && y >= rightPanel.y && y <= rightPanel.y + rightPanel.h) {
      const headerH = 34;
      if (y > rightPanel.y + headerH) {
        const rowH = (rightPanel.h - headerH) / CASH_UPGRADES.length;
        const idx = Math.floor((y - (rightPanel.y + headerH)) / rowH);
        if (idx >= 0 && idx < CASH_UPGRADES.length) {
          handleBuyUpgrade(CASH_UPGRADES[idx]);
          setSelectedUpgradeId(CASH_UPGRADES[idx].id);
        }
      }
      return;
    }

    // 5. Check Upper Center Bar (Skill Tree & Prestige)
    if (x >= upperBar.x && x <= upperBar.x + upperBar.w && y >= upperBar.y && y <= upperBar.y + upperBar.h) {
      const midX = upperBar.x + upperBar.w / 2;
      soundService.playClick();
      if (x < midX) {
        setTreeInitialTab('skill');
        setSceneMode('skill_tree');
      } else {
        if (saveData.credits >= PRESTIGE_COST) {
          setShowPrestigeModal(true);
        } else {
          setTreeInitialTab('prestige');
          setSceneMode('skill_tree');
        }
      }
      return;
    }

    // 6. Check Financial Stock Tray Click
    if (x >= stockTray.x && x <= stockTray.x + stockTray.w && y >= stockTray.y && y <= stockTray.y + stockTray.h) {
      handleStockClick(x - stockTray.x);
      return;
    }

    // 7. Check Dispenser & Card Reader Tap
    if (x >= dispenser.x && x <= dispenser.x + dispenser.w && y >= dispenser.y && y <= dispenser.y + dispenser.h) {
      handleDispense();
      return;
    }

    // 8. Check Waste Bin Tap (Recycle pulp)
    if (x >= bin.x && x <= bin.x + bin.w && y >= bin.y && y <= bin.y + bin.h) {
      const config: SimulationConfig = {
        deskBounds: { left: mat.x, top: mat.y, right: mat.x + mat.w, bottom: mat.y + mat.h },
        binPos: { x: bin.x + bin.w / 2, y: bin.y + 20 },
        dispenserPos: { x: dispenser.x, y: dispenser.y },
        upgrades: saveDataRef.current.upgradeLevels,
        skills: saveDataRef.current.skillLevels,
        prestigeSkills: saveDataRef.current.prestigeTreeLevels,
        upgradeDefs: ALL_UPGRADES,
        reducedEffects: saveDataRef.current.settings.reducedEffects,
        reducedMotion: saveDataRef.current.settings.reducedMotion,
      };
      const earned = emptyWasteBin(simRef.current, config);
      if (earned > 0) {
        setSaveData((prev: SaveData) => {
          const next = {
            ...prev,
            credits: prev.credits + earned,
            lifetimeCredits: prev.lifetimeCredits + earned,
            wasteBinCount: 0,
            stats: {
              ...prev.stats,
              wasteBinEmptiedCount: prev.stats.wasteBinEmptiedCount + 1,
            },
          };
          saveDataRef.current = next;
          saveGameData(next);
          return next;
        });
      }
      return;
    }

    // 9. Otherwise: Breaker Drag
    breakerInputRef.current.x = x;
    breakerInputRef.current.y = y;
    breakerInputRef.current.active = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (sceneMode !== 'gameplay') return;

    const coords = getVirtualCoords(e.clientX, e.clientY);
    if (!coords) return;

    const { x, y } = coords;

    const { leftPanel, rightPanel } = LAYOUT;
    if (x >= leftPanel.x && x <= leftPanel.x + leftPanel.w && y >= leftPanel.y + 34 && y <= leftPanel.y + leftPanel.h) {
      const rowH = (leftPanel.h - 34) / BREAKER_UPGRADES.length;
      const idx = Math.floor((y - (leftPanel.y + 34)) / rowH);
      if (idx >= 0 && idx < BREAKER_UPGRADES.length) setHoveredUpgradeId(BREAKER_UPGRADES[idx].id);
    } else if (x >= rightPanel.x && x <= rightPanel.x + rightPanel.w && y >= rightPanel.y + 34 && y <= rightPanel.y + rightPanel.h) {
      const rowH = (rightPanel.h - 34) / CASH_UPGRADES.length;
      const idx = Math.floor((y - (rightPanel.y + 34)) / rowH);
      if (idx >= 0 && idx < CASH_UPGRADES.length) setHoveredUpgradeId(CASH_UPGRADES[idx].id);
    } else {
      setHoveredUpgradeId(null);
    }

    if (breakerInputRef.current.active) {
      breakerInputRef.current.x = x;
      breakerInputRef.current.y = y;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    breakerInputRef.current.active = false;
    soundService.stopShredLoop();
  };

  // 1. Cash Skill Purchases ($ Cash)
  const handleBuyCashSkill = (nodeId: string, costCash: number) => {
    if (saveData.credits >= costCash) {
      setSaveData((prev: SaveData) => {
        const next: SaveData = {
          ...prev,
          credits: prev.credits - costCash,
          spentCashSkills: (prev.spentCashSkills || 0) + costCash,
          skillLevels: {
            ...prev.skillLevels,
            [nodeId]: (prev.skillLevels[nodeId] || 0) + 1,
          },
        };
        saveDataRef.current = next;
        saveGameData(next);
        return next;
      });
    }
  };

  // Reset Cash Skills
  const handleResetCashSkills = () => {
    soundService.playClick();
    setSaveData((prev: SaveData) => {
      const refunded = prev.spentCashSkills || 0;
      const next: SaveData = {
        ...prev,
        credits: prev.credits + refunded,
        spentCashSkills: 0,
        skillLevels: { cash_root: 1 },
      };
      saveDataRef.current = next;
      saveGameData(next);
      return next;
    });
  };

  // 2. Prestige Tree Purchases (PP)
  const handleBuyPrestigeSkill = (nodeId: string, costPP: number) => {
    if (saveData.prestigePoints >= costPP) {
      setSaveData((prev: SaveData) => {
        const next: SaveData = {
          ...prev,
          prestigePoints: prev.prestigePoints - costPP,
          spentPP: prev.spentPP + costPP,
          prestigeTreeLevels: {
            ...prev.prestigeTreeLevels,
            [nodeId]: (prev.prestigeTreeLevels[nodeId] || 0) + 1,
          },
        };
        saveDataRef.current = next;
        saveGameData(next);
        return next;
      });
    }
  };

  // Reset Prestige Points
  const handleResetPrestigePoints = () => {
    soundService.playClick();
    setSaveData((prev: SaveData) => {
      const refunded = prev.spentPP || 0;
      const cleanPrestige: Record<string, number> = { root: 1 };
      const next: SaveData = {
        ...prev,
        prestigePoints: prev.prestigePoints + refunded,
        spentPP: 0,
        prestigeTreeLevels: cleanPrestige,
      };
      saveDataRef.current = next;
      saveGameData(next);
      return next;
    });
  };

  // Prestige Shift Reset
  const handleConfirmPrestige = () => {
    const gainedPP = calculatePPGained(saveData.lifetimeCredits, saveData.stats.prestigeCount);

    soundService.playPrestige();
    hapticsService.heavy();

    const deepPocketsLevel =
      (saveData.prestigeTreeLevels?.['deep_pockets'] || saveData.skillLevels['deep_pockets']) || 0;
    const retainedCredits = Math.round(saveData.credits * (deepPocketsLevel * 0.05));

    const resetUpgrades: Record<string, number> = {};
    ALL_UPGRADES.forEach((u) => {
      resetUpgrades[u.id] = u.level;
    });

    simRef.current = createInitialSimulation();

    const piggyLvl =
      (saveData.prestigeTreeLevels?.['piggy_bank'] || saveData.skillLevels['piggy_bank']) || 0;
    simRef.current.shiftBonusTimer = piggyLvl * 20;

    setSaveData((prev: SaveData) => {
      const next: SaveData = {
        ...prev,
        credits: retainedCredits,
        prestigePoints: prev.prestigePoints + gainedPP,
        totalPPEarned: prev.totalPPEarned + gainedPP,
        upgradeLevels: resetUpgrades,
        skillLevels: { cash_root: 1 },
        spentCashSkills: 0,
        stats: {
          ...prev.stats,
          prestigeCount: prev.stats.prestigeCount + 1,
        },
      };
      saveDataRef.current = next;
      saveGameData(next);
      return next;
    });

    setShowPrestigeModal(false);
  };

  const handleHardReset = () => {
    const fresh = hardResetSave();
    simRef.current = createInitialSimulation();
    setSaveData(fresh);
    saveDataRef.current = fresh;
    soundService.playClick();
  };

  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    if (activeMilestone) {
      setSaveData((prev: SaveData) => {
        const seen = prev.seenPhoneCalls || [];
        if (!seen.includes(activeMilestone.id)) {
          const next = {
            ...prev,
            seenPhoneCalls: [...seen, activeMilestone.id],
          };
          saveDataRef.current = next;
          saveGameData(next);
          return next;
        }
        return prev;
      });
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center select-none font-pixel">
      {/* 16:9 LANDSCAPE VIEWPORT WRAPPER */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] flex items-center justify-center overflow-hidden"
      >
        {/* 2D CANVAS SCENE */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair block"
        />

        {/* FULL-SCREEN BRANCHING SKILL & PRESTIGE TREE VIEW */}
        {sceneMode === 'skill_tree' && (
          <SkillTreeView
            funds={saveData.credits}
            prestigePoints={saveData.prestigePoints}
            lifetimeCredits={saveData.lifetimeCredits}
            prestigeCount={saveData.stats.prestigeCount}
            cashSkillLevels={saveData.skillLevels}
            prestigeTreeLevels={saveData.prestigeTreeLevels}
            prestigeBarProgress={saveData.prestigeBarProgress || 0}
            prestigeBarMax={saveData.prestigeBarMax || 60}
            initialTab={treeInitialTab}
            onBuyCashSkill={handleBuyCashSkill}
            onBuyPrestigeSkill={handleBuyPrestigeSkill}
            onResetCashSkills={handleResetCashSkills}
            onResetPrestigePoints={handleResetPrestigePoints}
            onPrestigeShift={() => setShowPrestigeModal(true)}
            onStartShift={() => {
              const piggyLvl =
                (saveData.prestigeTreeLevels?.['piggy_bank'] || saveData.skillLevels['piggy_bank']) || 0;
              simRef.current.shiftBonusTimer = piggyLvl * 20;
              setSceneMode('gameplay');
            }}
          />
        )}
      </div>

      {/* MR. BUCK PHONE HOTLINE OVERLAY */}
      <PhoneDialogueModal
        isOpen={showPhoneModal}
        activeMilestone={activeMilestone}
        allMilestones={MR_BUCK_MILESTONES}
        seenIds={saveData.seenPhoneCalls || []}
        onClose={handleClosePhoneModal}
        onSelectMilestone={(m) => setActiveMilestone(m)}
      />

      {/* PRESTIGE MODAL */}
      <PrestigeModal
        isOpen={showPrestigeModal}
        lifetimeCredits={saveData.lifetimeCredits}
        currentGearTokens={saveData.prestigePoints}
        prestigeCount={saveData.stats.prestigeCount}
        onClose={() => setShowPrestigeModal(false)}
        onConfirmPrestige={handleConfirmPrestige}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={showSettings}
        settings={saveData.settings}
        onClose={() => setShowSettings(false)}
        onUpdateSettings={(newSettings) => {
          setSaveData((prev: SaveData) => {
            const next = {
              ...prev,
              settings: { ...prev.settings, ...newSettings },
            };
            saveDataRef.current = next;
            saveGameData(next);
            return next;
          });
        }}
        onHardReset={handleHardReset}
      />

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* OFFLINE EARNINGS MODAL */}
      <OfflineEarningsModal
        isOpen={showOfflineModal}
        offlineCredits={offlineReport.credits}
        offlineSeconds={offlineReport.seconds}
        onClaim={() => setShowOfflineModal(false)}
      />

      {/* STATS MODAL */}
      <StatsModal
        isOpen={showStats}
        stats={saveData.stats}
        currentCredits={saveData.credits}
        gearTokens={saveData.prestigePoints}
        onClose={() => setShowStats(false)}
      />
    </main>
  );
}
