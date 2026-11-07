import {
  Note,
  NoteType,
  Particle,
  FloatingText,
  UpgradeItem,
  GameStats,
  PrestigeOrb,
  ShardProjectile,
  StockCertificate,
} from '../types/game';
import { soundService } from '../services/audio';
import { hapticsService } from '../services/haptics';

export interface SimulationState {
  notes: Note[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; color: string; life: number }>;
  lightningArcs: Array<{ x1: number; y1: number; x2: number; y2: number; life: number }>;
  prestigeOrbs: PrestigeOrb[];
  shardProjectiles: ShardProjectile[];
  stockCertificates: StockCertificate[];
  wasteBinCount: number;
  maxBinCapacity: number;
  // Frenzy Combo System (Stages 1 to 5)
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  frenzyStage: 1 | 2 | 3 | 4 | 5;
  frenzyHitsInStage: number;
  frenzyMultiplier: number;
  // Dispensers & Auto-Swiper
  dispenserCooldownTimer: number;
  autoDispenseTimer: number;
  autoSwiperTimer: number;
  autoSwiperAngle: number;
  dispenserPulse: number;
  dispenserDisplayText: string;
  dispenserTextTimer: number;
  cardSwipeProgress: number; // 0 to 1
  isCardSwiping: boolean;
  // Stocks update timer
  stockTickerTimer: number;
  // Frame Deltas
  creditsEarnedThisTick: number;
  ppGainedThisTick: number;
  prestigeProgressThisTick: number;
  totalNotesShreddedThisTick: number;
  shredSoundTickTimer: number;
  shiftBonusTimer: number; // Piggy bank active multiplier
}

export function createInitialSimulation(): SimulationState {
  return {
    notes: [],
    particles: [],
    floatingTexts: [],
    shockwaves: [],
    lightningArcs: [],
    prestigeOrbs: [],
    shardProjectiles: [],
    stockCertificates: [
      {
        id: 'bitcorn',
        name: 'Bitcorn Core',
        ticker: 'BTCN',
        currentPrice: 1250,
        basePrice: 1250,
        history: [1100, 1180, 1250],
        ownedShares: 0,
        x: 1045,
        y: 280,
        w: 80,
        h: 52,
      },
      {
        id: 'tulip',
        name: "Grandma's Tulip Fund",
        ticker: 'TLIP',
        currentPrice: 180,
        basePrice: 180,
        history: [150, 165, 180],
        ownedShares: 0,
        x: 1135,
        y: 280,
        w: 80,
        h: 52,
      },
    ],
    wasteBinCount: 0,
    maxBinCapacity: 60,
    comboCount: 0,
    comboMultiplier: 1.0,
    comboTimer: 0,
    frenzyStage: 1,
    frenzyHitsInStage: 0,
    frenzyMultiplier: 1.0,
    dispenserCooldownTimer: 0,
    autoDispenseTimer: 0,
    autoSwiperTimer: 0,
    autoSwiperAngle: 0,
    dispenserPulse: 0,
    dispenserDisplayText: '$60',
    dispenserTextTimer: 0,
    cardSwipeProgress: 0,
    isCardSwiping: false,
    stockTickerTimer: 0,
    creditsEarnedThisTick: 0,
    ppGainedThisTick: 0,
    prestigeProgressThisTick: 0,
    totalNotesShreddedThisTick: 0,
    shredSoundTickTimer: 0,
    shiftBonusTimer: 0,
  };
}

export interface SimulationConfig {
  deskBounds: { left: number; top: number; right: number; bottom: number };
  binPos: { x: number; y: number };
  dispenserPos: { x: number; y: number };
  upgrades: Record<string, number>;
  skills: Record<string, number>;
  prestigeSkills?: Record<string, number>;
  upgradeDefs: UpgradeItem[];
  reducedEffects: boolean;
  reducedMotion: boolean;
}

