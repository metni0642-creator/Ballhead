/* Shared campaign data for BALLHEAD PROTOCOL */
window.BHB = window.BHB || {};

BHB.STORAGE = 'bhb_v3';

BHB.CHARS = [
  {
    id: 'pulse', name: 'Pulse',
    tag: 'Balanced protocol unit',
    trait: 'No modifiers — standard kit',
    superName: 'Pulse Beam',
    superDesc: 'Classic horizontal energy beam',
    super: 'beam',
    head: '#ff4d6d', body: '#6f89c8', accent: '#4ef0ff',
    lives: 3, dmg: 1, fireRate: 8, speed: 5.6, superDmg: 3,
    dashCd: 50, moveMul: 1, bulletR: 6, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'siege', name: 'Siege',
    tag: 'Heavy ordinance skull',
    trait: '+Damage · slower fire rate',
    superName: 'Siege Mortar',
    superDesc: 'Lob a huge shell that detonates on the boss',
    super: 'mortar',
    head: '#ff9f1c', body: '#5a4a3a', accent: '#ffc857',
    lives: 3, dmg: 2, fireRate: 14, speed: 5.0, superDmg: 8,
    dashCd: 55, moveMul: 0.92, bulletR: 9, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'bastion', name: 'Bastion',
    tag: 'Fortified warframe',
    trait: '+1 life · less damage · slower',
    superName: 'Bastion Quake',
    superDesc: 'Ground shockwave that smashes forward',
    super: 'shockwave',
    head: '#7ec8ff', body: '#3d5a80', accent: '#b8d4ff',
    lives: 4, dmg: 1, fireRate: 10, speed: 4.6, superDmg: 5,
    dashCd: 60, moveMul: 0.85, bulletR: 6, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'aegis', name: 'Aegis',
    tag: 'Barrier specialist',
    trait: '2 lives · regenerating shield (7s)',
    superName: 'Aegis Bloom',
    superDesc: 'Expanding shield nova that damages & blocks',
    super: 'aegisburst',
    head: '#5dffb0', body: '#2a5a48', accent: '#a8ffe0',
    lives: 2, dmg: 1, fireRate: 8, speed: 5.4, superDmg: 4,
    dashCd: 50, moveMul: 1, bulletR: 6, shots: 1, chargeNeed: 90,
    shieldMax: 1, shieldRegen: 420, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'razor', name: 'Razor',
    tag: 'Glass assassin',
    trait: 'High damage · only 2 lives',
    superName: 'Razor Dance',
    superDesc: 'Piercing blade rush across the arena',
    super: 'blades',
    head: '#e8f0ff', body: '#2a2038', accent: '#ff4ecd',
    lives: 2, dmg: 2, fireRate: 7, speed: 5.8, superDmg: 6,
    dashCd: 45, moveMul: 1.05, bulletR: 7, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1.15, superCdMul: 1
  },
  {
    id: 'twin', name: 'Twin',
    tag: 'Dual-core shooter',
    trait: 'Double shot · each hit weaker',
    superName: 'Twin Helix',
    superDesc: 'Two spiraling beams that braid into the boss',
    super: 'twinbeam',
    head: '#c14fe0', body: '#4a3060', accent: '#ff9aef',
    lives: 3, dmg: 1, fireRate: 9, speed: 5.5, superDmg: 3,
    dashCd: 50, moveMul: 1, bulletR: 5, shots: 2, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'wisp', name: 'Wisp',
    tag: 'Speed phantom',
    trait: 'Faster move/dash · weaker shots',
    superName: 'Wisp Blink',
    superDesc: 'Teleport strike — blink forward and slash',
    super: 'blinkstrike',
    head: '#4ef0ff', body: '#1a3048', accent: '#9ef7ff',
    lives: 3, dmg: 1, fireRate: 7, speed: 6.8, superDmg: 5,
    dashCd: 32, moveMul: 1.2, bulletR: 5, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'leech', name: 'Leech',
    tag: 'Vampiric core',
    trait: 'Boss-hit heal chance · 2 lives',
    superName: 'Blood Drain',
    superDesc: 'Drain beam that damages and can restore a life',
    super: 'drain',
    head: '#b5203f', body: '#3a1020', accent: '#ff6b8a',
    lives: 2, dmg: 1, fireRate: 8, speed: 5.5, superDmg: 4,
    dashCd: 50, moveMul: 1, bulletR: 6, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0.12, vuln: 1, superCdMul: 1
  },
  {
    id: 'overload', name: 'Overload',
    tag: 'Unstable reactor',
    trait: 'Slightly faster arm · take more damage',
    superName: 'Core Meltdown',
    superDesc: 'Detonate a massive explosion around you',
    super: 'meltdown',
    head: '#ffc857', body: '#5a3010', accent: '#ff6b3d',
    lives: 3, dmg: 1, fireRate: 8, speed: 5.5, superDmg: 7,
    dashCd: 50, moveMul: 1, bulletR: 6, shots: 1, chargeNeed: 75,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1.35, superCdMul: 1
  },
  {
    id: 'anchor', name: 'Anchor',
    tag: 'Siege battery',
    trait: 'Stronger SUPER · slower movement',
    superName: 'Gravity Pillar',
    superDesc: 'Drop a crushing energy pillar on the boss',
    super: 'pillar',
    head: '#9aa4ff', body: '#2a2a50', accent: '#ff4ecd',
    lives: 3, dmg: 1, fireRate: 9, speed: 4.4, superDmg: 9,
    dashCd: 65, moveMul: 0.8, bulletR: 6, shots: 1, chargeNeed: 100,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  },
  {
    id: 'spark', name: 'Spark',
    tag: 'Rapid needle',
    trait: 'Very fast fire · tiny damage',
    superName: 'Needle Storm',
    superDesc: 'Rain of piercing needles from the sky',
    super: 'storm',
    head: '#ffe66d', body: '#3a4a20', accent: '#d4ff4e',
    lives: 3, dmg: 1, fireRate: 4, speed: 5.7, superDmg: 2,
    dashCd: 48, moveMul: 1, bulletR: 4, shots: 1, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1,
    dmgChance: 0.55
  },
  {
    id: 'nova', name: 'Nova',
    tag: 'Burst specialist',
    trait: '3-spread shot · slow recharge',
    superName: 'Star Nova',
    superDesc: 'Radial star burst that scours the field',
    super: 'starburst',
    head: '#ff4ecd', body: '#401030', accent: '#ffc857',
    lives: 3, dmg: 1, fireRate: 16, speed: 5.3, superDmg: 4,
    dashCd: 52, moveMul: 0.95, bulletR: 5, shots: 3, chargeNeed: 90,
    shieldMax: 0, shieldRegen: 0, lifesteal: 0, vuln: 1, superCdMul: 1
  }
];

