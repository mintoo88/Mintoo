import {
  Note,
  Particle,
  FloatingText,
  UpgradeItem,
  PrestigeOrb,
  ShardProjectile,
  StockCertificate,
} from '../types/game';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  notes: Note[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  breaker: {
    x: number;
    y: number;
    radius: number;
    active: boolean;
    rotation: number;
  };
  credits: number;
  lifetimeCredits: number;
  prestigePoints: number;
  prestigeBarProgress: number;
  prestigeBarMax: number;
  currentShiftThreshold: number;
  wasteBinCount: number;
  maxBinCapacity: number;
  dispenserPulse: number;
  dispenserDisplayText: string;
  breakerUpgrades: UpgradeItem[];
  cashUpgrades: UpgradeItem[];
  upgradeLevels: Record<string, number>;
  selectedUpgradeId: string | null;
  hoveredUpgradeId: string | null;
  shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; color: string; life: number }>;
  lightningArcs: Array<{ x1: number; y1: number; x2: number; y2: number; life: number }>;
  prestigeOrbs: PrestigeOrb[];
  shardProjectiles: ShardProjectile[];
  stockCertificates: StockCertificate[];
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  frenzyStage: 1 | 2 | 3 | 4 | 5;
  frenzyMultiplier: number;
  autoSwiperAngle: number;
  autoSwiperUnlocked: boolean;
  hasUnreadPhoneCall: boolean;
  reducedEffects: boolean;
}

// 1280x720 reference layout coordinates
export const LAYOUT = {
  // Top-Left Retro Monitor
  monitor: { x: 28, y: 16, w: 145, h: 120 },
  // Left Panel: Breaker Upgrades
  leftPanel: { x: 28, y: 148, w: 180, h: 480 },
  // Center Desk & Green Mat
  desk: { x: 220, y: 92, w: 790, h: 550 },
  mat: { x: 256, y: 130, w: 718, h: 454 },
  // Upper Center Bar (Skill Tree & Prestige buttons)
  upperBar: { x: 240, y: 18, w: 420, h: 56 },
  // Top Frenzy Combo Meter
  frenzyMeter: { x: 676, y: 18, w: 334, h: 56 },
  // Cash Dispenser on Upper-Left of Desk
  dispenser: { x: 270, y: 112, w: 125, h: 145 },
  // Right Panel: Cash / Withdrawal Upgrades
  rightPanel: { x: 1025, y: 18, w: 225, h: 295 },
  // Stock Certificates Tray (Bitcorn & Grandma's Tulip Fund)
  stockTray: { x: 1025, y: 324, w: 225, h: 110 },
  // Lower Right: Cylindrical Waste Bin
  bin: { x: 1045, y: 446, w: 185, h: 225 },
  // Lower-Left Utility Control Console (Settings, Stats, Help, Phone)
  utilityBar: { x: 28, y: 638, w: 180, h: 62 },
};

export function renderWhatTheBuckScene(rc: RenderContext) {
  const { ctx, width, height } = rc;

  // Compute uniform scale to fit 1280x720 canvas cleanly
  const scale = Math.min(width / 1280, height / 720);
  const offsetX = (width - 1280 * scale) / 2;
  const offsetY = (height - 720 * scale) / 2;

  ctx.save();
  // Clear letterbox bars
  ctx.fillStyle = '#0f0a06';
  ctx.fillRect(0, 0, width, height);

  // Translate and scale to 1280x720 landscape virtual frame
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // 1. Dark Wooden Floorboards (Full Canvas)
  renderFloorboards(ctx, 1280, 720);

  // 2. Center Wooden Desk & Ornate Green Mat
  renderDeskAndMat(ctx);

  // 3. Banknotes & Stacks on the Green Desk Mat
  renderBanknotes(ctx, rc.notes);

  // 4. Physical Cash Dispenser / POS Terminal & Auto-Swiper
  renderPosDispenser(
    ctx,
    rc.dispenserPulse,
    rc.dispenserDisplayText,
    rc.autoSwiperAngle,
    rc.autoSwiperUnlocked
  );

  // 5. Stock Certificates Tray (Bitcorn & Grandma's Tulip Fund)
  renderStockTray(ctx, rc.stockCertificates);

  // 6. Physical Cylindrical Waste Bin (Lower Right Floor)
  renderWasteBin(ctx, rc.wasteBinCount, rc.maxBinCapacity);

  // 7. Shard Projectiles & Flying Paper Particles
  renderShardProjectiles(ctx, rc.shardProjectiles);
  renderParticles(ctx, rc.particles);

  // 8. Flying Glowing Prestige Orbs
  renderPrestigeOrbs(ctx, rc.prestigeOrbs);

  // 9. Shockwaves & Lightning Arcs
  renderShockwaves(ctx, rc.shockwaves);
  if (!rc.reducedEffects) {
    renderLightningArcs(ctx, rc.lightningArcs);
  }

  // 10. Breaker Circular Shredder Tool (Follows pointer)
  if (rc.breaker.active) {
    renderBreakerTool(ctx, rc.breaker, rc.frenzyStage);
  }

  // 11. Floating Text Popups
  renderFloatingTexts(ctx, rc.floatingTexts);

  // 12. Top-Left Retro Monitor (FUNDS & PP)
  renderRetroMonitor(
    ctx,
    rc.credits,
    rc.prestigePoints,
    rc.prestigeBarProgress,
    rc.prestigeBarMax
  );

  // 13. Left Panel: Breaker Upgrades
  renderUpgradePanel(
    ctx,
    LAYOUT.leftPanel.x,
    LAYOUT.leftPanel.y,
    LAYOUT.leftPanel.w,
    LAYOUT.leftPanel.h,
    'BREAKER UPGRADES',
    rc.breakerUpgrades,
    rc.upgradeLevels,
    rc.credits,
    rc.selectedUpgradeId,
    rc.hoveredUpgradeId
  );

  // 14. Right Panel: Cash Upgrades
  renderUpgradePanel(
    ctx,
    LAYOUT.rightPanel.x,
    LAYOUT.rightPanel.y,
    LAYOUT.rightPanel.w,
    LAYOUT.rightPanel.h,
    'WITHDRAWAL UPGRADES',
    rc.cashUpgrades,
    rc.upgradeLevels,
    rc.credits,
    rc.selectedUpgradeId,
    rc.hoveredUpgradeId
  );

  // 15. Upper-Center Buttons (Skill Tree & Prestige PP)
  renderUpperCenterBar(ctx, rc.credits, rc.currentShiftThreshold);

  // 16. Top Frenzy Combo Meter (Stages 1 to 5)
  renderFrenzyMeter(ctx, rc.frenzyStage, rc.frenzyMultiplier, rc.comboTimer, rc.comboCount);

  // 17. Lower-Left Console (Settings, Stats, Guide, Phone)
  renderBottomUtilityBar(ctx, rc.hasUnreadPhoneCall);

  ctx.restore();
}