export function updateSimulation(
  sim: SimulationState,
  dt: number,
  config: SimulationConfig,
  breakerInput: { x: number; y: number; active: boolean; radius: number },
  stats: GameStats
): { creditsDelta: number; ppDelta: number; prestigeProgressDelta: number } {
  sim.creditsEarnedThisTick = 0;
  sim.ppGainedThisTick = 0;
  sim.prestigeProgressThisTick = 0;
  sim.totalNotesShreddedThisTick = 0;

  const pSkills = config.prestigeSkills || {};

  // Retrieve calculated stats from Upgrades & Skills
  const damageUpgrade = getUpgradeVal('damage', config.upgrades, config.upgradeDefs, 100);
  const honeBonus = 1 + (config.skills['skill_blade_hone'] || 0) * 0.3;
  const speedUpgrade = getUpgradeVal('speed', config.upgrades, config.upgradeDefs, 1.0);
  const highTorqueBonus = ((pSkills['battery_speed'] || config.skills['battery_speed']) || 0) * 0.25;
  const breakerDPS = damageUpgrade * honeBonus * (speedUpgrade + highTorqueBonus);

  const critChance =
    getUpgradeVal('crit_chance', config.upgrades, config.upgradeDefs, 0) +
    ((pSkills['breaker_ring'] || config.skills['breaker_ring']) || 0) * 0.1;
  const critMultiplier = getUpgradeVal('crit_damage', config.upgrades, config.upgradeDefs, 2.0);

  const valUpgrade = getUpgradeVal('bill_value', config.upgrades, config.upgradeDefs, 1.0);
  const bill1Bonus = ((pSkills['bill_1'] || config.skills['bill_1']) || 0) * 0.2;
  const totalValMult = (valUpgrade + bill1Bonus) * (sim.shiftBonusTimer > 0 ? 3.0 : 1.0);

  const autoDPS = getUpgradeVal('automation', config.upgrades, config.upgradeDefs, 0);

  // 1. Shift bonus countdown (Piggy Bank meta-talent)
  if (sim.shiftBonusTimer > 0) {
    sim.shiftBonusTimer = Math.max(0, sim.shiftBonusTimer - dt);
  }

  // 2. Dispenser cooldown & visual pulse
  if (sim.dispenserCooldownTimer > 0) {
    sim.dispenserCooldownTimer = Math.max(0, sim.dispenserCooldownTimer - dt);
  }
  if (sim.dispenserPulse > 0) {
    sim.dispenserPulse = Math.max(0, sim.dispenserPulse - dt * 3.5);
  }
  if (sim.dispenserTextTimer > 0) {
    sim.dispenserTextTimer -= dt;
    if (sim.dispenserTextTimer <= 0) {
      sim.dispenserDisplayText = '$60';
    }
  }

  // 3. Auto Swiper Battery Module Logic (Unlocked in Permanent Prestige Tree)
  const autoSwiperUnlocked = (pSkills['vip_card'] || 0) > 0 || (pSkills['phone_contract'] || 0) > 0 || autoDPS > 0;
  if (autoSwiperUnlocked) {
    const swipeInterval = Math.max(0.4, 1.8 - (config.upgrades['dispense_rate'] || 0) * 0.05);
    sim.autoSwiperTimer += dt;
    sim.autoSwiperAngle = Math.sin(sim.autoSwiperTimer * 6) * 15;

    if (sim.autoSwiperTimer >= swipeInterval && sim.notes.length < 55) {
      sim.autoSwiperTimer = 0;
      dispenseNotes(sim, config, 1);
    }
  }

  // 4. Stock Market Random Walk Fluctuation (Bitcorn & Grandma's Tulip Fund)
  sim.stockTickerTimer += dt;
  if (sim.stockTickerTimer >= 2.0) {
    sim.stockTickerTimer = 0;
    sim.stockCertificates.forEach((stock) => {
      // Bitcorn is volatile (-18% to +24%), Tulip is stable (-5% to +8%)
      const volatility = stock.id === 'bitcorn' ? 0.22 : 0.07;
      const changePercent = (Math.random() - 0.46) * volatility;
      stock.currentPrice = Math.max(10, Math.round(stock.currentPrice * (1 + changePercent)));
      stock.history.push(stock.currentPrice);
      if (stock.history.length > 20) stock.history.shift();
    });
  }

  // 5. Frenzy Combo Decay (2.5s grace period)
  if (sim.comboTimer > 0) {
    sim.comboTimer = Math.max(0, sim.comboTimer - dt);
    if (sim.comboTimer <= 0) {
      sim.comboCount = 0;
      sim.frenzyStage = 1;
      sim.frenzyHitsInStage = 0;
      sim.frenzyMultiplier = 1.0;
      sim.comboMultiplier = 1.0;
    }
  }

  // 6. Update Banknotes on Desk & Physics Interactions
  const { left, top, right, bottom } = config.deskBounds;
  const noteCount = sim.notes.length;

  // 6.1 Soft collision, stacking & Golden 5-second contact conversion
  for (let i = 0; i < noteCount; i++) {
    const n1 = sim.notes[i];
    if (n1.isDestroyed) continue;

    for (let j = i + 1; j < noteCount; j++) {
      const n2 = sim.notes[j];
      if (n2.isDestroyed) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = (n1.width + n2.width) * 0.36;

      if (dist > 0.001 && dist < minDist) {
        const overlap = (minDist - dist) * 0.24;
        const nx = dx / dist;
        const ny = dy / dist;

        n1.x -= nx * overlap;
        n1.y -= ny * overlap;
        n2.x += nx * overlap;
        n2.y += ny * overlap;

        n1.vx -= nx * 14;
        n1.vy -= ny * 14;
        n2.vx += nx * 14;
        n2.vy += ny * 14;

        // Golden Bill Contact Timer (5.0s conversion rule from master prompt!)
        if (n1.type === 'golden' && n2.type === 'standard') {
          n2.contactTimer = (n2.contactTimer || 0) + dt;
          if (n2.contactTimer >= 5.0) {
            n2.type = 'golden';
            n2.baseValue *= 2;
            soundService.playGoldenChime();
            sim.floatingTexts.push({
              id: `gold_conv_${Date.now()}`,
              x: n2.x,
              y: n2.y - 10,
              text: 'GOLDEN TOUCH!',
              color: '#fbbf24',
              life: 1.0,
              maxLife: 1.0,
              scale: 1.1,
              vy: -30,
            });
          }
        } else if (n2.type === 'golden' && n1.type === 'standard') {
          n1.contactTimer = (n1.contactTimer || 0) + dt;
          if (n1.contactTimer >= 5.0) {
            n1.type = 'golden';
            n1.baseValue *= 2;
            soundService.playGoldenChime();
          }
        }

        // Burning spread to touching notes
        if (n1.isBurning && !n2.isBurning) {
          n2.isBurning = true;
          n2.burnTimer = 0;
        } else if (n2.isBurning && !n1.isBurning) {
          n1.isBurning = true;
          n1.burnTimer = 0;
        }
      }
    }
  }

  // 6.2 Gravity Well (Purple Collector Bills absorb surrounding notes & compound interest)
  for (const n of sim.notes) {
    if (n.isDestroyed) continue;

    if (n.type === 'collector') {
      const vacuumRadius = 140;
      for (const other of sim.notes) {
        if (other.isDestroyed || other.id === n.id) continue;
        const dist = Math.hypot(other.x - n.x, other.y - n.y);
        if (dist < vacuumRadius && dist > 5) {
          // Pull inward
          const pull = (1 - dist / vacuumRadius) * 160;
          other.vx += ((n.x - other.x) / dist) * pull * dt * 60;
          other.vy += ((n.y - other.y) / dist) * pull * dt * 60;

          // Absorb into collector if touching
          if (dist < 25) {
            other.isDestroyed = true;
            n.absorbedHp = (n.absorbedHp || 0) + other.health;
            n.health += other.health * 0.7;
            n.maxHealth += other.health * 0.7;
            const interest = 1.35; // +35% Interest Bearing
            n.absorbedValue = ((n.absorbedValue || n.baseValue) + other.baseValue) * interest;
            n.scale = Math.min(1.4, n.scale + 0.05);

            // Purple intake particle
            sim.particles.push({
              id: Math.random(),
              x: other.x,
              y: other.y,
              vx: (n.x - other.x) * 4,
              vy: (n.y - other.y) * 4,
              color: '#c084fc',
              size: 4,
              life: 0.3,
              maxLife: 0.3,
              rotation: 0,
              vRot: 2,
              shape: 'spark',
            });
          }
        }
      }
    }

    // Burning Damage-over-Time
    if (n.isBurning) {
      n.burnTimer = (n.burnTimer || 0) + dt;
      if (n.burnTimer >= 0.25) {
        n.burnTimer = 0;
        n.health -= 25;
        n.tearProgress = Math.min(1, 1 - n.health / n.maxHealth);

        // Keep combo alive during burning
        sim.comboTimer = 2.5;

        // Flame particles
        if (!config.reducedEffects) {
          sim.particles.push({
            id: Math.random(),
            x: n.x + (Math.random() - 0.5) * 20,
            y: n.y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 20,
            vy: -40 - Math.random() * 30,
            color: '#f97316',
            size: 4 + Math.random() * 4,
            life: 0.4,
            maxLife: 0.4,
            rotation: 0,
            vRot: 4,
            shape: 'flame',
          });
        }

        if (n.health <= 0) {
          destroyNote(sim, n, config, stats, totalValMult, critChance, critMultiplier);
        }
      }
    }

    // Velocity integration & exponential table friction (damping)
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.angle += n.vAngle * dt;

    const damping = 3.5;
    n.vx *= Math.exp(-damping * dt);
    n.vy *= Math.exp(-damping * dt);
    n.vAngle *= Math.exp(-damping * dt);

    const halfW = n.width / 2;
    const halfH = n.height / 2;

    if (n.x - halfW < left) {
      n.x = left + halfW;
      n.vx = Math.abs(n.vx) * 0.4;
    } else if (n.x + halfW > right) {
      n.x = right - halfW;
      n.vx = -Math.abs(n.vx) * 0.4;
    }

    if (n.y - halfH < top) {
      n.y = top + halfH;
      n.vy = Math.abs(n.vy) * 0.4;
    } else if (n.y + halfH > bottom) {
      n.y = bottom - halfH;
      n.vy = -Math.abs(n.vy) * 0.4;
    }

    n.isShredding = false;
  }

  // 7. Shard Projectiles Ballistics (from Shattered Diamonds)
  for (let i = sim.shardProjectiles.length - 1; i >= 0; i--) {
    const shard = sim.shardProjectiles[i];
    shard.life -= dt;
    if (shard.life <= 0) {
      sim.shardProjectiles.splice(i, 1);
      continue;
    }

    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;

    // Check intersection with bills
    for (const note of sim.notes) {
      if (note.isDestroyed) continue;
      const d = Math.hypot(note.x - shard.x, note.y - shard.y);
      if (d < Math.max(note.width, note.height) * 0.45) {
        note.health -= shard.damage;
        note.tearProgress = Math.min(1, 1 - note.health / note.maxHealth);

        // Spawn slice sparkle
        sim.particles.push({
          id: Math.random(),
          x: shard.x,
          y: shard.y,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          color: '#38bdf8',
          size: 3,
          life: 0.25,
          maxLife: 0.25,
          rotation: 0,
          vRot: 5,
          shape: 'spark',
        });

        if (note.health <= 0) {
          destroyNote(sim, note, config, stats, totalValMult, critChance, critMultiplier);
        }
      }
    }
  }

  // 8. Breaker Shredder Interaction
  let isActivelyShredding = false;

  if (breakerInput.active) {
    const radius = breakerInput.radius;
    const shredDmg = breakerDPS * dt;

    for (const note of sim.notes) {
      if (note.isDestroyed) continue;

      const dist = Math.hypot(note.x - breakerInput.x, note.y - breakerInput.y);
      const noteRadius = Math.max(note.width, note.height) * 0.48;

      if (dist < radius + noteRadius) {
        note.isShredding = true;
        isActivelyShredding = true;
        note.health -= shredDmg;
        note.tearProgress = Math.min(1, 1 - note.health / note.maxHealth);

        // Advance Frenzy Hits
        registerFrenzyHit(sim, stats);

        // Radial outward push + tangential saw grinding spin
        const angle = Math.atan2(note.y - breakerInput.y, note.x - breakerInput.x);
        const normalX = Math.cos(angle);
        const normalY = Math.sin(angle);
        const tangentX = -normalY;
        const tangentY = normalX;

        note.vx += normalX * 130 * dt * 60;
        note.vy += normalY * 130 * dt * 60;
        note.vx += tangentX * 110 * dt * 60;
        note.vy += tangentY * 110 * dt * 60;
        note.vAngle += 12.0 * dt * 60;

        // Fountain stream of paper strips arching towards the lower-right waste bin
        if (!config.reducedEffects) {
          spawnPaperShredParticle(
            sim,
            note.x + (Math.random() - 0.5) * 16,
            note.y + (Math.random() - 0.5) * 16,
            note.type,
            config.binPos
          );
        }

        if (note.health <= 0) {
          destroyNote(sim, note, config, stats, totalValMult, critChance, critMultiplier);
        }
      }
    }
  }

  // Audio loop handling
  if (isActivelyShredding) {
    soundService.startShredLoop();
    sim.shredSoundTickTimer += dt;
    if (sim.shredSoundTickTimer > 0.12) {
      sim.shredSoundTickTimer = 0;
      hapticsService.light();
    }
  } else {
    soundService.stopShredLoop();
    sim.shredSoundTickTimer = 0;
  }

  // 9. Update Flying Prestige Orbs (Stream to Top-Left CRT Monitor)
  const monitorPos = { x: 98, y: 76 };
  for (let i = sim.prestigeOrbs.length - 1; i >= 0; i--) {
    const orb = sim.prestigeOrbs[i];
    orb.progress += dt * orb.speed;

    if (orb.progress >= 1.0) {
      sim.ppGainedThisTick += 1;
      sim.prestigeOrbs.splice(i, 1);
      soundService.playCoinSound();
      continue;
    }

    // Bezier arc toward the monitor
    const midX = (orb.x + monitorPos.x) / 2 - 60;
    const midY = Math.min(orb.y, monitorPos.y) - 80;
    const t = orb.progress;
    orb.targetX = (1 - t) * (1 - t) * orb.x + 2 * (1 - t) * t * midX + t * t * monitorPos.x;
    orb.targetY = (1 - t) * (1 - t) * orb.y + 2 * (1 - t) * t * midY + t * t * monitorPos.y;
  }

  // 10. Update Particles (Parabolic Arc Stream into the Waste Bin)
  const maxParticles = config.reducedEffects ? 60 : 220;
  for (let i = sim.particles.length - 1; i >= 0; i--) {
    const p = sim.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      if (p.targetBin) {
        sim.wasteBinCount = Math.min(sim.maxBinCapacity, sim.wasteBinCount + 0.25);
      }
      sim.particles.splice(i, 1);
      continue;
    }

    if (p.targetBin && p.targetBinX !== undefined && p.targetBinY !== undefined) {
      const dx = p.targetBinX - p.x;
      const dy = p.targetBinY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 26) {
        sim.wasteBinCount = Math.min(sim.maxBinCapacity, sim.wasteBinCount + 0.35);
        sim.particles.splice(i, 1);
        continue;
      } else {
        const pull = Math.min(18, 550 / Math.max(50, dist));
        p.vx += (dx * pull - p.vx * 2.2) * dt;
        p.vy += (dy * pull + 320 - p.vy * 2.2) * dt;
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.vRot * dt;

    if (p.shape === 'strip') {
      p.widthRatio = Math.cos(p.rotation * 3.5);
    }
  }
  if (sim.particles.length > maxParticles) {
    sim.particles.splice(0, sim.particles.length - maxParticles);
  }

  // 11. Update Shockwaves & Lightning Arcs
  for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
    const sw = sim.shockwaves[i];
    sw.life -= dt * 2.5;
    sw.radius += (sw.maxRadius - sw.radius) * dt * 10;
    if (sw.life <= 0 || sw.radius >= sw.maxRadius) {
      sim.shockwaves.splice(i, 1);
    }
  }

  for (let i = sim.lightningArcs.length - 1; i >= 0; i--) {
    const arc = sim.lightningArcs[i];
    arc.life -= dt * 5.0;
    if (arc.life <= 0) {
      sim.lightningArcs.splice(i, 1);
    }
  }

  // 12. Update Floating Texts
  for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
    const ft = sim.floatingTexts[i];
    ft.life -= dt;
    if (ft.life <= 0) {
      sim.floatingTexts.splice(i, 1);
      continue;
    }
    ft.y += ft.vy * dt;
    ft.scale = Math.min(1.2, ft.scale + dt * 0.4);
  }

  // Filter destroyed notes
  sim.notes = sim.notes.filter((n) => !n.isDestroyed);

  return {
    creditsDelta: sim.creditsEarnedThisTick,
    ppDelta: sim.ppGainedThisTick,
    prestigeProgressDelta: sim.prestigeProgressThisTick,
  };
}