BHB.WORLDS = [
  { id: 'verdant', name: 'Verdant Ruin', blurb: 'Overgrown titans', glow: '#5dffb0', arena: 'garden' },
  { id: 'magma', name: 'Magma Depths', blurb: 'Molten emperors', glow: '#ff6b3d', arena: 'volcano' },
  { id: 'neon', name: 'Neon Spire', blurb: 'Electric constructs', glow: '#4ef0ff', arena: 'neon' },
  { id: 'tide', name: 'Black Tide', blurb: 'Abyssal hymns', glow: '#7a5cff', arena: 'abyss' },
  { id: 'solar', name: 'Solar Crypt', blurb: 'Celestial tyrants', glow: '#ffc857', arena: 'eclipse' },
  { id: 'glacial', name: 'Glacial Tomb', blurb: 'Frozen horrors', glow: '#a8e0ff', arena: 'ice' },
  { id: 'iron', name: 'Iron Nest', blurb: 'War-machine gods', glow: '#c0c8d8', arena: 'mech' },
  { id: 'void', name: 'Void Crown', blurb: 'End of protocols', glow: '#ff4ecd', arena: 'void' }
];

// 4 bosses per world = 32. High HP; early fights are easy via softer attacks, not low HP.
BHB.BOSSES = [
  // Verdant — gentle attack kits
  { world: 0, name: 'Thornbloom', title: 'Garden Titan', kind: 'plant', hp: 140, color: '#5dffb0', accent: '#b5203f', patterns: ['arc', 'minions'], p2: ['spread', 'arc'] },
  { world: 0, name: 'Spore Regent', title: 'Pollen Sovereign', kind: 'plant', hp: 155, color: '#9dff6a', accent: '#6a2040', patterns: ['arc', 'spread', 'minions'], p2: ['homing', 'wave'] },
  { world: 0, name: 'Rootwrath', title: 'Burrowing King', kind: 'plant', hp: 170, color: '#3d8b5a', accent: '#c9a227', patterns: ['sweep', 'homing'], p2: ['laser', 'sweep'] },
  { world: 0, name: 'Bloomfall', title: 'Petal Executioner', kind: 'plant', hp: 185, color: '#ff6b8a', accent: '#2f6b3a', patterns: ['spread', 'minions', 'homing'], p2: ['laser', 'homing'] },
  // Magma — still readable
  { world: 1, name: 'Cinder Maw', title: 'Volcanic Emperor', kind: 'magma', hp: 200, color: '#ff6b3d', accent: '#ffc857', patterns: ['arc', 'wave'], p2: ['meteor', 'wave'] },
  { world: 1, name: 'Ashcoil', title: 'Ember Serpent', kind: 'magma', hp: 215, color: '#ff4d1a', accent: '#ffe0a0', patterns: ['homing', 'arc', 'sweep'], p2: ['meteor', 'laser'] },
  { world: 1, name: 'Basalt Choir', title: 'Stone Furnace', kind: 'magma', hp: 230, color: '#d43a10', accent: '#ff9f1c', patterns: ['wave', 'spread', 'minions'], p2: ['meteor', 'wave', 'rain'] },
  { world: 1, name: 'Pyre Titan', title: 'Living Eruption', kind: 'magma', hp: 250, color: '#ffc857', accent: '#8a1010', patterns: ['arc', 'homing', 'wave'], p2: ['meteor', 'laser', 'sweep'] },
  // Neon
  { world: 2, name: 'Volt Mirage', title: 'Neon Storm', kind: 'volt', hp: 265, color: '#4ef0ff', accent: '#7a5cff', patterns: ['orb', 'zigzag', 'homing'], p2: ['bolt', 'orb', 'rain'] },
  { world: 2, name: 'Gridlock', title: 'Circuit Warden', kind: 'volt', hp: 280, color: '#7d9bff', accent: '#ff4ecd', patterns: ['bolt', 'spread', 'minions'], p2: ['bolt', 'laser', 'corner_pin'] },
  { world: 2, name: 'Static Queen', title: 'Pulse Matriarch', kind: 'volt', hp: 295, color: '#9ef7ff', accent: '#ff6b3d', patterns: ['zigzag', 'homing', 'orb'], p2: ['bolt', 'rain', 'sweep'] },
  { world: 2, name: 'Arc God', title: 'Living Dynamo', kind: 'volt', hp: 315, color: '#4ef0ff', accent: '#ffffff', patterns: ['orb', 'corner_pin', 'spread'], p2: ['bolt', 'laser', 'meteor'] },
  // Tide
  { world: 3, name: 'Abyssal Choir', title: 'Deep Hymn', kind: 'abyss', hp: 300, color: '#7a5cff', accent: '#5dffb0', patterns: ['ink', 'sweep', 'minions'], p2: ['mines', 'sweep', 'corner_pin'] },
  { world: 3, name: 'Kelpmire', title: 'Drowned Prophet', kind: 'abyss', hp: 320, color: '#3a8a9a', accent: '#b8ffe0', patterns: ['homing', 'ink', 'wave'], p2: ['mines', 'laser', 'rain'] },
  { world: 3, name: 'Riptide Idol', title: 'Pressure Crown', kind: 'abyss', hp: 340, color: '#5dffb0', accent: '#2a1a60', patterns: ['sweep', 'spread', 'corner_pin'], p2: ['mines', 'homing', 'sweep'] },
  { world: 3, name: 'Leviathan Mask', title: 'Trench God', kind: 'abyss', hp: 360, color: '#4060ff', accent: '#ff4ecd', patterns: ['ink', 'homing', 'minions'], p2: ['mines', 'laser', 'meteor'] },
  // Solar
  { world: 4, name: 'Eclipse Sovereign', title: 'Celestial Tyrant', kind: 'eclipse', hp: 350, color: '#ff4ecd', accent: '#ffc857', patterns: ['shard', 'homing', 'corner_pin'], p2: ['laser', 'shard', 'rain'] },
  { world: 4, name: 'Helio Wraith', title: 'Solar Ghost', kind: 'eclipse', hp: 370, color: '#ffc857', accent: '#ff4ecd', patterns: ['shard', 'spread', 'orb'], p2: ['laser', 'meteor', 'corner_pin'] },
  { world: 4, name: 'Moonlit Judge', title: 'Orbit Executioner', kind: 'eclipse', hp: 390, color: '#e0b0ff', accent: '#4ef0ff', patterns: ['homing', 'bolt', 'minions'], p2: ['laser', 'shard', 'sweep'] },
  { world: 4, name: 'Starfall Regent', title: 'Skybreaker', kind: 'eclipse', hp: 415, color: '#ff4ecd', accent: '#ffffff', patterns: ['shard', 'corner_pin', 'rain'], p2: ['meteor', 'laser', 'homing'] },
  // Glacial
  { world: 5, name: 'Rime Colossus', title: 'Frozen Colossus', kind: 'ice', hp: 400, color: '#a8e0ff', accent: '#4ef0ff', patterns: ['arc', 'wave', 'corner_pin'], p2: ['rain', 'mines', 'laser'] },
  { world: 5, name: 'Shardwitch', title: 'Crystal Crone', kind: 'ice', hp: 425, color: '#d0f0ff', accent: '#7a5cff', patterns: ['spread', 'homing', 'shard'], p2: ['rain', 'bolt', 'corner_pin'] },
  { world: 5, name: 'Permafrost', title: 'Stillness King', kind: 'ice', hp: 450, color: '#80c8ff', accent: '#ffffff', patterns: ['wave', 'sweep', 'minions'], p2: ['mines', 'laser', 'meteor'] },
  { world: 5, name: 'Glacier Maw', title: 'Iceberg Tyrant', kind: 'ice', hp: 480, color: '#e8f6ff', accent: '#ff4ecd', patterns: ['homing', 'arc', 'corner_pin'], p2: ['rain', 'sweep', 'laser'] },
  // Iron
  { world: 6, name: 'Gearfather', title: 'Clockwork God', kind: 'mech', hp: 460, color: '#c0c8d8', accent: '#ff9f1c', patterns: ['orb', 'barrel', 'corner_pin'], p2: ['laser', 'barrel', 'meteor'] },
  { world: 6, name: 'Siege Scarab', title: 'Iron Beetle', kind: 'mech', hp: 490, color: '#8a9098', accent: '#4ef0ff', patterns: ['wave', 'homing', 'minions'], p2: ['bolt', 'barrel', 'rain'] },
  { world: 6, name: 'Rail Hydra', title: 'Multi-Cannon', kind: 'mech', hp: 520, color: '#d8dde8', accent: '#ff4d6d', patterns: ['spread', 'orb', 'sweep'], p2: ['laser', 'meteor', 'corner_pin'] },
  { world: 6, name: 'Foundry Prime', title: 'Factory Heart', kind: 'mech', hp: 560, color: '#ff9f1c', accent: '#2a2a30', patterns: ['barrel', 'corner_pin', 'homing'], p2: ['laser', 'meteor', 'mines'] },
  // Void — peak
  { world: 7, name: 'Null Herald', title: 'First Silence', kind: 'void', hp: 540, color: '#ff4ecd', accent: '#4ef0ff', patterns: ['homing', 'shard', 'corner_pin'], p2: ['laser', 'rain', 'orb'] },
  { world: 7, name: 'Entropy Twin', title: 'Split Protocol', kind: 'void', hp: 580, color: '#7a5cff', accent: '#ffc857', patterns: ['spread', 'zigzag', 'minions'], p2: ['bolt', 'mines', 'meteor'] },
  { world: 7, name: 'Cataclysm', title: 'World Ender', kind: 'void', hp: 640, color: '#ff6b3d', accent: '#ff4ecd', patterns: ['meteor', 'sweep', 'corner_pin'], p2: ['laser', 'meteor', 'rain'] },
  { world: 7, name: 'Final Protocol', title: 'The Last Boss', kind: 'void', hp: 720, color: '#ffffff', accent: '#ff4ecd', patterns: ['homing', 'spread', 'corner_pin'], p2: ['laser', 'meteor', 'mines', 'bolt'] }
];