/* =========================================================================
   1. WOODEN FLOORBOARDS
   ========================================================================= */

function renderFloorboards(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const plankW = 48;
  const numPlanks = Math.ceil(w / plankW);

  for (let i = 0; i < numPlanks; i++) {
    const px = i * plankW;
    const isAlt = i % 2 === 0;

    const grad = ctx.createLinearGradient(px, 0, px + plankW, 0);
    grad.addColorStop(0, isAlt ? '#1d1510' : '#281c15');
    grad.addColorStop(0.5, isAlt ? '#221913' : '#302219');
    grad.addColorStop(1, isAlt ? '#19120d' : '#221711');
    ctx.fillStyle = grad;
    ctx.fillRect(px, 0, plankW, h);

    ctx.fillStyle = '#0c0806';
    ctx.fillRect(px + plankW - 2, 0, 2, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(px + 8, 40, 1, 140);
    ctx.fillRect(px + 24, 220, 1, 180);
    ctx.fillRect(px + 14, 460, 1, 120);
  }
}

/* =========================================================================
   2. POLISHED WOODEN DESK & ORNATE OLIVE GREEN MAT
   ========================================================================= */

function renderDeskAndMat(ctx: CanvasRenderingContext2D) {
  const { desk, mat } = LAYOUT;

  ctx.save();

  // Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(desk.x + 8, desk.y + 16, desk.w + 10, desk.h + 20, 8);
  ctx.fill();

  // Legs
  renderCarvedDeskLeg(ctx, desk.x + 24, desk.y + desk.h - 14);
  renderCarvedDeskLeg(ctx, desk.x + desk.w - 54, desk.y + desk.h - 14);

  // Outer Polished Desk Frame
  const deskGrad = ctx.createLinearGradient(desk.x, desk.y, desk.x, desk.y + desk.h);
  deskGrad.addColorStop(0, '#3f2518');
  deskGrad.addColorStop(0.04, '#5a3723');
  deskGrad.addColorStop(0.92, '#311c12');
  deskGrad.addColorStop(1, '#1e110a');
  ctx.fillStyle = deskGrad;
  ctx.beginPath();
  ctx.roundRect(desk.x, desk.y, desk.w, desk.h, 6);
  ctx.fill();
  ctx.strokeStyle = '#22130b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Drawer
  const drawerW = 200;
  const drawerH = 26;
  const drawerX = desk.x + (desk.w - drawerW) / 2;
  const drawerY = desk.y + desk.h - 32;

  ctx.fillStyle = '#22140c';
  ctx.fillRect(drawerX, drawerY, drawerW, drawerH);
  ctx.strokeStyle = '#150b07';
  ctx.lineWidth = 2;
  ctx.strokeRect(drawerX, drawerY, drawerW, drawerH);

  // Brass Handle
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.roundRect(drawerX + drawerW / 2 - 24, drawerY + 10, 48, 6, 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4 Brass Corners
  drawBrassDeskCorner(ctx, desk.x, desk.y, 0);
  drawBrassDeskCorner(ctx, desk.x + desk.w, desk.y, Math.PI / 2);
  drawBrassDeskCorner(ctx, desk.x + desk.w, desk.y + desk.h, Math.PI);
  drawBrassDeskCorner(ctx, desk.x, desk.y + desk.h, -Math.PI / 2);

  // -------------------------------------------------------------
  // OLIVE GREEN FELT DESK MAT
  // -------------------------------------------------------------
  const matGrad = ctx.createLinearGradient(mat.x, mat.y, mat.x, mat.y + mat.h);
  matGrad.addColorStop(0, '#2d4d2d');
  matGrad.addColorStop(0.5, '#386138');
  matGrad.addColorStop(1, '#274427');
  ctx.fillStyle = matGrad;
  ctx.fillRect(mat.x, mat.y, mat.w, mat.h);

  ctx.strokeStyle = '#1b301b';
  ctx.lineWidth = 3;
  ctx.strokeRect(mat.x, mat.y, mat.w, mat.h);

  // Gold Filigree Border
  ctx.strokeStyle = '#cda250';
  ctx.lineWidth = 2;
  ctx.strokeRect(mat.x + 8, mat.y + 8, mat.w - 16, mat.h - 16);

  ctx.strokeStyle = '#8d6d2a';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(mat.x + 12, mat.y + 12, mat.w - 24, mat.h - 24);
  ctx.setLineDash([]);

  // -------------------------------------------------------------
  // CENTRAL GOLD COIN MEDALLION
  // -------------------------------------------------------------
  const cx = mat.x + mat.w / 2;
  const cy = mat.y + mat.h / 2;

  const numCoins = 14;
  const ringRadius = 78;
  for (let i = 0; i < numCoins; i++) {
    const angle = (i * 2 * Math.PI) / numCoins;
    const coinX = cx + Math.cos(angle) * ringRadius;
    const coinY = cy + Math.sin(angle) * ringRadius;

    ctx.beginPath();
    ctx.arc(coinX, coinY, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#caa348';
    ctx.fill();
    ctx.strokeStyle = '#7c5f21';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#5c4516';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', coinX, coinY + 1);
  }

  // Medallion Center Seal
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.fillStyle = '#2b472b';
  ctx.fill();
  ctx.strokeStyle = '#caa348';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '700 38px "Press Start 2P", monospace';
  ctx.fillStyle = '#caa348';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#503c14';
  ctx.shadowBlur = 4;
  ctx.fillText('$', cx, cy + 3);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.restore();
}

function renderCarvedDeskLeg(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#1e110a';
  ctx.beginPath();
  ctx.roundRect(x, y, 32, 38, 4);
  ctx.fill();
  ctx.fillStyle = '#2d180e';
  ctx.fillRect(x + 4, y, 24, 34);

  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 2, y + 26, 28, 8);
}

function drawBrassDeskCorner(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(28, 0);
  ctx.lineTo(28, 10);
  ctx.lineTo(10, 10);
  ctx.lineTo(10, 28);
  ctx.lineTo(0, 28);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/* =========================================================================
   3. PHYSICAL CASH DISPENSER & AUTO-SWIPER MODULE
   ========================================================================= */

function renderPosDispenser(
  ctx: CanvasRenderingContext2D,
  pulse: number,
  screenText: string,
  swiperAngle: number,
  autoSwiperUnlocked: boolean
) {
  const { dispenser } = LAYOUT;

  ctx.save();
  ctx.translate(dispenser.x, dispenser.y);

  // Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(4, 8, dispenser.w, dispenser.h, 6);
  ctx.fill();

  // POS Terminal Body (Charcoal/Dark Slate)
  ctx.fillStyle = '#222831';
  ctx.beginPath();
  ctx.roundRect(0, 0, dispenser.w - 18, dispenser.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#393e46';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Brass side bracket
  ctx.fillStyle = '#b45309';
  ctx.fillRect(dispenser.w - 24, 6, 6, dispenser.h - 12);

  // Green LED Screen
  const screenW = dispenser.w - 36;
  const screenH = 24;
  ctx.fillStyle = '#061a0e';
  ctx.beginPath();
  ctx.roundRect(9, 10, screenW, screenH, 4);
  ctx.fill();
  ctx.strokeStyle = '#0e4424';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Screen Text
  ctx.font = '700 11px "Press Start 2P", monospace';
  ctx.fillStyle = pulse > 0 ? '#86efac' : '#4ade80';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = pulse > 0 ? 8 : 4;
  ctx.fillText(screenText, 9 + screenW / 2, 10 + screenH / 2 + 1);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Numeric Keypad
  const keyStartX = 12;
  const keyStartY = 42;
  const keyW = 16;
  const keyH = 12;
  const gapX = 4;
  const gapY = 4;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const kx = keyStartX + c * (keyW + gapX);
      const ky = keyStartY + r * (keyH + gapY);

      ctx.fillStyle = '#a89f91';
      ctx.fillRect(kx, ky, keyW, keyH);
      ctx.fillStyle = '#ded7cb';
      ctx.fillRect(kx, ky, keyW, keyH - 2);

      ctx.fillStyle = '#4a4237';
      ctx.fillRect(kx + keyW / 2 - 1, ky + keyH / 2 - 2, 2, 2);
    }
  }

  // Card Slot
  const cardSlotX = dispenser.w - 18;
  const cardSlotY = 16;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(cardSlotX, cardSlotY, 6, 80);

  // The VIP Credit Card
  const cardX = cardSlotX + 1;
  const cardY = cardSlotY + (pulse > 0 ? 12 : 4);
  const cardW = 32;
  const cardH = 50;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cardX + 2, cardY + 2, cardW, cardH);

  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, '#1e293b');
  cardGrad.addColorStop(0.5, '#4338ca');
  cardGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 3);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(cardX + 4, cardY + 8, 7, 6);

  ctx.font = '700 6px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('VIP', cardX + 4, cardY + 24);

  // Auto-Swiper Motorized Battery Arm (Renders rocking over the card if unlocked)
  if (autoSwiperUnlocked) {
    ctx.save();
    ctx.translate(cardSlotX + 18, cardSlotY - 8);
    ctx.rotate((swiperAngle * Math.PI) / 180);

    // Motor body
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-8, -8, 20, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Motor arm pushing card
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 4, 38);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(2, 38, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Output slot mouth
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(10, dispenser.h - 12, dispenser.w - 38, 5);

  ctx.restore();
}