/**
 * Register breaker hits for the 5-Stage Frenzy Combo System
 */
function registerFrenzyHit(sim: SimulationState, stats: GameStats) {
  sim.comboCount++;
  sim.comboTimer = 2.5; // 2.5s grace period

  sim.frenzyHitsInStage++;
  if (sim.frenzyHitsInStage >= 6) {
    sim.frenzyHitsInStage = 0;
    if (sim.frenzyStage < 5) {
      sim.frenzyStage = (sim.frenzyStage + 1) as 1 | 2 | 3 | 4 | 5;
      if (sim.frenzyStage > stats.highestFrenzyStage) {
        stats.highestFrenzyStage = sim.frenzyStage;
      }
      soundService.playCashChime(sim.frenzyStage * 2);
    }

    // 8% chance to gain instant Prestige Points (PP) on completing 6 consecutive hits!
    if (Math.random() < 0.08) {
      sim.ppGainedThisTick += 1;
      soundService.playCoinSound();
      sim.floatingTexts.push({
        id: `frenzy_pp_${Date.now()}`,
        x: 640,
        y: 320,
        text: '+1 PP FRENZY BONUS!',
        color: '#fbbf24',
        life: 1.2,
        maxLife: 1.2,
        scale: 1.3,
        vy: -40,
      });
    }
  }

  // Multiplier scales +50% per stage: Stage 1 = 1.5x, 2 = 2.0x, 3 = 2.5x, 4 = 3.0x, 5 = 5.0x
  const frenzyMultipliers = [1.0, 1.5, 2.0, 2.5, 3.0, 5.0];
  sim.frenzyMultiplier = frenzyMultipliers[sim.frenzyStage];
  sim.comboMultiplier = sim.frenzyMultiplier;

  if (sim.comboCount > stats.highestCombo) {
    stats.highestCombo = sim.comboCount;
  }
}

