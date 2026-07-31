(() => {
  'use strict';
  const { CHARS, WORLDS, BOSSES, STORAGE, getChar, getBoss, bossIndex } = window.BHB;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 960, H = 540;
  canvas.width = W; canvas.height = H;

  const GROUND_Y = H - 108;
  const GRAVITY = 0.78, JUMP_V = -14.2, COYOTE = 8, JUMP_BUF = 10;
  const SUPER_CD_BASE = 420; // 7s @60fps
  const SUPER_STILL = 0.45;
  const POWER_DROP = 0.07;
  const BUFF_TIME = 120;
  const RUN_KEY = 'bhb_run_v3';

  const $ = id => document.getElementById(id);
  const livesEl = $('lives'), scoreEl = $('score'), phaseEl = $('phase');
  const levelTag = $('levelTag'), bossLabel = $('bossLabel'), bossHpText = $('bossHpText');
  const bossBarFill = $('bossBarFill'), superFill = $('superFill'), superWrap = $('superWrap');
  const shieldEl = $('shieldHud');
  const overlay = $('overlay'), panelTitle = $('panelTitle'), panelSub = $('panelSub');
  const panelHint = $('panelHint'), btnPrimary = $('btnPrimary');
  const btnSecondary = $('btnSecondary'), btnTertiary = $('btnTertiary');
  const pauseBtn = $('pauseBtn'), stickZone = $('stickZone'), stickKnob = $('stickKnob');
  const superBtn = $('superBtn');

  function loadSave() {
    try {
      return Object.assign({ bestTotal: 0, unlockedWorld: 1, bestRun: 0 }, JSON.parse(localStorage.getItem(STORAGE) || '{}'));
    } catch { return { bestTotal: 0, unlockedWorld: 1, bestRun: 0 }; }
  }
  function writeSave(s) { localStorage.setItem(STORAGE, JSON.stringify(s)); }
  function loadRun() {
    try { return JSON.parse(sessionStorage.getItem(RUN_KEY) || 'null'); } catch { return null; }
  }
  function saveRun(r) { sessionStorage.setItem(RUN_KEY, JSON.stringify(r)); }

  const params = new URLSearchParams(location.search);
  let save = loadSave();
  let run = loadRun();
  const charId = params.get('char') || (run && run.char) || 'pulse';
  let char = getChar(charId);

  // Start / resume run
  if (params.get('new') === '1' || !run || run.char !== char.id) {
    const startWorld = Math.max(0, Math.min(7, (parseInt(params.get('world'), 10) || 1) - 1));
    const unlocked = save.unlockedWorld | 1;
    const w = Math.min(startWorld, unlocked - 1);
    run = {
      char: char.id, world: w, boss: 0,
      lives: char.lives, score: 0, started: true
    };
    saveRun(run);
  } else {
    char = getChar(run.char);
  }

  let worldIdx = run.world | 0;
  let bossIdx = run.boss | 0;

  const player = {
    x: 160, y: GROUND_Y, w: 36, h: 50, headR: 24,
    vx: 0, vy: 0, facing: 1, speed: 5.6,
    onGround: true, coyote: 0, jumpBuf: 0,
    cooldown: 0, hitFlash: 0, dashCd: 0, dashing: 0, invuln: 0,
    power: 0, superCd: 0, superActive: 0, stillTime: 0, armed: false,
    shield: 0, shieldCd: 0,
    buffSpeed: 0, buffDmg: 0, buffInvuln: 0, buffFire: 0
  };

  const boss = {
    x: W - 140, groundY: GROUND_Y + 28, headR: 70,
    hp: 100, maxHp: 100, attackTimer: 70, sway: 0,
    hitFlash: 0, alive: true, dying: false, deathTimer: 0,
    phase: 1, transformFlash: 0, auxTimer: 90, campTimer: 50,
    kind: 'plant', color: '#5dffb0', accent: '#b5203f', name: 'Boss',
    patterns: [], p2: []
  };

  let bullets = [], hazards = [], enemies = [], particles = [], powerups = [];
  let beams = [], supers = [], floatText = [];
  let lives = run.lives, score = run.score | 0, frame = 0;
  let running = false, paused = false, victory = false, startedOnce = false;
  let spawnTimer = 40, shake = 0, flashWhite = 0, bgStars = [], looping = false;

  const keys = Object.create(null);
  const input = { axis: 0, jump: false, jumpPressed: false, shoot: false, dash: false, dashPressed: false, superPressed: false };

  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  document.body.classList.add(coarse ? 'touch-ui' : 'desktop-ui');
  window.addEventListener('touchstart', () => {
    document.body.classList.remove('desktop-ui');
    document.body.classList.add('touch-ui');
    resizeCanvas();
  }, { once: true, passive: true });

  function resizeCanvas() {
    const stage = $('stage');
    const scale = Math.min(stage.clientWidth / W, stage.clientHeight / H);
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 80));
  resizeCanvas();

  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
    if (!keys[e.code]) {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') input.jumpPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') input.dashPressed = true;
      if (e.code === 'KeyF' || e.code === 'KeyQ') input.superPressed = true;
    }
    keys[e.code] = true;
    if ((e.code === 'Escape' || e.code === 'KeyP') && startedOnce) togglePause();
    if (e.code === 'Enter' && !running && !paused) startFight();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  let stickId = null;
  const STICK_MAX = 46;
  function setStick(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    const cl = Math.min(len, STICK_MAX);
    const nx = dx / len * cl;
    stickKnob.style.transform = `translate(${nx}px,${dy / len * cl}px)`;
    input.axis = Math.abs(nx) < 10 ? 0 : nx / STICK_MAX;
  }
  function resetStick() {
    stickId = null; stickKnob.style.transform = 'translate(0,0)'; input.axis = 0;
  }
  function touchXY(t) {
    const r = stickZone.getBoundingClientRect();
    return { dx: t.clientX - (r.left + r.width / 2), dy: t.clientY - (r.top + r.height / 2) };
  }
  stickZone.addEventListener('touchstart', e => {
    e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier;
    const p = touchXY(t); setStick(p.dx, p.dy);
  }, { passive: false });
  stickZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === stickId) { const p = touchXY(t); setStick(p.dx, p.dy); }
  }, { passive: false });
  stickZone.addEventListener('touchend', e => {
    for (const t of e.changedTouches) if (t.identifier === stickId) resetStick();
  });
  stickZone.addEventListener('touchcancel', resetStick);

  function bindHold(el, onDown, onUp) {
    if (!el) return;
    const down = ev => { ev.preventDefault(); el.classList.add('active'); onDown(); };
    const up = ev => { ev.preventDefault(); el.classList.remove('active'); onUp(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  }
  bindHold($('jumpBtn'), () => { input.jump = true; input.jumpPressed = true; }, () => { input.jump = false; });
  bindHold($('shootBtn'), () => { input.shoot = true; }, () => { input.shoot = false; });
  bindHold($('dashBtn'), () => { input.dash = true; input.dashPressed = true; }, () => { input.dash = false; });
  bindHold(superBtn, () => { input.superPressed = true; }, () => {});

  function softGlow(x, y, r, color, a = 0.35) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function burst(x, y, n, colors, spd = 5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * spd;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 16 + Math.random() * 20, r: 1.5 + Math.random() * 3,
        color: colors[(Math.random() * colors.length) | 0], glow: true
      });
    }
  }
  function float(x, y, text, color) { floatText.push({ x, y, text, color, life: 40 }); }
  function addScore(n) { score += n; scoreEl.textContent = score; persistRun(); }
  function persistRun() {
    run.lives = lives; run.score = score; run.world = worldIdx; run.boss = bossIdx; run.char = char.id;
    saveRun(run);
  }

  function powerupColor(kind) {
    if (kind === 'speed') return ['#4ef0ff', '#9ef7ff'];
    if (kind === 'damage') return ['#ff6b3d', '#ffc857'];
    if (kind === 'invuln') return ['#ffe66d', '#ffffff'];
    return ['#c14fe0', '#ff9aef']; // firerate
  }
  function applyPowerup(kind) {
    if (kind === 'speed') {
      player.buffSpeed = BUFF_TIME;
      float(player.x, player.y - 36, '+50% SPEED', '#4ef0ff');
    } else if (kind === 'damage') {
      player.buffDmg = BUFF_TIME;
      float(player.x, player.y - 36, '+50% DMG', '#ff6b3d');
    } else if (kind === 'invuln') {
      player.buffInvuln = BUFF_TIME;
      float(player.x, player.y - 36, 'INVULN', '#ffe66d');
    } else {
      player.buffFire = BUFF_TIME;
      float(player.x, player.y - 36, '+50% FIRE', '#c14fe0');
    }
  }

  function drawPowerup(p) {
    const y = p.y + Math.sin(frame * 0.15 + p.x) * 3;
    softGlow(p.x, y, 22, powerupColor(p.kind)[0], 0.5);
    ctx.save();
    ctx.translate(p.x, y);
    if (p.kind === 'speed') {
      // chevron bolt
      ctx.fillStyle = '#4ef0ff';
      ctx.beginPath();
      ctx.moveTo(-10, 8); ctx.lineTo(0, -12); ctx.lineTo(10, 8); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    } else if (p.kind === 'damage') {
      // spiked orb
      ctx.fillStyle = '#ff6b3d';
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc857';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a + 0.2) * 8, Math.sin(a + 0.2) * 8);
        ctx.fill();
      }
    } else if (p.kind === 'invuln') {
      // diamond shield
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      // triple dots firerate
      ctx.fillStyle = '#c14fe0';
      roundRectPath(-12, -12, 24, 24, 6); ctx.fill();
      ctx.fillStyle = '#ff9aef';
      ctx.beginPath();
      ctx.arc(-6, 0, 3, 0, Math.PI * 2);
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMinion(e) {
    softGlow(e.x, e.y, e.r * 2.2, '#ff4d6d', 0.25);
    // body capsule
    ctx.fillStyle = '#3a455c';
    roundRectPath(e.x - e.r, e.y - e.r * 0.7, e.r * 2, e.r * 1.5, 8);
    ctx.fill();
    ctx.strokeStyle = '#8fa0c0'; ctx.lineWidth = 2; ctx.stroke();
    // MINION label stripe
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(e.x - e.r + 2, e.y - 4, e.r * 2 - 4, 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Exo 2,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('MINION', e.x, e.y);
    // angry eyes
    ctx.fillStyle = '#ffc857';
    ctx.beginPath(); ctx.arc(e.x - 6, e.y - 10, 3, 0, Math.PI * 2); ctx.arc(e.x + 6, e.y - 10, 3, 0, Math.PI * 2); ctx.fill();
    // antenna
    ctx.strokeStyle = '#c0d0ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x, e.y - e.r * 0.7); ctx.lineTo(e.x, e.y - e.r - 8); ctx.stroke();
    ctx.fillStyle = '#4ef0ff';
    ctx.beginPath(); ctx.arc(e.x, e.y - e.r - 8, 3, 0, Math.PI * 2); ctx.fill();
  }

  function initStars() {
    bgStars = [];
    for (let i = 0; i < 90; i++) {
      bgStars.push({ x: Math.random() * W, y: Math.random() * H * 0.7, r: Math.random() * 1.8 + 0.3, s: Math.random() * 0.45 + 0.1, a: Math.random() });
    }
  }

  function applyBoss() {
    const b = getBoss(worldIdx, bossIdx);
    const w = WORLDS[worldIdx];
    const gi = worldIdx * 4 + bossIdx; // 0..31
    // Early fights gentler attack cadence; late stays mean
      const attackEase = gi < 4 ? 1.55 : gi < 8 ? 1.3 : gi < 16 ? 1.05 : 0.88;
    Object.assign(boss, {
      hp: b.hp, maxHp: b.hp, kind: b.kind, color: b.color, accent: b.accent,
      name: b.name, patterns: b.patterns.slice(), p2: b.p2.slice(),
      attackTimer: Math.floor(110 * attackEase), auxTimer: Math.floor(140 * attackEase),
      campTimer: gi < 4 ? 240 : gi < 8 ? 150 : 55,
      burst: 0, phase: 1, alive: true, dying: false, deathTimer: 0, hitFlash: 0,
      transformFlash: 0, sway: 0, x: W - 140, ease: attackEase, globalIndex: gi
    });
    bossLabel.textContent = b.name.toUpperCase();
    levelTag.textContent = `${w.name} · ${bossIdx + 1}/4`;
    phaseEl.textContent = 'Form I';
    updateBossBar();
    initStars();
  }

  function updateBossBar() {
    const pct = Math.max(0, boss.hp / boss.maxHp);
    bossBarFill.style.width = (pct * 100) + '%';
    bossHpText.textContent = Math.ceil(pct * 100) + '%';
  }

  function updateSuperHud() {
    let pct = 0;
    let label = 'SUPER';
    if (player.superCd > 0) {
      pct = (1 - player.superCd / (SUPER_CD_BASE * (char.superCdMul || 1))) * 100;
      label = 'COOLING';
      superWrap.classList.remove('ready', 'charging');
    } else if (player.armed) {
      pct = 100; label = (char.superName || 'SUPER') + ' READY';
      superWrap.classList.add('ready');
      superWrap.classList.remove('charging');
    } else {
      pct = 0;
      label = 'STAND STILL';
      superWrap.classList.remove('ready', 'charging');
    }
    superFill.style.width = pct + '%';
    $('superLabel').textContent = label;
    superBtn.classList.toggle('ready', player.armed);
    superBtn.classList.toggle('cooling', player.superCd > 0);
  }

  function updateShieldHud() {
    if (!shieldEl) return;
    if (char.shieldMax > 0) {
      shieldEl.classList.remove('hidden');
      shieldEl.textContent = player.shield > 0 ? '◈ SHIELD' : '◈ …';
      shieldEl.classList.toggle('up', player.shield > 0);
    } else shieldEl.classList.add('hidden');
  }

  function resetFightKeepRun() {
    Object.assign(player, {
      x: 160, y: GROUND_Y, vx: 0, vy: 0, facing: 1,
      speed: char.speed * char.moveMul,
      onGround: true, coyote: 0, jumpBuf: 0, cooldown: 0,
      hitFlash: 0, dashCd: 0, dashing: 0, invuln: 0, power: 0,
      superCd: 0, superActive: 0, stillTime: 0, armed: false,
      shield: char.shieldMax > 0 ? 1 : 0, shieldCd: 0,
      buffSpeed: 0, buffDmg: 0, buffInvuln: 0, buffFire: 0
    });
    bullets = []; hazards = []; enemies = []; particles = []; powerups = [];
    beams = []; supers = []; floatText = [];
    frame = 0; spawnTimer = 35; shake = 0; flashWhite = 0; victory = false; paused = false;
    applyBoss();
    livesEl.textContent = lives;
    scoreEl.textContent = score;
    updateSuperHud();
    updateShieldHud();
  }

  function showOverlay(mode) {
    overlay.classList.remove('hidden');
    btnSecondary.classList.add('hidden');
    btnTertiary.classList.add('hidden');
    panelTitle.classList.remove('win', 'lose');
    const b = getBoss(worldIdx, bossIdx);
    const w = WORLDS[worldIdx];
    const touch = document.body.classList.contains('touch-ui');

    if (mode === 'start') {
      panelTitle.textContent = b.name;
      panelSub.textContent = `${w.name} (${bossIdx + 1}/4) · ${char.name} · ${lives}♥`;
      panelHint.textContent = touch
        ? 'Stand still to ready SUPER, then tap SUPER (7s CD)'
        : 'Stand still to ready SUPER, then press F (7s CD)';
      btnPrimary.textContent = 'Fight';
      btnPrimary.onclick = startFight;
      btnSecondary.classList.remove('hidden');
      btnSecondary.textContent = 'Menu';
      btnSecondary.onclick = () => { location.href = 'index.html'; };
    } else if (mode === 'pause') {
      panelTitle.textContent = 'Paused';
      panelSub.textContent = `${char.name} · ${lives} lives left · Score ${score}`;
      panelHint.textContent = 'Lives carry across every boss in this run.';
      btnPrimary.textContent = 'Resume';
      btnPrimary.onclick = () => togglePause(false);
      btnSecondary.classList.remove('hidden');
      btnSecondary.textContent = 'Abandon Run';
      btnSecondary.onclick = () => { sessionStorage.removeItem(RUN_KEY); location.href = 'index.html'; };
    } else if (mode === 'win') {
      const lastBoss = worldIdx === 7 && bossIdx === 3;
      panelTitle.textContent = lastBoss ? 'Protocol Complete' : 'Boss Down';
      panelTitle.classList.add('win');
      panelSub.textContent = `${b.name} cleared · ${lives}♥ left · Score ${score}`;
      panelHint.textContent = 'Lives carry forward. Hearts drop rarely from minions.';
      if (lastBoss) {
        btnPrimary.textContent = 'Victory Screen';
        btnPrimary.onclick = () => { location.href = 'index.html'; };
      } else {
        btnPrimary.textContent = 'Next Boss';
        btnPrimary.onclick = () => advanceAndFight();
      }
      btnSecondary.classList.remove('hidden');
      btnSecondary.textContent = 'Menu';
      btnSecondary.onclick = () => { location.href = 'index.html'; };
    } else {
      panelTitle.textContent = 'Run Over';
      panelTitle.classList.add('lose');
      panelSub.textContent = `Score ${score} · Fell to ${b.name}`;
      panelHint.textContent = 'One life pool for the whole campaign.';
      btnPrimary.textContent = 'Retry Run';
      btnPrimary.onclick = () => {
        run = { char: char.id, world: worldIdx, boss: 0, lives: char.lives, score: 0, started: true };
        // retry from start of current world
        bossIdx = 0; lives = char.lives; score = 0;
        saveRun(run); resetFightKeepRun(); showOverlay('start');
      };
      btnSecondary.classList.remove('hidden');
      btnSecondary.textContent = 'Menu';
      btnSecondary.onclick = () => { sessionStorage.removeItem(RUN_KEY); location.href = 'index.html'; };
      btnTertiary.classList.remove('hidden');
      btnTertiary.textContent = 'Full Restart';
      btnTertiary.onclick = () => {
        run = { char: char.id, world: 0, boss: 0, lives: char.lives, score: 0, started: true };
        worldIdx = 0; bossIdx = 0; lives = char.lives; score = 0;
        saveRun(run); resetFightKeepRun(); showOverlay('start');
      };
    }
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function persistProgress() {
    save = loadSave();
    if (score > (save.bestTotal | 0)) save.bestTotal = score;
    const clearedWorld = worldIdx + (bossIdx >= 3 ? 1 : 0);
    // unlocking next world when finishing boss 4 of current
    if (bossIdx === 3) {
      const next = worldIdx + 2; // 1-based unlock
      if ((save.unlockedWorld | 1) < next) save.unlockedWorld = Math.min(8, next);
    }
    writeSave(save);
  }

  function advanceAndFight() {
    bossIdx++;
    if (bossIdx > 3) { bossIdx = 0; worldIdx++; }
    if (worldIdx > 7) { location.href = 'index.html'; return; }
    persistRun();
    resetFightKeepRun();
    showOverlay('start');
  }

  function startFight() {
    resetFightKeepRun();
    // keep run lives/score — only reset fight state
    lives = run.lives;
    score = run.score | 0;
    livesEl.textContent = lives;
    scoreEl.textContent = score;
    hideOverlay();
    running = true; startedOnce = true; victory = false;
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }

  function endFight(won) {
    running = false; victory = won;
    if (won) {
      persistProgress();
      persistRun();
    } else {
      sessionStorage.removeItem(RUN_KEY);
    }
    showOverlay(won ? 'win' : 'lose');
  }

  function togglePause(force) {
    if (!startedOnce || victory || (!running && !paused)) return;
    paused = typeof force === 'boolean' ? force : !paused;
    if (paused) { running = false; showOverlay('pause'); }
    else {
      hideOverlay(); running = true;
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    }
  }
  pauseBtn.addEventListener('click', () => {
    if (!startedOnce) return;
    if (overlay.classList.contains('hidden')) togglePause(true);
    else if (paused) togglePause(false);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) togglePause(true); });

  // ===== DRAW ARENA / BOSSES / PLAYER =====
  function drawArena() {
    const kind = boss.kind;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const skies = {
      plant: ['#0d1f18', '#1a3328', '#0a1510'],
      magma: ['#1a0a08', '#3a1208', '#120605'],
      volt: ['#050816', '#0a1530', '#04060f'],
      abyss: ['#030816', '#0a1a2e', '#021018'],
      eclipse: ['#05010c', '#1a0520', '#08020e'],
      ice: ['#0a1520', '#143048', '#071018'],
      mech: ['#101218', '#1a2030', '#0a0c10'],
      void: ['#0a0610', '#1a0820', '#050208']
    };
    const s = skies[kind] || skies.void;
    g.addColorStop(0, s[0]); g.addColorStop(0.55, s[1]); g.addColorStop(1, s[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    softGlow(W * 0.7, H * 0.25, 280, boss.color, 0.12);
    softGlow(W * 0.2, H * 0.15, 200, boss.accent, 0.08);
    bgStars.forEach(st => {
      st.x -= st.s; if (st.x < 0) st.x = W;
      ctx.globalAlpha = 0.25 + st.a * 0.5;
      ctx.fillStyle = '#dff6ff';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    const gg = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    gg.addColorStop(0, 'rgba(255,255,255,0.06)'); gg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gg; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = boss.color; ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
    ctx.shadowColor = boss.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 0.5); ctx.lineTo(W, GROUND_Y + 0.5); ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  function drawPlayer() {
    const { x, y, w, h, headR, dashing } = player;
    ctx.save();
    if ((player.hitFlash > 0 || player.invuln > 0) && (frame / 3 | 0) % 2 === 0) ctx.globalAlpha = 0.4;
    const air = GROUND_Y - y, sh = Math.max(0.35, 1 - air / 180);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, GROUND_Y + h / 2 + 10, w * 0.85 * sh, 8 * sh, 0, 0, Math.PI * 2); ctx.fill();
    if (dashing > 0) softGlow(x - 16, y, 36, char.accent, 0.4);
    if (player.shield > 0) softGlow(x, y, 50, '#5dffb0', 0.3);
    if (player.stillTime > 0 && player.superCd <= 0 && !player.armed) {
      softGlow(x, y, 40, '#ff4ecd', 0.15);
    }
    if (player.armed) softGlow(x, y, 55, '#ffc857', 0.35);

    ctx.strokeStyle = char.body; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const leg = player.onGround ? Math.sin(frame * 0.35) * Math.min(1, Math.abs(player.vx) / 4) * 6 : 0;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h / 2 - 6); ctx.lineTo(x - 10 - leg, y + h / 2 + 14);
    ctx.moveTo(x + 8, y + h / 2 - 6); ctx.lineTo(x + 10 + leg, y + h / 2 + 14);
    ctx.stroke();

    const bodyG = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    bodyG.addColorStop(0, '#e8f0ff'); bodyG.addColorStop(0.45, char.body); bodyG.addColorStop(1, '#1a2030');
    roundRectPath(x - w / 2, y - h / 2, w, h, 10);
    ctx.fillStyle = bodyG; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.stroke();
    softGlow(x, y - 4, 14, char.accent, 0.5);
    ctx.beginPath(); ctx.arc(x, y - 4, 5, 0, Math.PI * 2); ctx.fillStyle = char.accent; ctx.fill();

    const handX = x + w / 2 + 14, handY = y - 2;
    ctx.strokeStyle = char.body; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - 6); ctx.lineTo(handX - 4, handY); ctx.stroke();
    roundRectPath(handX - 10, handY - 9, 28, 18, 5);
    ctx.fillStyle = char.accent; ctx.fill();

    const headY = y - h / 2 - headR + 8;
    softGlow(x, headY, headR * 1.5, char.head, 0.35);
    const hg = ctx.createRadialGradient(x - 8, headY - 10, 4, x, headY, headR);
    hg.addColorStop(0, '#fff'); hg.addColorStop(0.35, char.head); hg.addColorStop(1, '#1a0810');
    ctx.beginPath(); ctx.arc(x, headY, headR, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
    roundRectPath(x - 14, headY - 6, 28, 12, 6);
    ctx.fillStyle = '#0a1428'; ctx.fill();
    const vg = ctx.createLinearGradient(x - 12, headY - 4, x + 12, headY + 4);
    vg.addColorStop(0, char.accent); vg.addColorStop(1, char.head);
    ctx.fillStyle = vg; ctx.globalAlpha = 0.9;
    roundRectPath(x - 12, headY - 4, 24, 8, 4); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(x - 8, headY - 10, 7, 4, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    ctx.restore();
  }

  function drawBossBody() {
    if (!boss.alive && !boss.dying) return;
    const sway = Math.sin(boss.sway) * 4;
    const bx = boss.x + sway * 0.25;
    const headY = boss.groundY - 160;
    const p2 = boss.phase === 2;
    ctx.save();
    if (boss.hitFlash > 0 && (frame / 2 | 0) % 2 === 0) ctx.globalAlpha = 0.55;
    softGlow(bx, headY, 130, boss.color, 0.25);

    if (boss.kind === 'plant') {
      ctx.fillStyle = p2 ? '#1a2e18' : '#2f6b3a';
      [-1, 1].forEach(d => { ctx.beginPath(); ctx.ellipse(boss.x + d * 34, boss.groundY - 6, 34, 16, d * 0.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = p2 ? '#4a1860' : '#1f5a28'; ctx.lineWidth = 22; ctx.lineCap = 'round';
      ctx.shadowColor = boss.color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(boss.x, boss.groundY);
      ctx.quadraticCurveTo(boss.x + sway * 2, (boss.groundY + headY) / 2, bx, headY + 50); ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = 0; i < 10; i++) {
        ctx.save(); ctx.translate(bx, headY); ctx.rotate((i / 10) * Math.PI * 2 + boss.sway * 0.2);
        ctx.beginPath(); ctx.ellipse(0, -boss.headR * 0.95, boss.headR * 0.4, boss.headR * 0.72, 0, 0, Math.PI * 2);
        ctx.fillStyle = boss.accent; ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(bx, headY, boss.headR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = boss.color; ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(bx - 16, headY, 6, 0, Math.PI * 2); ctx.arc(bx + 16, headY, 6, 0, Math.PI * 2); ctx.fill();
    } else if (boss.kind === 'magma' || boss.kind === 'ice') {
      ctx.save(); ctx.translate(bx, headY + 10);
      const sg = ctx.createRadialGradient(-20, -30, 10, 0, 0, 90);
      sg.addColorStop(0, boss.accent); sg.addColorStop(0.5, boss.color); sg.addColorStop(1, '#100408');
      ctx.beginPath(); ctx.ellipse(0, 0, 88, 70, 0, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
      softGlow(-28, -8, 22, boss.accent, 0.7); softGlow(28, -8, 22, boss.accent, 0.7);
      ctx.fillStyle = '#0a0202'; ctx.beginPath(); ctx.ellipse(-28, -8, 18, 22, 0, 0, Math.PI * 2); ctx.ellipse(28, -8, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = boss.accent; ctx.beginPath(); ctx.arc(-28, -6, 6, 0, Math.PI * 2); ctx.arc(28, -6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe6c0';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * 14 - 6, 28); ctx.lineTo(i * 14, 50); ctx.lineTo(i * 14 + 6, 28); ctx.fill();
      }
      ctx.restore();
    } else if (boss.kind === 'volt' || boss.kind === 'mech') {
      ctx.save(); ctx.translate(bx, headY); ctx.rotate(frame * 0.02);
      ctx.strokeStyle = boss.color; ctx.lineWidth = 3; ctx.shadowColor = boss.color; ctx.shadowBlur = 12;
      for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.arc(0, 0, 72, 0.2, 1.1); ctx.stroke(); }
      ctx.shadowBlur = 0; ctx.rotate(-frame * 0.02);
      ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(58, 0); ctx.lineTo(0, 78); ctx.lineTo(-58, 0); ctx.closePath();
      ctx.fillStyle = boss.color; ctx.fill();
      ctx.fillStyle = '#061018'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = boss.accent; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (boss.kind === 'abyss') {
      for (let i = 0; i < 7; i++) {
        const base = -90 + i * 30, wave = Math.sin(boss.sway * 1.5 + i * 0.7) * 28;
        ctx.strokeStyle = boss.color; ctx.lineWidth = 13; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx + base * 0.2, headY + 30);
        ctx.bezierCurveTo(bx + base + wave, headY + 80, bx + base - wave, headY + 130, bx + base * 0.5, boss.groundY); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(bx, headY, 86, 72, 0, 0, Math.PI * 2);
      ctx.fillStyle = boss.color; ctx.fill();
      for (let i = -2; i <= 2; i++) {
        softGlow(bx + i * 22, headY - 6, 12, boss.accent, 0.5);
        ctx.fillStyle = boss.accent; ctx.beginPath(); ctx.arc(bx + i * 22, headY - 6, 4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // eclipse / void
      ctx.fillStyle = 'rgba(10,0,20,0.85)';
      ctx.beginPath(); ctx.moveTo(bx - 20, headY);
      ctx.quadraticCurveTo(bx - 120, headY + 40, bx - 90, boss.groundY);
      ctx.lineTo(bx + 90, boss.groundY);
      ctx.quadraticCurveTo(bx + 120, headY + 40, bx + 20, headY); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, headY, 64, 0, Math.PI * 2);
      ctx.fillStyle = boss.color; ctx.fill();
      ctx.strokeStyle = boss.accent; ctx.lineWidth = 3; ctx.stroke();
      softGlow(bx - 20, headY, 18, '#4ef0ff', 0.6); softGlow(bx + 20, headY, 18, boss.accent, 0.6);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(bx - 20, headY, 10, 14, 0, 0, Math.PI * 2); ctx.ellipse(bx + 20, headY, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = frame * 0.03 + i * 2.1;
        softGlow(bx + Math.cos(a) * 110, headY + Math.sin(a) * 36, 14, boss.accent, 0.5);
      }
    }
    if (boss.transformFlash > 0) softGlow(bx, headY, 150 * (boss.transformFlash / 45), '#fff', 0.4);
    ctx.restore();
  }

  function bossHit(px, py, pr) {
    if (!boss.alive) return false;
    const headY = boss.groundY - 160;
    if (Math.hypot(px - boss.x, py - headY) < boss.headR * 1.15 + pr) return true;
    if (py + pr >= headY + 20 && py - pr <= boss.groundY && Math.abs(px - boss.x) <= 28 + pr) return true;
    return py + pr >= boss.groundY - 30 && Math.abs(px - boss.x) <= 70 + pr;
  }

  // ===== COMBAT =====
  function damagePlayer() {
    if (player.buffInvuln > 0 || player.hitFlash > 0 || player.invuln > 0 || player.dashing > 0 || player.superActive > 0) return;
    // shield absorbs
    if (player.shield > 0) {
      player.shield = 0;
      player.shieldCd = char.shieldRegen || 420;
      player.invuln = 25; player.hitFlash = 20;
      shake = 8; burst(player.x, player.y, 12, ['#5dffb0', '#fff']);
      updateShieldHud();
      return;
    }
    // vuln may skip? no - always lose life; vuln used as extra chip chance on future - apply as double-hit chance
    lives--;
    livesEl.textContent = lives;
    persistRun();
    player.hitFlash = 45; player.invuln = 45;
    shake = 12; flashWhite = 6;
    burst(player.x, player.y, 16, [char.head, '#fff']);
    // overload takes occasional extra heart loss feel via shorter invuln
    if (char.vuln > 1) player.invuln = Math.floor(45 / char.vuln);
    if (lives <= 0) endFight(false);
  }

  function hurtBoss(dmg, x, y) {
    if (!boss.alive || boss.dying) return;
    boss.hp -= dmg; boss.hitFlash = 8; updateBossBar();
    addScore(8 * dmg); float(x, y - 20, '-' + dmg, '#fff');
    burst(x, y, 5 + dmg, [boss.color, boss.accent], 4);
    if (char.lifesteal > 0 && Math.random() < char.lifesteal) {
      lives = Math.min(char.lives + 1, lives + 1);
      livesEl.textContent = lives; float(player.x, player.y - 40, '+♥', '#ff4d6d'); persistRun();
    }
    if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5 && boss.hp > 0) {
      boss.phase = 2; boss.transformFlash = 50; phaseEl.textContent = 'Form II';
      enemies = []; shake = 16; flashWhite = 10;
      burst(boss.x, boss.groundY - 160, 36, [boss.color, boss.accent, '#fff'], 8);
      boss.attackTimer = 55;
    }
    if (boss.hp <= 0) {
      boss.hp = 0; boss.dying = true; boss.deathTimer = 110;
      addScore(350 + worldIdx * 80 + bossIdx * 40);
    }
  }

  function fireBullet() {
    if (player.cooldown > 0 || player.superActive > 0) return;
    let rate = player.power > 0 ? Math.max(3, char.fireRate - 3) : char.fireRate;
    if (player.buffFire > 0) rate = Math.max(2, Math.floor(rate / 1.5));
    const baseX = player.x + player.w / 2 + 24;
    const baseY = player.y - 2;
    const shots = char.shots || 1;
    const dmgMul = player.buffDmg > 0 ? 1.5 : 1;
    for (let i = 0; i < shots; i++) {
      let dmg = char.dmg;
      if (char.dmgChance && Math.random() > char.dmgChance) dmg = 0;
      if (player.power > 0) dmg = Math.max(dmg, char.dmg + 1);
      dmg = Math.ceil(dmg * dmgMul);
      const spread = shots === 1 ? 0 : (i - (shots - 1) / 2) * 3.2;
      bullets.push({
        x: baseX, y: baseY + spread * 2,
        r: player.power > 0 ? char.bulletR + 2 : char.bulletR,
        vx: (player.power > 0 ? 12.5 : 11),
        vy: spread * 0.15,
        dmg, powered: player.power > 0 || player.buffDmg > 0
      });
    }
    player.cooldown = rate;
    burst(baseX + 8, baseY, 3, [char.accent, '#fff'], 2);
  }

  function canArmSuper() {
    return player.superCd <= 0 && player.onGround && Math.abs(player.vx) < SUPER_STILL &&
      Math.abs(input.axis) < 0.15 && player.dashing <= 0 &&
      !(keys.ArrowLeft || keys.KeyA || keys.ArrowRight || keys.KeyD);
  }

  function clearHazardsNear(x, y, r) {
    for (let j = hazards.length - 1; j >= 0; j--) {
      const h = hazards[j];
      const hy = h.y != null ? h.y : GROUND_Y;
      if (Math.hypot((h.x || 0) - x, hy - y) < r) {
        burst(h.x, hy, 6, [char.accent]); hazards.splice(j, 1); addScore(5);
      }
    }
  }

  function fireSuper() {
    if (!player.armed || player.superActive > 0) return;
    player.armed = false; player.stillTime = 0;
    player.superCd = Math.floor(SUPER_CD_BASE * (char.superCdMul || 1));
    player.vx = 0;
    shake = 14; flashWhite = 6;
    const type = char.super || 'beam';
    const dmg = char.superDmg;
    const px = player.x, py = player.y;

    if (type === 'beam') {
      player.superActive = 26;
      supers.push({ type: 'beam', x: px + 30, y: py - 4, life: 26, max: 26, w: 48, tick: 0, dmg });
    } else if (type === 'mortar') {
      player.superActive = 10;
      supers.push({ type: 'mortar', x: px + 40, y: py - 10, vx: 7, vy: -11, life: 90, r: 16, dmg, exploded: false });
    } else if (type === 'shockwave') {
      player.superActive = 20;
      supers.push({ type: 'shockwave', x: px, y: GROUND_Y - 8, life: 36, max: 36, w: 40, vx: 14, dmg, tick: 0 });
    } else if (type === 'aegisburst') {
      player.superActive = 24;
      player.invuln = Math.max(player.invuln, 40);
      player.shield = 1; updateShieldHud();
      supers.push({ type: 'aegisburst', x: px, y: py, life: 28, max: 28, r: 20, dmg, tick: 0 });
    } else if (type === 'blades') {
      player.superActive = 18;
      player.invuln = Math.max(player.invuln, 18);
      player.dashing = 16; player.vx = 16;
      supers.push({ type: 'blades', x: px, y: py, life: 22, max: 22, dmg, tick: 0 });
    } else if (type === 'twinbeam') {
      player.superActive = 26;
      supers.push({ type: 'twinbeam', x: px + 24, y: py - 8, life: 26, max: 26, dmg, tick: 0 });
    } else if (type === 'blinkstrike') {
      player.superActive = 14;
      const tx = Math.min(W - 220, px + 220);
      burst(px, py, 16, [char.accent, '#fff'], 4);
      player.x = tx; player.invuln = Math.max(player.invuln, 20);
      supers.push({ type: 'blinkstrike', x: px, x2: tx, y: py, life: 16, max: 16, dmg, tick: 0 });
      if (boss.alive) hurtBoss(dmg * 2, boss.x - 30, boss.groundY - 160);
      clearHazardsNear(tx, py, 80);
    } else if (type === 'drain') {
      player.superActive = 30;
      supers.push({ type: 'drain', x: px + 20, y: py - 4, life: 30, max: 30, dmg, tick: 0, healed: false });
    } else if (type === 'meltdown') {
      player.superActive = 20;
      supers.push({ type: 'meltdown', x: px, y: py, life: 24, max: 24, r: 30, dmg, tick: 0 });
    } else if (type === 'pillar') {
      player.superActive = 22;
      supers.push({ type: 'pillar', x: boss.x, y: 0, life: 32, max: 32, dmg, tick: 0 });
    } else if (type === 'storm') {
      player.superActive = 28;
      for (let i = 0; i < 14; i++) {
        supers.push({
          type: 'needle', x: 40 + Math.random() * (W * 0.65), y: -20 - Math.random() * 80,
          vy: 10 + Math.random() * 4, life: 50, dmg: Math.max(1, Math.floor(dmg / 2))
        });
      }
    } else if (type === 'starburst') {
      player.superActive = 22;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        supers.push({
          type: 'star', x: px, y: py, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9,
          life: 28, dmg, r: 8
        });
      }
    } else {
      player.superActive = 26;
      supers.push({ type: 'beam', x: px + 30, y: py - 4, life: 26, max: 26, w: 48, tick: 0, dmg });
    }
    burst(px, py, 20, [char.accent, char.head, '#fff'], 6);
    updateSuperHud();
  }

  function updateSupers() {
    for (let i = supers.length - 1; i >= 0; i--) {
      const s = supers[i];
      s.life--;
      s.tick = (s.tick || 0) + 1;
      let dead = s.life <= 0;

      if (s.type === 'beam') {
        if (s.tick % 3 === 0 && boss.alive && !boss.dying && boss.x > s.x) {
          hurtBoss(s.dmg, boss.x - 40, boss.groundY - 160);
        }
        if (s.tick % 3 === 0) clearHazardsNear(s.x + 200, s.y, 70);
      } else if (s.type === 'twinbeam') {
        if (s.tick % 3 === 0 && boss.alive && !boss.dying) {
          hurtBoss(s.dmg, boss.x - 40, boss.groundY - 160);
          hurtBoss(Math.max(1, s.dmg - 1), boss.x - 40, boss.groundY - 140);
        }
      } else if (s.type === 'mortar') {
        if (!s.exploded) {
          s.vy += 0.45; s.x += s.vx; s.y += s.vy;
          if (s.y >= GROUND_Y - 20 || Math.hypot(s.x - boss.x, s.y - (boss.groundY - 140)) < 70) {
            s.exploded = true; s.life = 12; s.x = Math.min(s.x, boss.x);
            shake = 16; burst(s.x, s.y, 30, [char.accent, '#ff6b3d', '#fff'], 8);
            if (boss.alive) hurtBoss(s.dmg * 2, s.x, s.y);
            clearHazardsNear(s.x, s.y, 120);
          }
        }
      } else if (s.type === 'shockwave') {
        s.x += s.vx; s.w += 2;
        if (s.tick % 2 === 0 && boss.alive && Math.abs(s.x - boss.x) < s.w / 2 + 40) {
          hurtBoss(s.dmg, boss.x, GROUND_Y - 40);
        }
        clearHazardsNear(s.x, GROUND_Y, 50);
      } else if (s.type === 'aegisburst') {
        s.r += 6;
        if (s.tick % 4 === 0 && boss.alive && Math.hypot(boss.x - s.x, (boss.groundY - 160) - s.y) < s.r + 40) {
          hurtBoss(s.dmg, boss.x, boss.groundY - 160);
        }
        clearHazardsNear(s.x, s.y, s.r);
      } else if (s.type === 'blades') {
        if (s.tick % 2 === 0 && boss.alive) hurtBoss(s.dmg, boss.x - 20, boss.groundY - 150);
        clearHazardsNear(player.x, player.y, 60);
      } else if (s.type === 'drain') {
        if (s.tick % 3 === 0 && boss.alive && !boss.dying) {
          hurtBoss(s.dmg, boss.x - 30, boss.groundY - 160);
          if (!s.healed && Math.random() < 0.35) {
            s.healed = true; lives++; livesEl.textContent = lives; persistRun();
            float(player.x, player.y - 40, '+♥ DRAIN', '#ff4d6d');
          }
        }
      } else if (s.type === 'meltdown') {
        s.r += 8;
        if (s.tick === 4 && boss.alive) hurtBoss(s.dmg * 2, boss.x, boss.groundY - 120);
        clearHazardsNear(s.x, s.y, s.r);
      } else if (s.type === 'pillar') {
        s.x = boss.x;
        if (s.tick % 3 === 0 && boss.alive) hurtBoss(s.dmg, boss.x, boss.groundY - 100);
        clearHazardsNear(boss.x, GROUND_Y - 80, 80);
      } else if (s.type === 'needle') {
        s.y += s.vy;
        if (boss.alive && Math.hypot(s.x - boss.x, s.y - (boss.groundY - 150)) < 55) {
          hurtBoss(s.dmg, s.x, s.y); dead = true;
        }
        if (s.y > H) dead = true;
      } else if (s.type === 'star') {
        s.x += s.vx; s.y += s.vy;
        if (boss.alive && Math.hypot(s.x - boss.x, s.y - (boss.groundY - 150)) < 60) {
          hurtBoss(s.dmg, s.x, s.y); dead = true;
        }
        if (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) dead = true;
      } else if (s.type === 'blinkstrike') {
        // visual only after instant damage
      }

      if (dead) supers.splice(i, 1);
    }
  }

  function drawSupers() {
    supers.forEach(s => {
      const t = s.max ? s.life / s.max : Math.min(1, s.life / 20);
      if (s.type === 'beam') {
        softGlow(s.x + 180, s.y, 70, char.accent, 0.3 * t);
        const g = ctx.createLinearGradient(s.x, 0, W, 0);
        g.addColorStop(0, char.head); g.addColorStop(0.5, char.accent); g.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.globalAlpha = 0.85 * t; ctx.fillStyle = g;
        ctx.fillRect(s.x, s.y - s.w / 2, W - s.x, s.w); ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(255,255,255,${0.65 * t})`; ctx.fillRect(s.x, s.y - 5, W - s.x, 10);
      } else if (s.type === 'twinbeam') {
        for (const off of [-18, 18]) {
          softGlow(s.x + 160, s.y + off, 40, off < 0 ? char.head : char.accent, 0.35 * t);
          ctx.globalAlpha = 0.8 * t;
          ctx.strokeStyle = off < 0 ? char.head : char.accent;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + off);
          ctx.quadraticCurveTo(s.x + 200, s.y + off + Math.sin(frame * 0.3 + off) * 20, W - 120, boss.groundY - 160);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else if (s.type === 'mortar') {
        if (!s.exploded) {
          softGlow(s.x, s.y, 28, char.accent, 0.5);
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = char.head; ctx.fill();
        } else {
          softGlow(s.x, s.y, 100 * t, '#ff6b3d', 0.5 * t);
        }
      } else if (s.type === 'shockwave') {
        softGlow(s.x, s.y, 50, char.accent, 0.4);
        roundRectPath(s.x - s.w / 2, s.y - 28, s.w, 36, 10);
        ctx.fillStyle = char.accent; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      } else if (s.type === 'aegisburst') {
        ctx.strokeStyle = char.accent; ctx.lineWidth = 4; ctx.globalAlpha = 0.7 * t;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
        softGlow(s.x, s.y, s.r, char.accent, 0.25 * t); ctx.globalAlpha = 1;
      } else if (s.type === 'blades') {
        softGlow(player.x, player.y, 50, char.accent, 0.4);
        ctx.strokeStyle = char.accent; ctx.lineWidth = 3;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.moveTo(player.x - 30 - k * 14, player.y - 20);
          ctx.lineTo(player.x - 10 - k * 14, player.y + 20);
          ctx.stroke();
        }
      } else if (s.type === 'drain') {
        ctx.strokeStyle = char.head; ctx.lineWidth = 8; ctx.globalAlpha = 0.75 * t;
        ctx.shadowColor = char.head; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(boss.x - 20, boss.groundY - 160); ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (s.type === 'meltdown') {
        softGlow(s.x, s.y, s.r, '#ff6b3d', 0.45 * t);
        ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 3; ctx.globalAlpha = t;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.7, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (s.type === 'pillar') {
        softGlow(s.x, H / 2, 90, char.accent, 0.35 * t);
        const g = ctx.createLinearGradient(s.x - 40, 0, s.x + 40, 0);
        g.addColorStop(0, 'transparent'); g.addColorStop(0.5, char.accent); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.8 * t; ctx.fillStyle = g;
        ctx.fillRect(s.x - 45, 0, 90, GROUND_Y); ctx.globalAlpha = 1;
      } else if (s.type === 'needle') {
        softGlow(s.x, s.y, 12, char.accent, 0.5);
        ctx.fillStyle = char.accent;
        ctx.fillRect(s.x - 2, s.y - 12, 4, 24);
      } else if (s.type === 'star') {
        softGlow(s.x, s.y, 16, char.head, 0.5);
        ctx.fillStyle = char.accent;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + k * Math.PI * 2 / 5;
          const r = k % 2 === 0 ? 10 : 4;
          const x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      } else if (s.type === 'blinkstrike') {
        ctx.globalAlpha = 0.4 * t;
        ctx.strokeStyle = char.accent; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x2, s.y); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    });
  }

  function tryJump() {
    if (player.onGround || player.coyote > 0) {
      player.vy = JUMP_V; player.onGround = false; player.coyote = 0; player.jumpBuf = 0;
      player.stillTime = 0; player.armed = false;
      return true;
    }
    return false;
  }
  function tryDash() {
    if (player.dashCd > 0 || player.dashing > 0) return;
    player.dashing = 11; player.dashCd = char.dashCd;
    player.invuln = Math.max(player.invuln, 11);
    const dir = (keys.ArrowLeft || keys.KeyA || input.axis < -0.2) ? -1
      : (keys.ArrowRight || keys.KeyD || input.axis > 0.2) ? 1 : 1;
    player.vx = dir * 12 * char.moveMul;
    player.stillTime = 0; player.armed = false;
    burst(player.x, player.y, 8, [char.accent], 3);
  }

  function spawnHazard(h) { hazards.push(h); }

  function patternAttack(name) {
    const gi = boss.globalIndex || 0;
    // Early bosses: slower projectiles, fewer shots, longer telegraphs
    const early = gi < 4 ? 0.62 : gi < 8 ? 0.78 : gi < 16 ? 0.92 : 1.08;
    const diff = (1 + worldIdx * 0.08 + bossIdx * 0.03) * early;
    const headY = boss.groundY - 160;
    const px = player.x;
    const warnMul = gi < 4 ? 1.55 : gi < 8 ? 1.25 : 1;

    if (name === 'homing') {
      const dx = px - boss.x, dy = player.y - headY, d = Math.hypot(dx, dy) || 1;
      const home = gi < 4 ? 0.015 : gi < 8 ? 0.028 : 0.04;
      spawnHazard({ type: 'seed', x: boss.x, y: headY, vx: dx / d * 4.2 * diff, vy: dy / d * 4.2 * diff, r: 10, color: boss.accent, home });
    } else if (name === 'spread') {
      const count = gi < 4 ? 1 : gi < 8 ? 2 : 2;
      for (let i = -count; i <= count; i++) {
        spawnHazard({ type: 'seed', x: boss.x - 20, y: headY, vx: -3.6 * diff, vy: i * 1.15, r: 8, color: boss.color });
      }
    } else if (name === 'arc') {
      spawnHazard({ type: 'arc', x: boss.x - 30, y: headY, vx: -2.8 * diff, vy: -8.5, r: 12, color: boss.color, grav: 0.26 });
      if (gi >= 4) {
        spawnHazard({ type: 'arc', x: boss.x - 10, y: headY - 10, vx: -2.0 * diff, vy: -10, r: 11, color: boss.accent, grav: 0.28 });
      }
    } else if (name === 'wave' || name === 'sweep') {
      spawnHazard({ type: 'wave', x: boss.x, y: GROUND_Y - 10, w: gi < 4 ? 36 : 46, h: 24, vx: -5.5 * diff, life: 100, color: boss.color });
    } else if (name === 'laser' || name === 'bolt') {
      spawnHazard({
        type: 'laser', x: Math.max(50, Math.min(W - 200, px + (Math.random() - 0.5) * (gi < 4 ? 50 : 20))),
        warn: Math.floor((gi < 4 ? 78 : 54) * warnMul), state: 'warn', strike: 14,
        w: name === 'bolt' ? (gi < 4 ? 56 : 72) : (gi < 4 ? 90 : 118), color: boss.color
      });
    } else if (name === 'rain' || name === 'meteor') {
      const n = gi < 4 ? 2 : gi < 8 ? 3 : 5;
      for (let i = 0; i < n; i++) {
        const x = 60 + i * ((W * 0.5) / Math.max(1, n - 1)) + (Math.random() - 0.5) * 30;
        spawnHazard({ type: 'meteor', x, y: -40 - Math.random() * 80, vx: (Math.random() - 0.5), vy: 4.2 + Math.random() * 1.5 * early, r: 13, color: boss.accent });
      }
      if (gi >= 4) {
        spawnHazard({ type: 'meteor', x: px, y: -60, vx: 0, vy: 5.5, r: 14, color: boss.color });
      }
      if (gi >= 8) {
        spawnHazard({ type: 'meteor', x: 55, y: -80, vx: 0.2, vy: 6, r: 14, color: boss.color });
      }
    } else if (name === 'mines') {
      const n = gi < 8 ? 2 : 4;
      for (let i = 0; i < n; i++) {
        spawnHazard({ type: 'mine', x: 70 + Math.random() * (W * 0.5), y: GROUND_Y - 16, r: 14, life: 110, arm: gi < 4 ? 55 : 35, color: boss.accent });
      }
      if (gi >= 8) {
        spawnHazard({ type: 'mine', x: Math.max(60, px), y: GROUND_Y - 16, r: 14, life: 110, arm: 30, color: boss.color });
      }
    } else if (name === 'orb' || name === 'zigzag') {
      spawnHazard({ type: 'orb', x: boss.x - 40, y: headY, vx: -3.8 * diff, vy: 0, r: 12, color: boss.color, zig: name === 'zigzag' ? (gi < 4 ? 0.1 : 0.22) : 0.06 });
    } else if (name === 'ink' || name === 'shard') {
      const n = gi < 4 ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const a = -2.5 - i * 0.28;
        spawnHazard({ type: 'shard', x: boss.x, y: headY, vx: Math.cos(a) * 5.2 * diff, vy: Math.sin(a) * 5.2 * diff, r: 9, color: boss.accent });
      }
    } else if (name === 'barrel') {
      spawnHazard({ type: 'barrel', x: boss.x - 40, y: GROUND_Y - 26, r: 26, vx: -(3.6 + worldIdx * 0.1) * early, spin: 0, color: boss.accent });
    } else if (name === 'minions') {
      enemies.push({
        x: 50 + Math.random() * (W * 0.48), y: -28, r: 16,
        speed: (gi < 4 ? 0.85 : 1.15) + Math.random() * 0.5 + worldIdx * 0.04,
        color: '#2a3348', wobble: Math.random() * 10
      });
    } else if (name === 'corner_pin') {
      if (gi < 4) {
        // Early: single slow telegraph laser only
        spawnHazard({
          type: 'laser', x: Math.max(90, Math.min(W - 210, px)),
          warn: 90, state: 'warn', strike: 12, w: 80, color: boss.color
        });
      } else {
        spawnHazard({ type: 'laser', x: 55, warn: Math.floor(48 * warnMul), state: 'warn', strike: 16, w: 90, color: boss.accent });
        spawnHazard({ type: 'laser', x: Math.max(90, Math.min(W - 210, px)), warn: Math.floor(48 * warnMul), state: 'warn', strike: 16, w: 100, color: boss.color });
        if (gi >= 8) {
          spawnHazard({ type: 'wave', x: boss.x, y: GROUND_Y - 10, w: 50, h: 28, vx: -8 * diff, life: 110, color: boss.color });
        }
      }
    }
  }

  function bossAttack() {
    const list = boss.phase === 2 ? boss.p2 : boss.patterns;
    const pick = list[(Math.random() * list.length) | 0];
    patternAttack(pick);
    const gi = boss.globalIndex || 0;
    // Almost never double-up early
    const homeChance = gi < 4 ? 0.08 : gi < 8 ? 0.28 : 0.55;
    if (Math.random() < homeChance) patternAttack('homing');
    const baseGap = gi < 4 ? 110 : gi < 8 ? 92 : 78;
    boss.attackTimer = Math.max(36, Math.floor((baseGap - worldIdx * 4 - bossIdx * 2 - (boss.phase === 2 ? 8 : 0)) * (boss.ease || 1)));
  }

  function antiCampPulse() {
    const gi = boss.globalIndex || 0;
    // First world: almost no anti-camp pressure
    if (gi < 4) {
      boss.campTimer = 220;
      if (Math.random() < 0.35) patternAttack('arc');
      return;
    }
    if (gi < 8 && Math.random() < 0.5) {
      boss.campTimer = 150;
      patternAttack('homing');
      return;
    }
    const px = player.x;
    spawnHazard({ type: 'meteor', x: 45 + Math.random() * 40, y: -50, vx: 0.3, vy: 6.2, r: 13, color: boss.accent });
    spawnHazard({ type: 'meteor', x: px + (Math.random() - 0.5) * 40, y: -70, vx: 0, vy: 6.5, r: 14, color: boss.color });
    if (px < 120) {
      spawnHazard({ type: 'wave', x: boss.x, y: GROUND_Y - 10, w: 54, h: 30, vx: -9, life: 100, color: boss.accent });
      spawnHazard({ type: 'seed', x: boss.x, y: boss.groundY - 160, vx: (px - boss.x) / 40, vy: (player.y - (boss.groundY - 160)) / 40, r: 11, color: boss.color, home: 0.06 });
    }
    boss.campTimer = Math.max(55, 95 - worldIdx * 4);
  }

  function updateHazards() {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      let dead = false;
      if (h.home) {
        const dx = player.x - h.x, dy = player.y - h.y, d = Math.hypot(dx, dy) || 1;
        h.vx += dx / d * h.home * 8; h.vy += dy / d * h.home * 8;
        const sp = Math.hypot(h.vx, h.vy) || 1;
        const max = 7.5;
        if (sp > max) { h.vx = h.vx / sp * max; h.vy = h.vy / sp * max; }
      }
      if (['seed','orb','shard','ink','arc','meteor'].includes(h.type)) {
        if (h.grav) h.vy += h.grav;
        if (h.zig) h.vy += Math.sin(frame * 0.2) * h.zig;
        h.x += h.vx; h.y += h.vy;
        if (h.x < -50 || h.x > W + 50 || h.y > H + 50) dead = true;
        if (Math.hypot(h.x - player.x, h.y - (player.y - 10)) < h.r + 22) { damagePlayer(); dead = true; }
      } else if (h.type === 'laser' || h.type === 'bolt') {
        if (h.state === 'warn') {
          h.warn--;
          if (h.warn <= 0) { h.state = 'strike'; h.strike = h.strike || 14; shake = Math.max(shake, 8); }
        } else {
          h.strike--;
          if (Math.abs(player.x - h.x) < h.w / 2 + player.w / 2) damagePlayer();
          if (h.strike <= 0) dead = true;
        }
      } else if (h.type === 'barrel') {
        h.x += h.vx; h.spin += h.vx * 0.12;
        if (Math.abs(player.x - h.x) < player.w / 2 + h.r && player.y + player.h / 2 > h.y - h.r - 4) damagePlayer();
        if (h.x < -40) dead = true;
      } else if (h.type === 'wave' || h.type === 'sweep') {
        h.x += h.vx; h.life--;
        if (Math.abs(player.x - h.x) < (h.w || 40) / 2 + player.w / 2 && player.y + player.h / 2 > GROUND_Y - (h.h || 28)) damagePlayer();
        if (h.life <= 0 || h.x < -60) dead = true;
      } else if (h.type === 'mine') {
        h.life--;
        if (h.arm > 0) h.arm--;
        else if (Math.hypot(h.x - player.x, h.y - player.y) < h.r + 24) { damagePlayer(); burst(h.x, h.y, 12, [h.color]); dead = true; }
        if (h.life <= 0) dead = true;
      }
      if (dead) hazards.splice(i, 1);
    }
  }

  function drawHazards() {
    hazards.forEach(h => {
      if (h.type === 'laser' || h.type === 'bolt') {
        ctx.save();
        if (h.state === 'warn') {
          ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(frame * 0.35));
          ctx.strokeStyle = h.color; ctx.setLineDash([8, 8]); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(h.x, 0); ctx.lineTo(h.x, GROUND_Y); ctx.stroke();
          ctx.setLineDash([]); softGlow(h.x, GROUND_Y, 36, h.color, 0.4);
        } else {
          softGlow(h.x, H / 2, h.w, h.color, 0.4);
          const g = ctx.createLinearGradient(h.x - h.w / 2, 0, h.x + h.w / 2, 0);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = Math.max(0.2, h.strike / 16); ctx.fillStyle = g;
          ctx.fillRect(h.x - h.w / 2, 0, h.w, GROUND_Y);
        }
        ctx.restore();
      } else if (h.type === 'barrel') {
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.spin || 0);
        softGlow(0, 0, h.r * 1.3, h.color, 0.3);
        ctx.beginPath(); ctx.arc(0, 0, h.r, 0, Math.PI * 2); ctx.fillStyle = h.color; ctx.fill();
        ctx.restore();
      } else if (h.type === 'wave' || h.type === 'sweep') {
        softGlow(h.x, h.y, 40, h.color, 0.35);
        roundRectPath(h.x - (h.w || 40) / 2, h.y - (h.h || 24), h.w || 40, h.h || 24, 8);
        ctx.fillStyle = h.color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      } else if (h.type === 'mine') {
        softGlow(h.x, h.y, 22, h.color, h.arm > 0 ? 0.2 : 0.5);
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
        ctx.fillStyle = h.arm > 0 ? '#445' : h.color; ctx.fill();
      } else {
        softGlow(h.x, h.y, h.r * 2, h.color, 0.4);
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fillStyle = h.color; ctx.fill();
      }
    });
  }

  function readAxis() {
    let axis = input.axis;
    if (keys.ArrowLeft || keys.KeyA) axis = -1;
    if (keys.ArrowRight || keys.KeyD) axis = 1;
    if ((keys.ArrowLeft || keys.KeyA) && (keys.ArrowRight || keys.KeyD)) axis = 0;
    return axis;
  }

  function update() {
    frame++; boss.sway += 0.035;
    if (shake > 0) shake--; if (flashWhite > 0) flashWhite--;
    if (player.superCd > 0) player.superCd--;
    if (player.superActive > 0) player.superActive--;
    if (player.cooldown > 0) player.cooldown--;
    if (player.dashCd > 0) player.dashCd--;
    if (player.invuln > 0) player.invuln--;
    if (player.power > 0) player.power--;
    if (player.hitFlash > 0) player.hitFlash--;
    if (boss.hitFlash > 0) boss.hitFlash--;
    if (boss.transformFlash > 0) boss.transformFlash--;
    if (player.buffSpeed > 0) player.buffSpeed--;
    if (player.buffDmg > 0) player.buffDmg--;
    if (player.buffInvuln > 0) player.buffInvuln--;
    if (player.buffFire > 0) player.buffFire--;

    // shield regen
    if (char.shieldMax > 0 && player.shield <= 0) {
      if (player.shieldCd > 0) player.shieldCd--;
      else { player.shield = 1; updateShieldHud(); burst(player.x, player.y, 10, ['#5dffb0']); }
    }

    const axis = readAxis();
    const wantJump = keys.ArrowUp || keys.KeyW || input.jump;
    const wantShoot = keys.Space || input.shoot;
    const moveSpeed = player.speed * (player.buffSpeed > 0 ? 1.5 : 1);

    if (input.jumpPressed) { player.jumpBuf = JUMP_BUF; input.jumpPressed = false; }
    const kbJump = !!(keys.ArrowUp || keys.KeyW);
    if (kbJump && !player._jh) player.jumpBuf = JUMP_BUF;
    player._jh = kbJump || input.jump;

    const kbDash = !!(keys.ShiftLeft || keys.ShiftRight || keys.KeyE);
    if (input.dashPressed || (kbDash && !player._dh)) tryDash();
    input.dashPressed = false; player._dh = input.dash || kbDash;

    if (input.superPressed) { fireSuper(); input.superPressed = false; }
    const kbSuper = !!(keys.KeyF || keys.KeyQ);
    if (kbSuper && !player._sh) fireSuper();
    player._sh = kbSuper;

    if (player.superActive > 0) player.vx = 0;
    else if (player.dashing > 0) { player.dashing--; player.x += player.vx; }
    else {
      const target = axis * moveSpeed;
      if (axis !== 0) { player.vx += (target - player.vx) * 0.9; player.facing = axis > 0 ? 1 : -1; }
      else { player.vx *= 0.76; if (Math.abs(player.vx) < 0.08) player.vx = 0; }
      player.x += player.vx;
    }
    player.x = Math.max(player.w / 2 + 8, Math.min(W - 200, player.x));

    if (player.jumpBuf > 0) { if (!tryJump()) player.jumpBuf--; }
    if (!wantJump && player.vy < -4) player.vy *= 0.55;
    player.vy += GRAVITY; player.y += player.vy;
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y; player.vy = 0;
      if (!player.onGround) player.coyote = COYOTE;
      player.onGround = true;
    } else {
      player.onGround = false; if (player.coyote > 0) player.coyote--;
    }

    // Super: ready instantly while standing still (no charge time)
    if (canArmSuper()) {
      player.armed = true;
      player.stillTime = 1;
    } else if (player.superCd <= 0) {
      player.armed = false;
      player.stillTime = 0;
    }
    updateSuperHud();

    if (wantShoot) fireBullet();

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy || 0;
      if (b.x > W + 40) { bullets.splice(i, 1); continue; }
      if (b.dmg > 0 && bossHit(b.x, b.y, b.r)) { hurtBoss(b.dmg, b.x, b.y); bullets.splice(i, 1); }
      else if (b.dmg <= 0 && bossHit(b.x, b.y, b.r)) { bullets.splice(i, 1); burst(b.x, b.y, 3, [char.accent]); }
    }

    for (let i = beams.length - 1; i >= 0; i--) {
      beams.splice(i, 1);
    }
    updateSupers();

    // minions — obvious grunt drones
    if ((boss.phase === 1 && boss.patterns.includes('minions')) || boss.kind === 'void') {
      spawnTimer--;
      if (spawnTimer <= 0) {
        enemies.push({
          x: 40 + Math.random() * (W * 0.5), y: -28,
          r: 16, speed: 1.15 + worldIdx * 0.07,
          color: '#2a3348', wobble: Math.random() * 10
        });
        spawnTimer = Math.max(36, 78 - worldIdx * 4);
      }
    }
    enemies.forEach(e => { e.y += e.speed; e.x += Math.sin((frame + e.wobble) * 0.08) * 0.6; });
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      let remove = e.y > H + 20;
      if (!remove) {
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
            burst(e.x, e.y, 8, ['#fff', char.accent]);
            if (Math.random() < POWER_DROP) {
              const kinds = ['speed', 'damage', 'invuln', 'firerate'];
              powerups.push({
                x: e.x, y: e.y, vy: -2.5,
                kind: kinds[(Math.random() * kinds.length) | 0],
                life: 500
              });
            }
            bullets.splice(j, 1); addScore(18); remove = true; break;
          }
        }
      }
      if (!remove && Math.hypot(e.x - player.x, e.y - (player.y - 10)) < e.r + 24) { damagePlayer(); remove = true; }
      if (remove) enemies.splice(i, 1);
    }

    if (boss.alive && !boss.dying) {
      boss.attackTimer--; if (boss.attackTimer <= 0) bossAttack();
      boss.campTimer--; if (boss.campTimer <= 0) antiCampPulse();
      boss.auxTimer--;
      if (boss.auxTimer <= 0) {
        if (boss.phase === 2 && (boss.p2.includes('barrel') || boss.kind === 'mech')) patternAttack('barrel');
        else if ((boss.globalIndex || 0) >= 4 && Math.random() < 0.5) patternAttack('corner_pin');
        else patternAttack('minions');
        boss.auxTimer = Math.max(70, Math.floor((140 - worldIdx * 8) * (boss.ease || 1)));
      }
    }
    updateHazards();

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.vy += 0.22; p.y += p.vy; p.life--;
      if (p.y > GROUND_Y) { p.y = GROUND_Y; p.vy = 0; }
      if (Math.hypot(p.x - player.x, p.y - player.y) < 32) {
        applyPowerup(p.kind);
        burst(p.x, p.y, 12, powerupColor(p.kind));
        powerups.splice(i, 1);
      } else if (p.life <= 0) powerups.splice(i, 1);
    }

    if (boss.dying) {
      boss.deathTimer--;
      if (boss.deathTimer % 3 === 0) burst(boss.x + (Math.random() - 0.5) * 100, boss.groundY - 160, 4, [boss.color, boss.accent], 3);
      if (boss.deathTimer <= 0) {
        boss.alive = false; boss.dying = false;
        burst(boss.x, boss.groundY - 160, 45, [boss.color, '#fff'], 8);
        endFight(true);
      }
    }

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particles = particles.filter(p => p.life > 0);
    floatText.forEach(f => { f.y -= 0.8; f.life--; });
    floatText = floatText.filter(f => f.life > 0);
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 1.3, (Math.random() - 0.5) * shake * 1.3);
    drawArena();

    if (boss.dying) {
      const t = 1 - boss.deathTimer / 110;
      ctx.save(); ctx.translate(boss.x, boss.groundY); ctx.rotate(Math.min(1, t * 1.5) * 1.1);
      ctx.globalAlpha = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
      ctx.translate(-boss.x, -boss.groundY); drawBossBody(); ctx.restore();
    } else drawBossBody();

    powerups.forEach(drawPowerup);
    enemies.forEach(drawMinion);
    drawHazards();
    drawSupers();
    bullets.forEach(b => {
      softGlow(b.x, b.y, b.r * 2.5, b.powered ? '#ffc857' : char.accent, 0.4);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.powered ? '#ffc857' : char.accent; ctx.fill();
    });
    particles.forEach(p => {
      ctx.globalAlpha = Math.min(1, p.life / 22);
      if (p.glow) softGlow(p.x, p.y, p.r * 2.5, p.color, 0.3);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    // buff auras
    if (player.buffInvuln > 0) softGlow(player.x, player.y, 48, '#ffe66d', 0.35);
    if (player.buffSpeed > 0) softGlow(player.x, player.y, 40, '#4ef0ff', 0.25);
    if (player.buffDmg > 0) softGlow(player.x, player.y, 40, '#ff6b3d', 0.25);
    drawPlayer();
    floatText.forEach(f => {
      ctx.globalAlpha = Math.min(1, f.life / 20);
      ctx.fillStyle = f.color; ctx.font = '700 16px Orbitron,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
    });
    if (boss.dying) {
      const t = 1 - boss.deathTimer / 110;
      if (t > 0.2) {
        ctx.save(); ctx.globalAlpha = Math.min(1, (t - 0.2) * 3);
        ctx.textAlign = 'center'; ctx.font = '800 52px Orbitron,sans-serif';
        ctx.fillStyle = '#fff'; ctx.shadowColor = boss.color; ctx.shadowBlur = 20;
        ctx.fillText('BOSS DOWN', W / 2, H / 2); ctx.restore();
      }
    }
    if (flashWhite > 0) { ctx.fillStyle = `rgba(255,255,255,${flashWhite / 12})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  function loop() {
    if (!running) { looping = false; draw(); return; }
    update(); draw(); requestAnimationFrame(loop);
  }

  applyBoss();
  livesEl.textContent = lives;
  scoreEl.textContent = score;
  updateShieldHud();
  updateSuperHud();
  draw();
  showOverlay('start');
})();