/* =========================================================================
   4. BANKNOTES, BUNDLED BILLS & SPECIAL TYPES
   ========================================================================= */

function renderBanknotes(ctx: CanvasRenderingContext2D, notes: Note[]) {
  for (const note of notes) {
    if (note.isDestroyed) continue;

    ctx.save();
    ctx.translate(note.x, note.y);
    ctx.rotate(note.angle);

    const w = note.width;
    const h = note.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // Contact drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-halfW + 3, -halfH + 4, w, h);

    // If it's a bundle, render stacked lower paper layers
    if (note.isBundle) {
      ctx.fillStyle = '#e2d8c3';
      ctx.fillRect(-halfW - 3, -halfH - 3, w, h);
      ctx.fillStyle = '#eee5d1';
      ctx.fillRect(-halfW - 1.5, -halfH - 1.5, w, h);
    }

    // Determine Base Color based on Note Type
    let bgColor = '#fdf6e2';
    let borderColor = '#1e382b';
    let textColor = '#1e382b';

    if (note.type === 'golden') {
      bgColor = '#fde047';
      borderColor = '#b45309';
      textColor = '#78350f';
    } else if (note.type === 'diamond') {
      bgColor = '#e0f2fe';
      borderColor = '#0284c7';
      textColor = '#0369a1';
    } else if (note.type === 'prestige_coin') {
      bgColor = '#fef08a';
      borderColor = '#d97706';
      textColor = '#92400e';
    } else if (note.type === 'collector') {
      bgColor = '#f3e8ff';
      borderColor = '#9333ea';
      textColor = '#6b21a8';
    } else if (note.type === 'burning') {
      bgColor = '#ffedd5';
      borderColor = '#ea580c';
      textColor = '#9a3412';
    } else if (note.type === 'spark') {
      bgColor = '#ecfeff';
      borderColor = '#0891b2';
      textColor = '#155e75';
    } else if (note.type === 'burst') {
      bgColor = '#fee2e2';
      borderColor = '#dc2626';
      textColor = '#991b1b';
    } else if (note.type === 'reinforced') {
      bgColor = '#e2e8f0';
      borderColor = '#475569';
      textColor = '#1e293b';
    }

    // Main Banknote Body
    ctx.fillStyle = bgColor;
    ctx.fillRect(-halfW, -halfH, w, h);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfW, -halfH, w, h);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-halfW + 3, -halfH + 2, w - 6, h - 4);

    // Corner Denominations
    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${note.denomination}`, -halfW + 5, -halfH + 4);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${note.denomination}`, halfW - 5, halfH - 3);

    // Center Emblem / Seal
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Emblem Icon Text
    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.fillStyle = bgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (note.type === 'prestige_coin') {
      ctx.fillText('PP', 0, 1);
    } else if (note.type === 'diamond') {
      ctx.fillText('◆', 0, 1);
    } else if (note.type === 'collector') {
      ctx.fillText('◎', 0, 1);
    } else if (note.type === 'burning') {
      ctx.fillText('♨', 0, 1);
    } else {
      ctx.fillText(`${note.denomination}`, 0, 1);
    }

    // Bundled Bills Burgundy Band
    if (note.isBundle) {
      const bandW = 16;
      ctx.fillStyle = '#881337';
      ctx.fillRect(-bandW / 2, -halfH - 1, bandW, h + 2);
      ctx.strokeStyle = '#4c0519';
      ctx.lineWidth = 1;
      ctx.strokeRect(-bandW / 2, -halfH - 1, bandW, h + 2);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-bandW / 2 + 2, -2, bandW - 4, 4);
    }

    // Serrated Tear Damage
    if (note.health < note.maxHealth) {
      const damageRatio = 1 - note.health / note.maxHealth;
      ctx.fillStyle = '#1e382b'; // Desk mat green behind

      const cutW = w * 0.48 * damageRatio;
      ctx.beginPath();
      ctx.moveTo(-halfW + 5, -halfH);
      ctx.lineTo(-halfW + 5 + cutW, -halfH + 7);
      ctx.lineTo(-halfW + 5 + cutW + 5, -halfH - 1);
      ctx.closePath();
      ctx.fill();
    }

    // Active shredding white outline
    if (note.isShredding) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-halfW - 1, -halfH - 1, w + 2, h + 2);
    }

    ctx.restore();
  }
}