/**
 * Destroy Note, calculate rewards, and trigger chain reactions
 */
function destroyNote(
  sim: SimulationState,
  note: Note,
  config: SimulationConfig,
  stats: GameStats,
  valMult: number,
  critChance: number,
  critMultiplier: number
) {
  if (note.isDestroyed) return;
  note.isDestroyed = true;

  // Base reward calculation with Frenzy multiplier
  let reward = (note.absorbedValue || note.baseValue) * valMult * sim.frenzyMultiplier;

  // Bundle multiplier
  if (note.isBundle) {
    reward *= note.bundleCount || 4;
  }

  // Critical hit check
  const isCrit = Math.random() < critChance;
  if (isCrit) {
    reward *= critMultiplier;
  }

  // Desk coin medallion bonus
  const deskCenterX = (config.deskBounds.left + config.deskBounds.right) / 2;
  const deskCenterY = (config.deskBounds.top + config.deskBounds.bottom) / 2;
  const distFromCenter = Math.hypot(note.x - deskCenterX, note.y - deskCenterY);
  if (distFromCenter < 90 && (config.skills['coin_stars'] || 0) > 0) {
    reward *= 1 + (config.skills['coin_stars'] || 0) * 0.25;
  }

  const roundedReward = Math.round(reward);
  sim.creditsEarnedThisTick += roundedReward;
  sim.totalNotesShreddedThisTick++;
  stats.totalNotesShredded++;
  stats.totalCreditsEarned += roundedReward;
  stats.notesByType[note.type] = (stats.notesByType[note.type] || 0) + 1;

  // Calculate Prestige Progress towards the next PP!
  let progressGained = 4;
  if (note.denomination === 5) progressGained = 8;
  else if (note.denomination === 10) progressGained = 15;
  else if (note.denomination === 20) progressGained = 28;
  else if (note.denomination === 100) progressGained = 60;

  if (note.type === 'golden') progressGained *= 2;
  else if (note.type === 'diamond') progressGained *= 2.5;
  else if (note.type === 'prestige_coin') progressGained = 60;
  else if (note.type === 'reinforced') progressGained *= 1.5;

  if (note.isBundle) progressGained *= 1.5;
  sim.prestigeProgressThisTick += Math.round(progressGained);

  // Sound & Haptics
  if (note.type === 'golden') {
    soundService.playGoldenChime();
    hapticsService.heavy();
  } else if (note.type === 'diamond') {
    soundService.playDiamondShatter();
    hapticsService.heavy();
  } else if (note.type === 'prestige_coin') {
    soundService.playCoinSound();
    hapticsService.heavy();
  } else if (note.type === 'reinforced') {
    soundService.playHeavyClank();
    hapticsService.medium();
  } else {
    soundService.playCashChime(sim.comboCount);
    hapticsService.light();
  }

  // Emit glowing Prestige Orbs streaming toward top HUD monitor
  if (Math.random() < 0.22 || note.type === 'prestige_coin' || note.type === 'golden') {
    sim.prestigeOrbs.push({
      id: Math.random(),
      x: note.x,
      y: note.y,
      targetX: note.x,
      targetY: note.y,
      progress: 0,
      speed: 1.2 + Math.random() * 0.6,
      color: note.type === 'golden' ? '#fbbf24' : '#38bdf8',
    });
  }

  // Confetti explosion arching into the waste bin
  spawnConfettiTowardsBin(sim, note.x, note.y, note.type, config.binPos, config.reducedEffects);

  // Floating text feedback
  const label = isCrit
    ? `+$${formatCompactNumber(roundedReward)} CRIT!`
    : note.type === 'prestige_coin'
    ? '+2 PP COIN!'
    : `+$${formatCompactNumber(roundedReward)}`;
  const color = isCrit
    ? '#f97316'
    : note.type === 'golden'
    ? '#fbbf24'
    : note.type === 'diamond'
    ? '#38bdf8'
    : '#4ade80';

  sim.floatingTexts.push({
    id: `${Date.now()}_${Math.random()}`,
    x: note.x,
    y: note.y - 12,
    text: label,
    color,
    life: 0.85,
    maxLife: 0.85,
    scale: isCrit ? 1.15 : 0.95,
    vy: -40,
  });

  // =========================================================================
  // MASTER CHAIN REACTION DISPATCHER
  // =========================================================================

  // 1. Electric Bills (Arc Chaining)
  if (note.type === 'spark') {
    soundService.playSpark();
    const arcRadius = 160;
    const sparkDmg = 220;

    // Query M nearest bills (4 to 9 bills)
    const targets = sim.notes
      .filter((other) => !other.isDestroyed && other.id !== note.id)
      .map((other) => ({ note: other, dist: Math.hypot(other.x - note.x, other.y - note.y) }))
      .filter((t) => t.dist <= arcRadius)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 7);

    for (const target of targets) {
      target.note.health -= sparkDmg;
      target.note.tearProgress = Math.min(1, 1 - target.note.health / target.note.maxHealth);

      sim.lightningArcs.push({
        x1: note.x,
        y1: note.y,
        x2: target.note.x,
        y2: target.note.y,
        life: 0.28,
      });

      if (target.note.health <= 0 && !target.note.isDestroyed) {
        destroyNote(sim, target.note, config, stats, valMult, critChance, critMultiplier);
      }
    }
  }

  // 2. Explosive Bills (Concussive Radial Blast & Sympathetic Explosions)
  else if (note.type === 'burst') {
    soundService.playExplosion();
    hapticsService.explosion();

    const blastRadius = 90;
    const blastDmg = 320;

    sim.shockwaves.push({
      x: note.x,
      y: note.y,
      radius: 12,
      maxRadius: blastRadius,
      color: '#f97316',
      life: 1.0,
    });

    for (const other of sim.notes) {
      if (other.isDestroyed || other.id === note.id) continue;
      const d = Math.hypot(other.x - note.x, other.y - note.y);
      if (d <= blastRadius) {
        other.health -= blastDmg;
        other.tearProgress = Math.min(1, 1 - other.health / other.maxHealth);

        const angle = Math.atan2(other.y - note.y, other.x - note.x);
        other.vx += Math.cos(angle) * 160;
        other.vy += Math.sin(angle) * 160;

        if (other.health <= 0 && !other.isDestroyed) {
          destroyNote(sim, other, config, stats, valMult, critChance, critMultiplier);
        }
      }
    }
  }

  // 3. Golden Bills Shockwave (Converts nearby bills to Golden!)
  else if (note.type === 'golden') {
    const shockwaveR = 75;
    sim.shockwaves.push({
      x: note.x,
      y: note.y,
      radius: 10,
      maxRadius: shockwaveR,
      color: '#fbbf24',
      life: 0.8,
    });

    for (const other of sim.notes) {
      if (other.isDestroyed || other.id === note.id) continue;
      const d = Math.hypot(other.x - note.x, other.y - note.y);
      if (d <= shockwaveR && other.type === 'standard') {
        other.type = 'golden';
        other.baseValue *= 2;
      }
    }
  }

  // 4. Diamonds & Shard Ballistics (Piercing Projectiles)
  else if (note.type === 'diamond') {
    const numShards = 8;
    for (let s = 0; s < numShards; s++) {
      const angle = (s * 2 * Math.PI) / numShards + (Math.random() - 0.5) * 0.3;
      const speed = 360 + Math.random() * 80;
      sim.shardProjectiles.push({
        id: Math.random(),
        x: note.x,
        y: note.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7,
        maxLife: 0.7,
        damage: 180,
        angle,
      });
    }
  }

  // 5. Prestige Coin (Direct PP Catalyst)
  else if (note.type === 'prestige_coin') {
    sim.ppGainedThisTick += 2;
  }
}

