(function () {
  'use strict';

  // ── Inject styles ──────────────────────────────────────────────────────────
  const CSS = `
    #game-area { display:flex; flex-direction:column; align-items:center; gap:16px; padding:16px; }

    .rs-rule-indicator {
      background: var(--bg-elevated);
      border: 1px solid var(--bg-elevated);
      border-radius: 10px;
      padding: 8px 20px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
      min-height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.3s;
    }
    .rs-rule-indicator.hidden { opacity: 0; pointer-events: none; }

    .rs-card {
      width: 180px;
      height: 180px;
      border-radius: 18px;
      background: var(--bg-elevated);
      border: 3px solid var(--bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 6px;
      font-size: 3.2rem;
      transition: transform 0.15s, border-color 0.2s;
      box-shadow: 0 4px 24px rgba(0,0,0,0.35);
      position: relative;
      user-select: none;
    }
    .rs-card.correct  { border-color: var(--success); }
    .rs-card.incorrect { border-color: var(--error); }
    .rs-card .rs-card-count {
      font-size: 1rem;
      color: var(--text-secondary);
      position: absolute;
      bottom: 8px;
      right: 12px;
    }

    .rs-feedback {
      font-size: 1.1rem;
      font-weight: 700;
      min-height: 28px;
      letter-spacing: 0.04em;
      transition: opacity 0.3s;
    }
    .rs-feedback.correct  { color: var(--success); }
    .rs-feedback.incorrect { color: var(--error); }

    .rs-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
      max-width: 380px;
    }
    .rs-btn {
      background: var(--bg-elevated);
      border: 2px solid transparent;
      border-radius: 10px;
      color: var(--text-primary);
      padding: 12px 8px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .rs-btn:hover { background: var(--primary-500); transform: translateY(-1px); }
    .rs-btn:active { transform: translateY(0); }
    .rs-btn .rs-btn-key {
      display: inline-block;
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.72rem;
      color: var(--text-secondary);
    }

    .rs-progress {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .rs-summary {
      text-align: center;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .rs-summary h3 { font-size: 1.4rem; margin: 0; }
    .rs-summary .rs-stat { font-size: 1rem; color: var(--text-secondary); }
    .rs-summary .rs-big-score {
      font-size: 3rem;
      font-weight: 800;
      color: var(--primary-500);
      line-height: 1;
    }

    .rs-shifts-badge {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── Level config ───────────────────────────────────────────────────────────
  //  { trials, shifts, showRuleTrials, thirdRule }
  //  showRuleTrials: Infinity = always shown, 2 = first 2 only, 0 = never
  function buildLevelConfig() {
    const cfg = [];
    // L1-3: 20 trials, no shifts, full rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 20, shifts: 0, showRuleTrials: Infinity, thirdRule: false });
    // L4-6: 24 trials, 1 shift at ~13, full rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 24, shifts: 1, showRuleTrials: Infinity, thirdRule: false });
    // L7-9: 28 trials, 2 shifts, full rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 28, shifts: 2, showRuleTrials: Infinity, thirdRule: false });
    // L10-12: 32 trials, 2 shifts, full rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 32, shifts: 2, showRuleTrials: Infinity, thirdRule: false });
    // L13-15: 36 trials, 3 shifts, full rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 36, shifts: 3, showRuleTrials: Infinity, thirdRule: false });
    // L16-18: 36 trials, 3 shifts, rule shown for first 2 trials only
    for (let i = 0; i < 3; i++) cfg.push({ trials: 36, shifts: 3, showRuleTrials: 2, thirdRule: false });
    // L19-21: 40 trials, 3 shifts, no rule shown
    for (let i = 0; i < 3; i++) cfg.push({ trials: 40, shifts: 3, showRuleTrials: 0, thirdRule: false });
    // L22-24: 40 trials, 4 shifts, no rule
    for (let i = 0; i < 3; i++) cfg.push({ trials: 40, shifts: 4, showRuleTrials: 0, thirdRule: false });
    // L25-27: 44 trials, 4 shifts, no rule, 3rd rule (count)
    for (let i = 0; i < 3; i++) cfg.push({ trials: 44, shifts: 4, showRuleTrials: 0, thirdRule: true });
    // L28-30: 48 trials, 5 shifts, 3 rules, no guidance
    for (let i = 0; i < 3; i++) cfg.push({ trials: 48, shifts: 5, showRuleTrials: 0, thirdRule: true });
    return cfg;
  }
  const LEVEL_CONFIGS = buildLevelConfig();

  // ── Card content ───────────────────────────────────────────────────────────
  const COLORS   = ['red', 'blue', 'green', 'yellow'];
  const SHAPES   = ['circle', 'square', 'triangle', 'star'];
  const COUNTS   = [1, 2, 3, 4];

  // Emoji map: shape -> emoji character
  const SHAPE_EMOJI = {
    circle:   '●',
    square:   '■',
    triangle: '▲',
    star:     '★',
  };

  // Color map -> CSS color
  const COLOR_CSS = {
    red:    '#EF4444',
    blue:   '#4F6BF5',
    green:  '#22C55E',
    yellow: '#F59E0B',
  };

  // Rule types
  const RULE_COLOR = 'color';
  const RULE_SHAPE = 'shape';
  const RULE_COUNT = 'count';

  // Button labels per rule
  const RULE_LABELS = {
    [RULE_COLOR]: ['🔴 Red', '🔵 Blue', '🟢 Green', '🟡 Yellow'],
    [RULE_SHAPE]: ['● Circle', '■ Square', '▲ Triangle', '★ Star'],
    [RULE_COUNT]: ['1 Shape', '2 Shapes', '3 Shapes', '4 Shapes'],
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let engine;
  let currentLevel = 1;
  let cfg;
  let trials = [];
  let trialIndex = 0;
  let correctTotal = 0;
  let totalAnswered = 0;
  let currentRule;
  let availableRules;
  let shiftPoints = [];
  let shiftsDone = 0;
  let blocked = false;
  let trialInRule = 0; // trials since last shift

  // ── Engine init ────────────────────────────────────────────────────────────
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: 'rule-shift',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: startLevel,
    });
  }

  // ── Build trials ───────────────────────────────────────────────────────────
  function buildTrials(levelCfg) {
    const arr = [];
    for (let i = 0; i < levelCfg.trials; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const count = COUNTS[Math.floor(Math.random() * COUNTS.length)];
      arr.push({ color, shape, count });
    }
    return arr;
  }

  function computeShiftPoints(nTrials, nShifts) {
    if (nShifts === 0) return [];
    const points = [];
    const segment = Math.floor(nTrials / (nShifts + 1));
    for (let i = 1; i <= nShifts; i++) {
      // Shift around segment midpoint ± small random
      const base = segment * i;
      const jitter = Math.floor(Math.random() * 5) - 2;
      points.push(Math.max(5, Math.min(nTrials - 5, base + jitter)));
    }
    return points;
  }

  // ── Start level ───────────────────────────────────────────────────────────
  function startLevel(level) {
    currentLevel = level;
    cfg = LEVEL_CONFIGS[level - 1];
    trials = buildTrials(cfg);
    trialIndex = 0;
    correctTotal = 0;
    totalAnswered = 0;
    shiftsDone = 0;
    trialInRule = 0;
    blocked = false;

    availableRules = cfg.thirdRule
      ? [RULE_COLOR, RULE_SHAPE, RULE_COUNT]
      : [RULE_COLOR, RULE_SHAPE];

    currentRule = availableRules[Math.floor(Math.random() * availableRules.length)];
    shiftPoints = computeShiftPoints(cfg.trials, cfg.shifts);

    renderGame();
    renderTrial();
  }

  // ── Render game shell ──────────────────────────────────────────────────────
  function renderGame() {
    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div class="rs-rule-indicator" id="rs-rule-indicator"></div>
      <div class="rs-card" id="rs-card"><span id="rs-card-emoji"></span><span class="rs-card-count" id="rs-card-count"></span></div>
      <div class="rs-feedback" id="rs-feedback">&nbsp;</div>
      <div class="rs-buttons" id="rs-buttons"></div>
      <div class="rs-progress" id="rs-progress"></div>
    `;
    renderButtons();
  }

  function renderButtons() {
    const container = document.getElementById('rs-buttons');
    if (!container) return;
    const labels = RULE_LABELS[currentRule];
    container.innerHTML = labels.map((label, i) => `
      <button class="rs-btn" data-idx="${i}" aria-label="${label}">
        <span class="rs-btn-key">${i + 1}</span> ${label}
      </button>
    `).join('');
    container.querySelectorAll('.rs-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx)));
    });
  }

  // ── Render a single trial ─────────────────────────────────────────────────
  function renderTrial() {
    if (trialIndex >= trials.length) {
      endLevel();
      return;
    }

    // Check if shift should occur at this trial
    if (shiftsDone < shiftPoints.length && trialIndex >= shiftPoints[shiftsDone]) {
      doShift();
    }

    const trial = trials[trialIndex];
    const emojiEl = document.getElementById('rs-card-emoji');
    const cardEl  = document.getElementById('rs-card');
    const countEl = document.getElementById('rs-card-count');

    if (!emojiEl) return;

    // Display emoji with color
    const emoji = SHAPE_EMOJI[trial.shape];
    const color = COLOR_CSS[trial.color];
    emojiEl.textContent = '';

    // Build display: count copies of the emoji
    const display = Array.from({ length: trial.count }, () =>
      `<span style="color:${color}">${emoji}</span>`
    ).join(' ');
    emojiEl.innerHTML = display;

    // If count > 1, scale font down slightly
    emojiEl.style.fontSize = trial.count <= 2 ? '2.8rem' : '2rem';

    // Show count badge only for count rule visible levels
    countEl.textContent = cfg.thirdRule ? `×${trial.count}` : '';

    cardEl.className = 'rs-card';

    // Rule indicator
    updateRuleIndicator();

    // Progress
    const prog = document.getElementById('rs-progress');
    if (prog) prog.textContent = `Trial ${trialIndex + 1} of ${cfg.trials}`;

    // Clear feedback
    const fb = document.getElementById('rs-feedback');
    if (fb) { fb.textContent = '\u00a0'; fb.className = 'rs-feedback'; }

    blocked = false;
    trialInRule++;
  }

  function updateRuleIndicator() {
    const ind = document.getElementById('rs-rule-indicator');
    if (!ind) return;
    const showRule = cfg.showRuleTrials === Infinity
      ? true
      : (trialIndex < cfg.showRuleTrials);

    if (showRule) {
      const ruleNames = { [RULE_COLOR]: 'COLOR', [RULE_SHAPE]: 'SHAPE', [RULE_COUNT]: 'COUNT' };
      ind.textContent = `Sort by: ${ruleNames[currentRule]}`;
      ind.classList.remove('hidden');
    } else {
      ind.textContent = 'Rule hidden – use feedback to adapt';
      ind.classList.remove('hidden');
      // Fade styling
      ind.style.color = 'var(--text-secondary)';
      ind.style.fontStyle = 'italic';
    }
  }

  // ── Shift rule ─────────────────────────────────────────────────────────────
  function doShift() {
    const otherRules = availableRules.filter(r => r !== currentRule);
    currentRule = otherRules[Math.floor(Math.random() * otherRules.length)];
    shiftsDone++;
    trialInRule = 0;
    // Re-render buttons with new rule (but labels only update if rule shown)
    // Always update buttons to match new rule
    renderButtons();
  }

  // ── Handle answer ──────────────────────────────────────────────────────────
  function handleAnswer(idx) {
    if (blocked) return;
    blocked = true;

    const trial = trials[trialIndex];
    let correctIdx;

    if (currentRule === RULE_COLOR) {
      correctIdx = COLORS.indexOf(trial.color);
    } else if (currentRule === RULE_SHAPE) {
      correctIdx = SHAPES.indexOf(trial.shape);
    } else {
      correctIdx = COUNTS.indexOf(trial.count);
    }

    const isCorrect = idx === correctIdx;
    totalAnswered++;

    const card = document.getElementById('rs-card');
    const fb   = document.getElementById('rs-feedback');

    if (isCorrect) {
      correctTotal++;
      if (card) card.classList.add('correct');
      if (fb) { fb.textContent = 'Correct ✓'; fb.className = 'rs-feedback correct'; }
      BrainForge.Audio.correct();
    } else {
      if (card) card.classList.add('incorrect');
      if (fb) { fb.textContent = 'Incorrect ✗'; fb.className = 'rs-feedback incorrect'; }
      BrainForge.Audio.wrong();
    }

    const pct = Math.round((correctTotal / totalAnswered) * 100);
    engine.updateScore(pct);

    trialIndex++;
    setTimeout(renderTrial, 700);
  }

  // ── End level ──────────────────────────────────────────────────────────────
  function endLevel() {
    const pct = totalAnswered > 0 ? Math.round((correctTotal / totalAnswered) * 100) : 0;
    const area = document.getElementById('game-area');

    const shiftsLabel = cfg.shifts > 0
      ? `Rule shifted <strong>${cfg.shifts}</strong> time${cfg.shifts !== 1 ? 's' : ''}`
      : 'No rule shifts (practice)';

    area.innerHTML = `
      <div class="rs-summary">
        <h3>Level ${currentLevel} Complete</h3>
        <div class="rs-big-score">${pct}%</div>
        <div class="rs-stat">${correctTotal} correct out of ${totalAnswered} trials</div>
        <div class="rs-shifts-badge">${shiftsLabel}</div>
      </div>
    `;

    engine.completeLevel(pct);
    BrainForge.Audio.levelUp();
  }

  // ── Keyboard support ───────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    const key = e.key;
    if (['1', '2', '3', '4'].includes(key)) {
      handleAnswer(parseInt(key) - 1);
    }
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