/* =========================================================================
   5. STOCK CERTIFICATES TRAY (BITCORN & GRANDMA'S TULIP FUND)
   ========================================================================= */

function renderStockTray(ctx: CanvasRenderingContext2D, stocks: StockCertificate[]) {
  const { stockTray } = LAYOUT;

  ctx.save();
  ctx.translate(stockTray.x, stockTray.y);

  // Background Tray Panel
  ctx.fillStyle = '#1a1f1b';
  ctx.fillRect(0, 0, stockTray.w, stockTray.h);
  ctx.strokeStyle = '#2d4d3c';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, stockTray.w, stockTray.h);

  // Header Title
  ctx.fillStyle = '#22382c';
  ctx.fillRect(0, 0, stockTray.w, 20);
  ctx.font = '700 7.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.fillText('FINANCIAL ASSET TRAY', stockTray.w / 2, 13);

  // Render the two stock certificate cards
  stocks.forEach((s, idx) => {
    const cardX = 8 + idx * 108;
    const cardY = 26;
    const cardW = 100;
    const cardH = 76;

    // Card background
    ctx.fillStyle = '#111815';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = s.id === 'bitcorn' ? '#f59e0b' : '#ec4899';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Ticker & Price
    ctx.font = '700 7.5px "Press Start 2P", monospace';
    ctx.fillStyle = s.id === 'bitcorn' ? '#fbbf24' : '#f472b6';
    ctx.textAlign = 'left';
    ctx.fillText(s.ticker, cardX + 6, cardY + 12);

    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'right';
    ctx.fillText(`$${s.currentPrice.toLocaleString()}`, cardX + cardW - 6, cardY + 12);

    // Sparkline Graph
    if (s.history.length > 1) {
      const minP = Math.min(...s.history);
      const maxP = Math.max(...s.history, minP + 1);
      const graphX = cardX + 6;
      const graphY = cardY + 20;
      const graphW = cardW - 12;
      const graphH = 30;

      ctx.beginPath();
      s.history.forEach((val, i) => {
        const gx = graphX + (i / (s.history.length - 1)) * graphW;
        const gy = graphY + graphH - ((val - minP) / (maxP - minP)) * graphH;
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      });
      ctx.strokeStyle = s.id === 'bitcorn' ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Bottom Action Tag
    ctx.fillStyle = '#1e2922';
    ctx.fillRect(cardX + 4, cardY + cardH - 18, cardW - 8, 14);
    ctx.font = '700 6.5px "Press Start 2P", monospace';
    ctx.fillStyle = '#86efac';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO BUY / SHRED', cardX + cardW / 2, cardY + cardH - 9);
  });

  ctx.restore();
}