/**
 * Dispense Banknotes from ATM Slot
 */
export function dispenseNotes(
  sim: SimulationState,
  config: SimulationConfig,
  count: number = 1
): boolean {
  if (sim.notes.length >= 60) {
    sim.dispenserDisplayText = 'FULL';
    sim.dispenserTextTimer = 0.8;
    return false;
  }

  const { dispenserPos, deskBounds } = config;
  const bundleUpgradeVal = getUpgradeVal('bundled_bills', config.upgrades, config.upgradeDefs, 0);
  const specialProb = getUpgradeVal('special_bills', config.upgrades, config.upgradeDefs, 0);

  const pSkills = config.prestigeSkills || {};

  // Amount stat from Withdrawal panel + VIP bonuses
  const amountUpgrade = getUpgradeVal('amount', config.upgrades, config.upgradeDefs, 1);
  const vipBonus =
    ((pSkills['vip_card'] || config.skills['vip_card']) || 0) * 2 +
    (config.skills['skill_card_feeder'] || 0) * 2;
  const toSpawn = Math.min(amountUpgrade + vipBonus, 60 - sim.notes.length);

  const has100 = (config.skills['skill_bill_100'] || pSkills['bill_100'] || config.skills['bill_100']);
  const has20 = (config.skills['skill_bill_20'] || pSkills['bill_20'] || config.skills['bill_20']);
  const has10 = (config.skills['skill_bill_10'] || pSkills['bill_10'] || config.skills['bill_10']);
  const has5 = (config.skills['skill_bill_5'] || 0) > 0;

  for (let i = 0; i < toSpawn; i++) {
    const startX = dispenserPos.x + 40;
    const startY = dispenserPos.y + 15;

    let denom = 1;
    let baseVal = 1;
    let hp = 100;

    if (has100) {
      const r = Math.random();
      if (r < 0.16) { denom = 100; baseVal = 100; hp = 180; }
      else if (r < 0.38) { denom = 20; baseVal = 20; hp = 140; }
      else if (r < 0.65) { denom = 10; baseVal = 10; hp = 120; }
      else if (r < 0.85 && has5) { denom = 5; baseVal = 5; hp = 110; }
    } else if (has20) {
      const r = Math.random();
      if (r < 0.3) { denom = 20; baseVal = 20; hp = 140; }
      else if (r < 0.6) { denom = 10; baseVal = 10; hp = 120; }
      else if (r < 0.82 && has5) { denom = 5; baseVal = 5; hp = 110; }
    } else if (has10) {
      const r = Math.random();
      if (r < 0.4) { denom = 10; baseVal = 10; hp = 120; }
      else if (r < 0.75 && has5) { denom = 5; baseVal = 5; hp = 110; }
    } else if (has5) {
      const r = Math.random();
      if (r < 0.45) { denom = 5; baseVal = 5; hp = 110; }
    }

    // Determine Note Type
    let noteType: NoteType = 'standard';
    const rollSpecial = Math.random();
    const goldFreqBonus =
      ((pSkills['golden_bullion_tree'] || config.skills['golden_bullion_tree']) || 0) * 0.05 +
      (config.skills['skill_golden_glaze'] || 0) * 0.04;

    if (rollSpecial < 0.035) {
      noteType = 'prestige_coin';
      baseVal = 50;
      hp = 140;
    } else if (rollSpecial < 0.07) {
      noteType = 'diamond';
      baseVal = 80;
      hp = 160;
    } else if (rollSpecial < 0.11) {
      noteType = 'collector';
      baseVal = 60;
      hp = 220;
    } else if (rollSpecial < 0.16) {
      noteType = 'burning';
      baseVal = 25;
      hp = 120;
    } else if (specialProb > 0) {
      if (rollSpecial < 0.20 + goldFreqBonus) {
        noteType = 'golden';
        const goldGlazeBonus = 1 + (config.skills['skill_golden_glaze'] || 0) * 1.5;
        baseVal *= 25 * goldGlazeBonus;
      } else if (rollSpecial < 0.28) {
        noteType = 'burst';
        baseVal *= 8;
        hp *= 1.8;
      } else if (rollSpecial < 0.38) {
        noteType = 'spark';
        baseVal *= 5;
        hp *= 1.4;
      } else if (rollSpecial < 0.48) {
        noteType = 'reinforced';
        baseVal *= 4;
        hp *= 2.5;
      }
    }

    // Check Bundle (density grouping k in {2, 4, 8, 16})
    const totalBundleChance = bundleUpgradeVal * (1 + (config.skills['skill_bundle_binder'] || 0) * 0.4);
    const isBundle = Math.random() < totalBundleChance;
    let bundleCount = 1;
    if (isBundle) {
      const rollK = Math.random();
      bundleCount = rollK < 0.5 ? 2 : rollK < 0.8 ? 4 : rollK < 0.95 ? 8 : 16;
      hp *= 1.5 + bundleCount * 0.3;
    }

    // Ejection trajectory across the table
    const targetDeskX = deskBounds.left + 80 + Math.random() * (deskBounds.right - deskBounds.left - 160);
    const targetDeskY = deskBounds.top + 50 + Math.random() * (deskBounds.bottom - deskBounds.top - 100);

    const angleToDesk = Math.atan2(targetDeskY - startY, targetDeskX - startX);
    const speed = 160 + Math.random() * 140;
    const vx = Math.cos(angleToDesk) * speed;
    const vy = Math.sin(angleToDesk) * speed;

    sim.notes.push({
      id: `note_${Date.now()}_${Math.random()}`,
      type: noteType,
      x: startX,
      y: startY,
      vx,
      vy,
      angle: (Math.random() - 0.5) * 0.6,
      vAngle: (Math.random() - 0.5) * 1.6,
      width: isBundle ? 68 : 64,
      height: isBundle ? 38 : 32,
      health: hp,
      maxHealth: hp,
      baseValue: baseVal,
      isDestroyed: false,
      flutterTime: 0,
      scale: 1.0,
      isShredding: false,
      tearProgress: 0,
      isBundle,
      bundleCount,
      denomination: denom,
    });
  }

  sim.dispenserPulse = 1.0;
  sim.dispenserDisplayText = `$${toSpawn * 10}`;
  sim.dispenserTextTimer = 0.6;
  soundService.playDispense();
  return true;
}