BHB.bossIndex = (world, boss) => world * 4 + boss;
BHB.getBoss = (world, boss) => BHB.BOSSES[BHB.bossIndex(world, boss)];
BHB.getChar = id => BHB.CHARS.find(c => c.id === id) || BHB.CHARS[0];

function _round(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Classic dartboard target */
BHB.drawDartTarget = function (ctx, cx, cy, R, hitFlash) {
  ctx.save();
  // stand / shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + R + 14, R * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // wire stem
  ctx.strokeStyle = '#6a7280';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + R - 4);
  ctx.lineTo(cx, cy + R + 18);
  ctx.stroke();

  const rings = [
    { r: 1.00, color: '#1a1a1a' },
    { r: 0.82, color: '#e8e8e8' },
    { r: 0.64, color: '#1a1a1a' },
    { r: 0.46, color: '#e8e8e8' },
    { r: 0.28, color: '#c62828' },
    { r: 0.12, color: '#ffd54f' }
  ];
  rings.forEach(ring => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * ring.r, 0, Math.PI * 2);
    ctx.fillStyle = ring.color;
    ctx.fill();
  });
  // radial wires
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  // outer rim
  ctx.strokeStyle = '#8a9098';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  // bullseye gleam
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, R * 0.05, 0, Math.PI * 2);
  ctx.fill();

  if (hitFlash > 0) {
    ctx.globalAlpha = Math.min(1, hitFlash);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,80,0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/** Draw operator preview on a 2D canvas context */
BHB.drawCharPreview = function (ctx, c, cx, cy, t) {
  const bob = Math.sin(t * 0.08) * 4;
  const y = cy + bob;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 58, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.body;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  const leg = Math.sin(t * 0.2) * 5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, y + 28); ctx.lineTo(cx - 12 - leg, y + 52);
  ctx.moveTo(cx + 10, y + 28); ctx.lineTo(cx + 12 + leg, y + 52);
  ctx.stroke();
  const bg = ctx.createLinearGradient(cx - 22, y - 20, cx + 22, y + 30);
  bg.addColorStop(0, '#e8f0ff');
  bg.addColorStop(0.45, c.body);
  bg.addColorStop(1, '#121820');
  _round(ctx, cx - 20, y - 18, 40, 48, 10);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, y + 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = c.accent; ctx.fill();
  ctx.strokeStyle = c.body; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(cx + 8, y); ctx.lineTo(cx + 34, y + 4); ctx.stroke();
  _round(ctx, cx + 28, y - 6, 26, 16, 5);
  ctx.fillStyle = c.accent; ctx.fill();
  const hg = ctx.createRadialGradient(cx - 8, y - 48, 4, cx, y - 40, 26);
  hg.addColorStop(0, '#fff');
  hg.addColorStop(0.4, c.head);
  hg.addColorStop(1, '#1a0810');
  ctx.beginPath(); ctx.arc(cx, y - 40, 26, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();
  _round(ctx, cx - 14, y - 46, 28, 12, 5);
  ctx.fillStyle = '#0a1428'; ctx.fill();
  const vg = ctx.createLinearGradient(cx - 12, y - 44, cx + 12, y - 36);
  vg.addColorStop(0, c.accent); vg.addColorStop(1, c.head);
  _round(ctx, cx - 12, y - 44, 24, 8, 4);
  ctx.fillStyle = vg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 8, y - 50, 7, 4, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
  ctx.restore();
};

/**
 * Animate unique super demo from shooter (sx,sy) toward target (tx,ty).
 * Returns hitFlash intensity 0..1 when the target is struck this frame.
 * `phase` is 0..1 looping cycle progress.
 */
BHB.drawSuperPreview = function (ctx, c, sx, sy, tx, ty, phase) {
  const type = c.super || 'beam';
  let hit = 0;
  ctx.save();

  // Charge wind-up 0–0.22, fire 0.22–0.78, settle 0.78–1
  if (phase < 0.22) {
    const p = phase / 0.22;
    ctx.globalAlpha = 0.35 + p * 0.5;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx + 20, sy, 12 + p * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // label
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 11px Exo 2,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHARGING…', sx, sy - 70);
  } else {
    const fire = Math.min(1, (phase - 0.22) / 0.56);
    const impactAt = 0.55;
    if (fire >= impactAt) hit = Math.max(0, 1 - (fire - impactAt) / 0.35);

    if (type === 'beam') {
      const len = (tx - sx) * Math.min(1, fire / impactAt);
      const g = ctx.createLinearGradient(sx, sy, sx + len, ty);
      g.addColorStop(0, c.head);
      g.addColorStop(0.5, c.accent);
      g.addColorStop(1, '#fff');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(sx + 20, sy - 10, len - 20, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(sx + 20, sy - 3, len - 20, 6);
    } else if (type === 'mortar') {
      const p = Math.min(1, fire / impactAt);
      const mx = sx + (tx - sx) * p;
      const my = sy + (ty - sy) * p - Math.sin(p * Math.PI) * 70;
      if (p < 1) {
        ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2);
        ctx.fillStyle = c.head; ctx.fill();
        ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.globalAlpha = hit;
        ctx.beginPath(); ctx.arc(tx, ty, 40 + (1 - hit) * 20, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 4; ctx.stroke();
      }
    } else if (type === 'shockwave') {
      const p = Math.min(1, fire / impactAt);
      const wx = sx + (tx - sx) * p;
      _round(ctx, wx - 28, ty + 30, 56, 22, 8);
      ctx.fillStyle = c.accent; ctx.fill();
      if (p >= 1) hit = Math.max(hit, 0.8);
    } else if (type === 'aegisburst') {
      const r = 20 + fire * 90;
      ctx.strokeStyle = c.accent; ctx.lineWidth = 4;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      if (r > Math.hypot(tx - sx, ty - sy) - 20) hit = 0.9;
    } else if (type === 'blades') {
      const p = Math.min(1, fire / impactAt);
      const bx = sx + (tx - sx) * p;
      for (let k = 0; k < 4; k++) {
        ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - 20 - k * 10, sy - 16);
        ctx.lineTo(bx - k * 10, sy + 16);
        ctx.stroke();
      }
    } else if (type === 'twinbeam') {
      const len = (tx - sx) * Math.min(1, fire / impactAt);
      for (const off of [-14, 14]) {
        ctx.strokeStyle = off < 0 ? c.head : c.accent;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(sx + 20, sy + off);
        ctx.quadraticCurveTo(sx + len * 0.5, sy + off + Math.sin(fire * 8) * 16, sx + len, ty);
        ctx.stroke();
      }
    } else if (type === 'blinkstrike') {
      const p = Math.min(1, fire / impactAt);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (tx - sx) * p, sy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      BHB.drawCharPreview(ctx, c, sx + (tx - sx) * p - 30, sy + 20, 0);
      ctx.globalAlpha = 1;
      if (p >= 1) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx - 20, ty - 20); ctx.lineTo(tx + 20, ty + 20);
        ctx.moveTo(tx + 20, ty - 20); ctx.lineTo(tx - 20, ty + 20);
        ctx.stroke();
      }
    } else if (type === 'drain') {
      const pulse = 0.5 + 0.5 * Math.sin(fire * 20);
      ctx.strokeStyle = c.head; ctx.lineWidth = 6 + pulse * 3;
      ctx.shadowColor = c.head; ctx.shadowBlur = 12;
      const len = Math.min(1, fire / impactAt);
      ctx.beginPath();
      ctx.moveTo(sx + 24, sy);
      ctx.lineTo(sx + (tx - sx) * len, ty);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // droplets back
      if (len > 0.4) {
        ctx.fillStyle = c.head;
        for (let i = 0; i < 4; i++) {
          const u = 0.3 + i * 0.15;
          const dx = sx + (tx - sx) * (len * (1 - u * 0.5));
          const dy = sy + (ty - sy) * (len * (1 - u * 0.5));
          ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (type === 'meltdown') {
      const r = 24 + fire * 100;
      const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, r);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, c.accent);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      if (r > Math.hypot(tx - sx, ty - sy)) hit = 1;
    } else if (type === 'pillar') {
      const p = Math.min(1, fire / 0.4);
      ctx.globalAlpha = 0.85;
      const g = ctx.createLinearGradient(tx - 28, 0, tx + 28, 0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.5, c.accent);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(tx - 30, ty - 80 * p, 60, 160 * p);
      if (p > 0.7) hit = 1;
    } else if (type === 'storm') {
      for (let i = 0; i < 10; i++) {
        const seed = i * 17.3;
        const nx = tx - 50 + ((seed * 13) % 100);
        const fall = ((fire * 1.4 + i * 0.08) % 1);
        const ny = (ty - 90) + fall * 120;
        ctx.fillStyle = c.accent;
        ctx.fillRect(nx, ny, 3, 14);
        if (fall > 0.7 && Math.abs(nx - tx) < 40) hit = Math.max(hit, 0.7);
      }
    } else if (type === 'starburst') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const dist = fire * 120;
        const x = sx + Math.cos(a) * dist;
        const y = sy + Math.sin(a) * dist;
        ctx.fillStyle = i % 2 ? c.accent : c.head;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const sa = -Math.PI / 2 + k * Math.PI * 2 / 5;
          const rr = k % 2 === 0 ? 7 : 3;
          const px = x + Math.cos(sa) * rr, py = y + Math.sin(sa) * rr;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        if (Math.hypot(x - tx, y - ty) < 36) hit = 1;
      }
    } else {
      // fallback beam
      const len = (tx - sx) * Math.min(1, fire / impactAt);
      ctx.fillStyle = c.accent;
      ctx.fillRect(sx + 20, sy - 8, len - 20, 16);
    }

    if (phase > 0.22 && phase < 0.35) {
      ctx.fillStyle = c.accent;
      ctx.font = '800 12px Orbitron,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c.superName.toUpperCase(), sx - 10, sy - 72);
    }
  }

  ctx.restore();
  return hit;
};