/* =========================================================================
   6. PHYSICAL CYLINDRICAL WASTE BIN
   ========================================================================= */

function renderWasteBin(ctx: CanvasRenderingContext2D, binCount: number, maxCap: number) {
  const { bin } = LAYOUT;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(bin.x + bin.w / 2 + 6, bin.y + bin.h - 12, bin.w / 2, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Metallic Drum
  const drumGrad = ctx.createLinearGradient(bin.x, 0, bin.x + bin.w, 0);
  drumGrad.addColorStop(0, '#525b6a');
  drumGrad.addColorStop(0.25, '#8c98a8');
  drumGrad.addColorStop(0.65, '#525b6a');
  drumGrad.addColorStop(1, '#2c333e');

  ctx.fillStyle = drumGrad;
  ctx.beginPath();
  ctx.roundRect(bin.x, bin.y + 20, bin.w, bin.h - 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#1e2530';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Brass Ribs
  ctx.fillStyle = '#b45309';
  ctx.fillRect(bin.x, bin.y + 60, bin.w, 4);
  ctx.fillRect(bin.x, bin.y + bin.h - 40, bin.w, 4);

  // Top Rim
  ctx.beginPath();
  ctx.ellipse(bin.x + bin.w / 2, bin.y + 20, bin.w / 2, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Aperture
  ctx.beginPath();
  ctx.ellipse(bin.x + bin.w / 2, bin.y + 20, bin.w / 2 - 10, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Shredded Paper Accumulating
  const fillRatio = Math.min(1, binCount / maxCap);
  if (fillRatio > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bin.x + bin.w / 2, bin.y + 20, bin.w / 2 - 12, 10, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(bin.x, bin.y + 10, bin.w, 20);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(bin.x + 30, bin.y + 15, 12, 4);
    ctx.fillRect(bin.x + 65, bin.y + 18, 16, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bin.x + 45, bin.y + 20, 14, 3);
    ctx.restore();
  }

  ctx.font = '700 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'center';
  ctx.fillText('WASTE BIN (TAP RECYCLE)', bin.x + bin.w / 2, bin.y + bin.h - 18);

  ctx.restore();
}

/* =========================================================================
   7. BREAKER CIRCULAR SHREDDER TOOL
   ========================================================================= */

function renderBreakerTool(
  ctx: CanvasRenderingContext2D,
  breaker: { x: number; y: number; radius: number; rotation: number },
  frenzyStage: number
) {
  const { x, y, radius, rotation } = breaker;

  ctx.save();
  ctx.translate(x, y);

  // Stage 5 Overdrive Flames Aura
  if (frenzyStage === 5) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Translucent circular cutting disc
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  ctx.strokeStyle = frenzyStage >= 4 ? '#f59e0b' : '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Internal rotating cutter saw teeth
  ctx.save();
  ctx.rotate(rotation);
  const teeth = 8;
  const innerR = radius * 0.45;
  const outerR = radius * 0.85;

  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (i * 2 * Math.PI) / teeth;
    const a2 = ((i + 0.5) * 2 * Math.PI) / teeth;
    const a3 = ((i + 1) * 2 * Math.PI) / teeth;

    const x1 = Math.cos(a1) * innerR;
    const y1 = Math.sin(a1) * innerR;
    const x2 = Math.cos(a2) * outerR;
    const y2 = Math.sin(a2) * outerR;
    const x3 = Math.cos(a3) * innerR;
    const y3 = Math.sin(a3) * innerR;

    if (i === 0) ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(180, 190, 205, 0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  // Center axle brass rivet
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  ctx.restore();
}

/* =========================================================================
   8. TOP-LEFT RETRO INDUSTRIAL MONITOR (FUNDS & PP)
   ========================================================================= */

function renderRetroMonitor(
  ctx: CanvasRenderingContext2D,
  funds: number,
  pp: number,
  prestigeProgress: number,
  prestigeMax: number
) {
  const { monitor } = LAYOUT;

  ctx.save();

  // Metal Bezel Frame
  const frameGrad = ctx.createLinearGradient(monitor.x, monitor.y, monitor.x + monitor.w, monitor.y + monitor.h);
  frameGrad.addColorStop(0, '#858e9b');
  frameGrad.addColorStop(0.5, '#6b7280');
  frameGrad.addColorStop(1, '#4b5563');
  ctx.fillStyle = frameGrad;
  ctx.beginPath();
  ctx.roundRect(monitor.x, monitor.y, monitor.w, monitor.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4 Hex Bolts
  drawMonitorBolt(ctx, monitor.x + 8, monitor.y + 8);
  drawMonitorBolt(ctx, monitor.x + monitor.w - 8, monitor.y + 8);
  drawMonitorBolt(ctx, monitor.x + monitor.w - 8, monitor.y + monitor.h - 8);
  drawMonitorBolt(ctx, monitor.x + 8, monitor.y + monitor.h - 8);

  // Screen
  const screenX = monitor.x + 14;
  const screenY = monitor.y + 14;
  const screenW = monitor.w - 28;
  const screenH = monitor.h - 28;

  ctx.fillStyle = '#101712';
  ctx.beginPath();
  ctx.roundRect(screenX, screenY, screenW, screenH, 4);
  ctx.fill();
  ctx.strokeStyle = '#050a06';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let sy = screenY; sy < screenY + screenH; sy += 3) {
    ctx.fillRect(screenX, sy, screenW, 1);
  }

  // Header: FUNDS
  ctx.font = '700 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.fillText('FUNDS', screenX + screenW / 2, screenY + 16);

  // Funds Value ($1.8M)
  ctx.font = '700 13px "Press Start 2P", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 6;
  ctx.fillText(formatCompact(funds), screenX + screenW / 2, screenY + 36);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // PP Value (68 PP)
  ctx.font = '700 9px "Press Start 2P", monospace';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`${pp} PP`, screenX + screenW / 2, screenY + 54);

  // Progress Bar towards next PP
  const progW = screenW - 16;
  const progX = screenX + 8;
  const progY = screenY + screenH - 8;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(progX, progY, progW, 4);

  const fillRatio = Math.min(1, Math.max(0, prestigeProgress / (prestigeMax || 60)));
  ctx.fillStyle = '#eab308';
  ctx.fillRect(progX, progY, progW * fillRatio, 4);

  ctx.restore();
}

function drawMonitorBolt(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#374151';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#9ca3af';
  ctx.fill();
}

/* =========================================================================
   9. RECTANGULAR UPGRADE PANELS (LEFT: BREAKER, RIGHT: WITHDRAWAL)
   ========================================================================= */

function renderUpgradePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  upgrades: UpgradeItem[],
  levels: Record<string, number>,
  credits: number,
  selectedId: string | null,
  hoveredId: string | null
) {
  ctx.save();

  // Dark Panel Background
  ctx.fillStyle = '#1c221e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#0f1411';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // Header
  const headerH = 34;
  ctx.fillStyle = '#22382c';
  ctx.fillRect(x, y, w, headerH);
  ctx.strokeStyle = '#2d4d3c';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, headerH);

  ctx.font = '700 8.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + w / 2, y + headerH / 2);

  // Upgrade Rows
  const rowH = Math.floor((h - headerH) / upgrades.length);
  upgrades.forEach((u, idx) => {
    const rowY = y + headerH + idx * rowH;
    const currentLvl = levels[u.id] ?? u.level;
    const isMax = currentLvl >= u.maxLevel;
    const cost = Math.round(u.baseCost * Math.pow(u.costMultiplier, currentLvl));
    const canAfford = !isMax && credits >= cost;

    if (idx > 0) {
      ctx.fillStyle = '#274435';
      ctx.fillRect(x + 2, rowY, w - 4, 1.5);
    }

    if (canAfford) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
      ctx.fillRect(x + 2, rowY + 1, w - 4, rowH - 2);
    }

    if (hoveredId === u.id || selectedId === u.id) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.18)';
      ctx.fillRect(x + 2, rowY + 1, w - 4, rowH - 2);
    }

    // Name
    ctx.font = '700 8.5px "Press Start 2P", monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(u.name, x + 8, rowY + 7);

    // Cost
    ctx.font = '700 8px "Press Start 2P", monospace';
    ctx.fillStyle = isMax ? '#94a3b8' : canAfford ? '#4ade80' : '#f87171';
    ctx.fillText(isMax ? 'MAX' : formatCompact(cost), x + 8, rowY + 21);

    // Level
    ctx.font = '600 7px "Press Start 2P", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Lvl ${currentLvl}/${u.maxLevel}`, x + 8, rowY + 33);

    // Visible tactile [+ BUY] Button
    const btnW = 50;
    const btnH = 22;
    const btnX = x + w - btnW - 8;
    const btnY = rowY + (rowH - btnH) / 2;

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 4);
    if (isMax) {
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '700 6.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MAX', btnX + btnW / 2, btnY + btnH / 2);
    } else if (canAfford) {
      ctx.fillStyle = '#15803d';
      ctx.fill();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '700 6.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+ BUY', btnX + btnW / 2, btnY + btnH / 2);
    } else {
      ctx.fillStyle = '#1a221d';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '700 6.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BUY', btnX + btnW / 2, btnY + btnH / 2);
    }
  });

  ctx.restore();
}