/**
 * Particles emitted during cutting and arching towards the lower-right waste bin
 */
function spawnPaperShredParticle(
  sim: SimulationState,
  x: number,
  y: number,
  type: NoteType,
  binPos: { x: number; y: number }
) {
  const colors: Record<NoteType, string[]> = {
    standard: ['#fef3c7', '#dcfce7', '#f1f5f9', '#bbf7d0'],
    reinforced: ['#bfdbfe', '#93c5fd', '#60a5fa'],
    spark: ['#fef08a', '#67e8f9', '#22d3ee'],
    burst: ['#fed7aa', '#f97316', '#ef4444'],
    golden: ['#fef08a', '#fde047', '#f59e0b', '#fbbf24'],
    burning: ['#f97316', '#ef4444', '#fbbf24'],
    collector: ['#c084fc', '#a855f7', '#7e22ce'],
    diamond: ['#7dd3fc', '#38bdf8', '#e0f2fe'],
    prestige_coin: ['#fbbf24', '#f59e0b', '#fef08a'],
  };

  const palette = colors[type] || colors.standard;
  const color = palette[Math.floor(Math.random() * palette.length)];

  const launchVx = 80 + Math.random() * 130;
  const launchVy = -160 - Math.random() * 140;

  sim.particles.push({
    id: Math.random(),
    x,
    y,
    vx: launchVx,
    vy: launchVy,
    color,
    size: 3.5 + Math.random() * 4,
    life: 0.85 + Math.random() * 0.4,
    maxLife: 1.25,
    rotation: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 18,
    shape: 'strip',
    targetBin: true,
    targetBinX: binPos.x,
    targetBinY: binPos.y,
  });
}