/* =========================================================================
   10. UPPER-CENTER BAR (SKILL TREE & PRESTIGE BUTTONS)
   ========================================================================= */

function renderUpperCenterBar(ctx: CanvasRenderingContext2D, credits: number, currentShiftThreshold: number) {
  const { upperBar } = LAYOUT;

  ctx.save();

  ctx.fillStyle = '#1e2922';
  ctx.beginPath();
  ctx.roundRect(upperBar.x, upperBar.y, upperBar.w, upperBar.h, 6);
  ctx.fill();
  ctx.strokeStyle = '#caa348';
  ctx.lineWidth = 2;
  ctx.stroke();

  const btn1W = upperBar.w / 2 - 8;
  const btn1X = upperBar.x + 6;
  const btnY = upperBar.y + 6;
  const btnH = upperBar.h - 12;

  // Button 1: [Flask] Skill Tree
  ctx.fillStyle = '#16221b';
  ctx.beginPath();
  ctx.roundRect(btn1X, btnY, btn1W, btnH, 4);
  ctx.fill();
  ctx.strokeStyle = '#274435';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(btn1X + 16, btnY + 12);
  ctx.lineTo(btn1X + 24, btnY + 12);
  ctx.lineTo(btn1X + 28, btnY + 24);
  ctx.lineTo(btn1X + 12, btnY + 24);
  ctx.closePath();
  ctx.fill();

  ctx.font = '700 8.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Skill Tree', btn1X + 34, btnY + btnH / 2);

  // Button 2: [Tent] Prestige $X (or Prestige Ready!)
  const btn2X = upperBar.x + upperBar.w / 2 + 2;
  const canPrestige = credits >= currentShiftThreshold;
  ctx.fillStyle = canPrestige ? '#1e3a24' : '#16221b';
  ctx.beginPath();
  ctx.roundRect(btn2X, btnY, btn1W, btnH, 4);
  ctx.fill();
  ctx.strokeStyle = canPrestige ? '#4ade80' : '#274435';
  ctx.lineWidth = canPrestige ? 2 : 1.5;
  ctx.stroke();

  ctx.fillStyle = canPrestige ? '#4ade80' : '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(btn2X + 20, btnY + 10);
  ctx.lineTo(btn2X + 28, btnY + 24);
  ctx.lineTo(btn2X + 12, btnY + 24);
  ctx.closePath();
  ctx.fill();

  ctx.font = '700 8px "Press Start 2P", monospace';
  ctx.fillStyle = canPrestige ? '#4ade80' : '#fef08a';
  const label = canPrestige ? 'Prestige Ready!' : `Prestige ${formatCompact(currentShiftThreshold)}`;
  ctx.fillText(label, btn2X + 34, btnY + btnH / 2);

  ctx.restore();
}