function spawnConfettiTowardsBin(
  sim: SimulationState,
  x: number,
  y: number,
  type: NoteType,
  binPos: { x: number; y: number },
  reduced: boolean
) {
  const count = reduced ? 8 : 18;
  const colors: Record<NoteType, string[]> = {
    standard: ['#fef3c7', '#dcfce7', '#f1f5f9', '#86efac'],
    reinforced: ['#bfdbfe', '#93c5fd', '#3b82f6'],
    spark: ['#fef08a', '#facc15', '#22d3ee'],
    burst: ['#fed7aa', '#fb923c', '#ef4444'],
    golden: ['#fef08a', '#fde047', '#f59e0b', '#fffbeb'],
    burning: ['#f97316', '#ef4444', '#fbbf24'],
    collector: ['#c084fc', '#a855f7', '#7e22ce'],
    diamond: ['#7dd3fc', '#38bdf8', '#e0f2fe'],
    prestige_coin: ['#fbbf24', '#f59e0b', '#fef08a'],
  };

  const palette = colors[type] || colors.standard;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;

    sim.particles.push({
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed * 0.8 + 80,
      vy: Math.sin(angle) * speed * 0.8 - 140,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 4 + Math.random() * 4,
      life: 0.85 + Math.random() * 0.45,
      maxLife: 1.3,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 16,
      shape: 'strip',
      targetBin: true,
      targetBinX: binPos.x,
      targetBinY: binPos.y,
    });
  }
}

/**
 * Empty / Compact the physical waste bin for bonus cash
 */
export function emptyWasteBin(sim: SimulationState, config: SimulationConfig): number {
  if (sim.wasteBinCount <= 0) return 0;
  const count = Math.floor(sim.wasteBinCount);
  sim.wasteBinCount = 0;

  const pSkills = config.prestigeSkills || {};
  const compactorBonus =
    1 +
    ((pSkills['waste_compactor'] || config.skills['waste_compactor']) || 0) * 0.5 +
    (config.skills['skill_pulp_grinder'] || 0) * 0.4;
  const creditsEarned = Math.round(count * 8 * compactorBonus);

  soundService.playCashChime(4);
  hapticsService.medium();

  sim.floatingTexts.push({
    id: `waste_${Date.now()}`,
    x: config.binPos.x,
    y: config.binPos.y - 40,
    text: `+$${formatCompactNumber(creditsEarned)} RECYCLED!`,
    color: '#86efac',
    life: 1.2,
    maxLife: 1.2,
    scale: 1.15,
    vy: -35,
  });

  return creditsEarned;
}

function getUpgradeVal(
  id: string,
  levels: Record<string, number>,
  defs: UpgradeItem[],
  fallback: number
): number {
  const def = defs.find((d) => d.id === id);
  if (!def) return fallback;
  const lvl = levels[id] ?? def.level;
  return def.getEffectValue(lvl);
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000_000_000_000) return `${(num / 1_000_000_000_000_000_000).toFixed(1)}Q`;
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(1)}T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return `${num.toLocaleString()}`;
}