/* =========================================================================
   11. TOP FRENZY COMBO METER (STAGES 1 TO 5)
   ========================================================================= */

function renderFrenzyMeter(
  ctx: CanvasRenderingContext2D,
  stage: 1 | 2 | 3 | 4 | 5,
  mult: number,
  timer: number,
  comboCount: number
) {
  const { frenzyMeter } = LAYOUT;

  ctx.save();
  ctx.translate(frenzyMeter.x, frenzyMeter.y);

  // Outer Frame
  ctx.fillStyle = '#1a1820';
  ctx.beginPath();
  ctx.roundRect(0, 0, frenzyMeter.w, frenzyMeter.h, 6);
  ctx.fill();
  ctx.strokeStyle = stage >= 4 ? '#f59e0b' : '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header text
  ctx.font = '700 8px "Press Start 2P", monospace';
  ctx.fillStyle = stage === 5 ? '#f97316' : '#fef08a';
  ctx.textAlign = 'left';
  ctx.fillText(stage === 5 ? 'MAX FRENZY (5x)' : `FRENZY STAGE ${stage} (${mult.toFixed(1)}x)`, 12, 18);

  ctx.font = '700 7px "Press Start 2P", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(`${comboCount} HITS`, frenzyMeter.w - 12, 18);

  // 5 Segment Bar
  const barX = 12;
  const barY = 28;
  const barW = frenzyMeter.w - 24;
  const segW = (barW - 8) / 5;
  const segH = 12;

  for (let s = 1; s <= 5; s++) {
    const sx = barX + (s - 1) * (segW + 2);
    const isLit = s <= stage;

    ctx.fillStyle = isLit
      ? s === 5
        ? '#ea580c'
        : s >= 3
        ? '#f59e0b'
        : '#4ade80'
      : '#26242e';

    ctx.beginPath();
    ctx.roundRect(sx, barY, segW, segH, 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Grace timer countdown fill line below
  if (timer > 0) {
    const timerW = (timer / 2.5) * barW;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(barX, barY + segH + 3, timerW, 3);
  }

  ctx.restore();
}

/* =========================================================================
   12. LOWER-LEFT UTILITY CONSOLE (SETTINGS, STATS, HELP, PHONE)
   ========================================================================= */

function renderBottomUtilityBar(ctx: CanvasRenderingContext2D, hasCall: boolean) {
  const { utilityBar } = LAYOUT;

  ctx.save();

  ctx.fillStyle = '#141c18';
  ctx.beginPath();
  ctx.roundRect(utilityBar.x, utilityBar.y, utilityBar.w, utilityBar.h, 6);
  ctx.fill();
  ctx.strokeStyle = '#caa348';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 4 Tactile Buttons: SET, DATA, HELP, PHONE
  const btnW = 38;
  const btnH = 46;
  const startX = utilityBar.x + 6;
  const startY = utilityBar.y + 8;
  const gap = 5;

  const buttons = [
    { label: 'SET', icon: '⚙', color: '#f59e0b' },
    { label: 'DATA', icon: '📊', color: '#38bdf8' },
    { label: 'HELP', icon: '❓', color: '#4ade80' },
    { label: 'CALL', icon: '☎', color: hasCall ? '#fbbf24' : '#cbd5e1', alert: hasCall },
  ];

  buttons.forEach((b, i) => {
    const bx = startX + i * (btnW + gap);
    ctx.fillStyle = '#1c2420';
    ctx.beginPath();
    ctx.roundRect(bx, startY, btnW, btnH, 4);
    ctx.fill();
    ctx.strokeStyle = b.alert ? '#f59e0b' : '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 12px monospace';
    ctx.fillStyle = b.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.icon, bx + btnW / 2, startY + 16);

    ctx.font = '700 6px "Press Start 2P", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(b.label, bx + btnW / 2, startY + 34);

    if (b.alert) {
      ctx.beginPath();
      ctx.arc(bx + btnW - 4, startY + 6, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  });

  ctx.restore();
}

/* =========================================================================
   13. PARTICLES, ARCS, PRESTIGE ORBS & POPUP TEXTS
   ========================================================================= */

function renderPrestigeOrbs(ctx: CanvasRenderingContext2D, orbs: PrestigeOrb[]) {
  for (const orb of orbs) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(orb.targetX, orb.targetY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = orb.color;
    ctx.shadowColor = orb.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

function renderShardProjectiles(ctx: CanvasRenderingContext2D, shards: ShardProjectile[]) {
  for (const s of shards) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(-6, -1.5, 12, 3);
    ctx.restore();
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.shape === 'strip') {
      const dynamicWidth = p.size * (p.widthRatio ?? 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-dynamicWidth / 2, -p.size / 2, dynamicWidth, p.size * 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }

    ctx.restore();
  }
}

function renderShockwaves(
  ctx: CanvasRenderingContext2D,
  shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; color: string; life: number }>
) {
  for (const sw of shockwaves) {
    const alpha = Math.max(0, sw.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderLightningArcs(
  ctx: CanvasRenderingContext2D,
  arcs: Array<{ x1: number; y1: number; x2: number; y2: number; life: number }>
) {
  for (const arc of arcs) {
    const alpha = Math.max(0, arc.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(arc.x1, arc.y1);
    ctx.lineTo((arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 16, (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 16);
    ctx.lineTo(arc.x2, arc.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (const ft of texts) {
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ft.x, ft.y);
    ctx.scale(ft.scale, ft.scale);

    ctx.font = '700 11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#050812';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, 0, 0);

    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, 0, 0);

    ctx.restore();
  }
}

function formatCompact(num: number): string {
  if (num === Infinity) return 'MAX';
  if (num >= 1_000_000_000_000_000_000) return `$${(num / 1_000_000_000_000_000_000).toFixed(1)}Q`;
  if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(1)}T`;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}
