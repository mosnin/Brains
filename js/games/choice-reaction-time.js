(function () {
  'use strict';

  // ── Injected styles ──────────────────────────────────────────────────────────
  const STYLE = `
    .crt-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 340px;
      gap: 24px;
      padding: 24px 16px;
    }
    .crt-stimulus-wrap {
      position: relative;
      width: 180px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .crt-stimulus {
      font-size: 100px;
      line-height: 1;
      user-select: none;
      transition: opacity 0.08s;
      text-align: center;
    }
    .crt-stimulus.circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      font-size: 0;
      display: inline-block;
      box-shadow: 0 0 28px 6px rgba(0,0,0,0.4);
    }
    .crt-stimulus.circle.blue  { background: #3B82F6; box-shadow: 0 0 32px 8px rgba(59,130,246,0.45); }
    .crt-stimulus.circle.red   { background: #EF4444; box-shadow: 0 0 32px 8px rgba(239,68,68,0.45); }
    .crt-stimulus.arrow { color: var(--text-primary); }
    .crt-stimulus.up    { color: #A78BFA; }
    .crt-stimulus.down  { color: #34D399; }
    .crt-choice-indicator {
      display: flex;
      gap: 32px;
      font-size: 13px;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }
    .crt-choice-indicator span { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .crt-choice-indicator .key-hint {
      background: var(--bg-elevated);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 11px;
      color: var(--text-secondary);
    }
    .crt-result {
      min-height: 28px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-align: center;
    }
    .crt-result.correct { color: var(--success); }
    .crt-result.wrong   { color: var(--error); }
    .crt-result.too-slow { color: #F59E0B; }
    .crt-buttons {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .crt-buttons .choice-btn {
      min-width: 90px;
      font-size: 22px;
      padding: 14px 18px;
      border-radius: 12px;
      border: 2px solid var(--bg-elevated);
      background: var(--bg-surface);
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.08s;
      user-select: none;
    }
    .crt-buttons .choice-btn:hover { background: var(--bg-elevated); border-color: var(--primary-500); }
    .crt-buttons .choice-btn:active { transform: scale(0.94); }
    .crt-buttons .choice-btn[data-dir="left"]  { border-left: 4px solid #3B82F6; }
    .crt-buttons .choice-btn[data-dir="right"] { border-right: 4px solid #EF4444; }
    .crt-buttons .choice-btn[data-dir="up"]    { border-top: 4px solid #A78BFA; }
    .crt-buttons .choice-btn[data-dir="down"]  { border-bottom: 4px solid #34D399; }
    .crt-progress-row {
      display: flex;
      gap: 10px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .crt-progress-row strong { color: var(--text-primary); }
    .crt-fixation {
      font-size: 48px;
      color: var(--text-secondary);
      opacity: 0.5;
      line-height: 1;
    }
    .crt-summary { text-align: center; padding: 8px 0; }
    .crt-summary h3 { font-size: 18px; margin-bottom: 12px; color: var(--text-primary); }
    .crt-summary .stat-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 8px; }
    .crt-summary .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .crt-summary .stat__val { font-size: 26px; font-weight: 700; color: var(--accent-500); }
    .crt-summary .stat__lbl { font-size: 12px; color: var(--text-secondary); }
    .crt-wait { color: var(--text-secondary); font-size: 14px; margin-top: 6px; }
  `;

  function injectStyles() {
    if (document.getElementById('crt-styles')) return;
    const s = document.createElement('style');
    s.id = 'crt-styles';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ── Level configuration ──────────────────────────────────────────────────────
  const LEVELS = (function () {
    const cfg = [];
    // L1-5: circles, 900ms, FP 2-4s
    for (let i = 1; i <= 5; i++)  cfg.push({ n: 20, threshold: 900, type: 'circles',   fpMin: 2000, fpMax: 4000, choices: ['left','right'] });
    // L6-10: circles, 750ms, FP 1-3s
    for (let i = 6; i <= 10; i++) cfg.push({ n: 20, threshold: 750, type: 'circles',   fpMin: 1000, fpMax: 3000, choices: ['left','right'] });
    // L11-15: arrows, 700ms, FP 1-3s
    for (let i = 11; i <= 15; i++) cfg.push({ n: 20, threshold: 700, type: 'arrows',   fpMin: 1000, fpMax: 3000, choices: ['left','right'] });
    // L16-20: arrows, 650ms, FP 0.5-3s
    for (let i = 16; i <= 20; i++) cfg.push({ n: 20, threshold: 650, type: 'arrows',   fpMin: 500,  fpMax: 3000, choices: ['left','right'] });
    // L21-25: 4-choice arrows, 600ms, FP 0.5-3s
    for (let i = 21; i <= 25; i++) cfg.push({ n: 20, threshold: 600, type: 'arrows4',  fpMin: 500,  fpMax: 3000, choices: ['left','right','up','down'] });
    // L26-30: 4-choice + distractors, 550ms, FP 0.5-4s
    for (let i = 26; i <= 30; i++) cfg.push({ n: 20, threshold: 550, type: 'arrows4d', fpMin: 500,  fpMax: 4000, choices: ['left','right','up','down'] });
    return cfg;
  })();

  // ── Engine init ──────────────────────────────────────────────────────────────
  const engine = new BrainForge.GameEngine({
    gameId: 'choice-reaction-time',
    totalLevels: 30,
    passThreshold: 80,
    onGameStart: function (levelNumber) {
      startLevel(levelNumber);
    }
  });

  // ── State ────────────────────────────────────────────────────────────────────
  let state = {
    level: 1,
    cfg: null,
    trialIndex: 0,
    stimulusDir: null,
    stimulusTime: null,
    awaitingResponse: false,
    results: [],          // {correct, rt}
    fpTimer: null,
    trialTimer: null,
    distractorDir: null
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function dirSymbol(dir, type) {
    if (type === 'circles') return dir; // handled by CSS class
    const map = { left: '←', right: '→', up: '↑', down: '↓' };
    return map[dir] || '←';
  }

  // ── DOM builders ─────────────────────────────────────────────────────────────
  function buildScreen() {
    const area = document.getElementById('game-area');
    const cfg = state.cfg;
    const fourChoice = cfg.choices.length === 4;

    let choiceHints = '';
    if (cfg.type === 'circles') {
      choiceHints = `
        <div class="crt-choice-indicator">
          <span>
            <span class="key-hint">← Left</span>
            <span style="color:#3B82F6;">Blue circle</span>
          </span>
          <span>
            <span class="key-hint">Right →</span>
            <span style="color:#EF4444;">Red circle</span>
          </span>
        </div>`;
    } else if (!fourChoice) {
      choiceHints = `
        <div class="crt-choice-indicator">
          <span>
            <span class="key-hint">← Left key</span>
            <span>for ←</span>
          </span>
          <span>
            <span class="key-hint">Right key →</span>
            <span>for →</span>
          </span>
        </div>`;
    } else {
      choiceHints = `
        <div class="crt-choice-indicator">
          <span><span class="key-hint">← </span><span>Left</span></span>
          <span><span class="key-hint"> →</span><span>Right</span></span>
          <span><span class="key-hint"> ↑ </span><span>Up</span></span>
          <span><span class="key-hint"> ↓ </span><span>Down</span></span>
        </div>`;
    }

    let buttons = '';
    cfg.choices.forEach(function (dir) {
      const sym = { left: '←', right: '→', up: '↑', down: '↓' }[dir];
      buttons += `<button class="choice-btn" data-dir="${dir}" aria-label="${dir}">${sym}</button>`;
    });

    area.innerHTML = `
      <div class="crt-screen">
        <div class="crt-progress-row">
          Trial <strong id="crt-trial-num">0</strong> / <strong>${cfg.n}</strong>
          &nbsp;|&nbsp; Correct: <strong id="crt-correct-count">0</strong>
        </div>
        ${choiceHints}
        <div class="crt-stimulus-wrap">
          <div class="crt-fixation" id="crt-fixation">+</div>
          <div class="crt-stimulus" id="crt-stimulus" style="display:none;"></div>
        </div>
        <div class="crt-result" id="crt-result"></div>
        <div class="crt-buttons" id="crt-buttons">${buttons}</div>
        <div class="crt-wait" id="crt-wait">Get ready…</div>
      </div>`;

    document.getElementById('crt-buttons').addEventListener('click', function (e) {
      const btn = e.target.closest('.choice-btn');
      if (btn) handleResponse(btn.dataset.dir);
    });
  }

  // ── Trial logic ──────────────────────────────────────────────────────────────
  function startLevel(levelNum) {
    state.level = levelNum;
    state.cfg = LEVELS[levelNum - 1];
    state.trialIndex = 0;
    state.results = [];
    state.awaitingResponse = false;
    buildScreen();
    clearTimers();
    setTimeout(nextTrial, 600);
  }

  function nextTrial() {
    if (state.trialIndex >= state.cfg.n) {
      endLevel();
      return;
    }
    state.awaitingResponse = false;
    state.stimulusDir = null;
    state.distractorDir = null;

    const fixation = document.getElementById('crt-fixation');
    const stimulus = document.getElementById('crt-stimulus');
    const result = document.getElementById('crt-result');
    const wait = document.getElementById('crt-wait');

    if (!fixation) return;

    fixation.style.display = 'block';
    stimulus.style.display = 'none';
    stimulus.className = 'crt-stimulus';
    stimulus.textContent = '';
    result.textContent = '';
    result.className = 'crt-result';
    wait.textContent = 'Wait for stimulus…';

    const fp = rand(state.cfg.fpMin, state.cfg.fpMax);
    state.fpTimer = setTimeout(showStimulus, fp);
  }

  function showStimulus() {
    const cfg = state.cfg;
    const dir = pick(cfg.choices);
    state.stimulusDir = dir;
    state.stimulusTime = performance.now();
    state.awaitingResponse = true;

    const fixation = document.getElementById('crt-fixation');
    const stimulus = document.getElementById('crt-stimulus');
    const wait = document.getElementById('crt-wait');

    if (!fixation) return;

    fixation.style.display = 'none';
    stimulus.style.display = '';
    wait.textContent = 'Respond!';

    if (cfg.type === 'circles') {
      stimulus.classList.add('circle');
      stimulus.classList.add(dir === 'left' ? 'blue' : 'red');
    } else if (cfg.type === 'arrows4d') {
      // show target with a distractor flanker (different direction)
      const others = cfg.choices.filter(function (c) { return c !== dir; });
      const distractor = pick(others);
      state.distractorDir = distractor;
      const dSym = dirSymbol(distractor, cfg.type);
      const tSym = dirSymbol(dir, cfg.type);
      stimulus.classList.add('arrow');
      stimulus.innerHTML = `<span style="opacity:0.45;font-size:0.55em;">${dSym}</span>${tSym}<span style="opacity:0.45;font-size:0.55em;">${dSym}</span>`;
    } else {
      stimulus.classList.add('arrow');
      stimulus.textContent = dirSymbol(dir, cfg.type);
    }

    // Deadline — if no response within threshold + 300ms, mark too slow
    const deadline = cfg.threshold + 300;
    state.trialTimer = setTimeout(function () {
      if (state.awaitingResponse) {
        recordResult(false, null);
        showFeedback(null, false, true);
        advance();
      }
    }, deadline);
  }

  function handleResponse(dir) {
    if (!state.awaitingResponse) return;
    const rt = performance.now() - state.stimulusTime;
    state.awaitingResponse = false;
    clearTimeout(state.trialTimer);

    const correct = dir === state.stimulusDir;
    const withinThreshold = correct && rt <= state.cfg.threshold;

    if (correct) {
      BrainForge.Audio.correct();
    } else {
      BrainForge.Audio.wrong();
    }

    recordResult(withinThreshold, rt);
    showFeedback(rt, correct, false);
    advance();
  }

  function recordResult(passed, rt) {
    state.results.push({ passed: passed, rt: rt });
    const correctCount = state.results.filter(function (r) { return r.passed; }).length;
    const trialNumEl = document.getElementById('crt-trial-num');
    const correctEl = document.getElementById('crt-correct-count');
    if (trialNumEl) trialNumEl.textContent = state.trialIndex + 1;
    if (correctEl) correctEl.textContent = correctCount;
    state.trialIndex++;
  }

  function showFeedback(rt, correct, tooSlow) {
    const result = document.getElementById('crt-result');
    if (!result) return;
    if (tooSlow) {
      result.textContent = 'Too slow!';
      result.className = 'crt-result too-slow';
    } else if (!correct) {
      result.textContent = 'Wrong!';
      result.className = 'crt-result wrong';
    } else {
      result.textContent = Math.round(rt) + ' ms';
      result.className = 'crt-result correct';
    }
  }

  function advance() {
    const gap = 450;
    setTimeout(nextTrial, gap);
  }

  // ── Level end ────────────────────────────────────────────────────────────────
  function endLevel() {
    clearTimers();
    const results = state.results;
    const n = results.length;
    const passed = results.filter(function (r) { return r.passed; }).length;
    const pct = Math.round((passed / n) * 100);

    const rtsValid = results.filter(function (r) { return r.rt !== null && r.rt > 0; });
    const meanRT = rtsValid.length
      ? Math.round(rtsValid.reduce(function (s, r) { return s + r.rt; }, 0) / rtsValid.length)
      : null;
    const bestRT = rtsValid.length
      ? Math.round(Math.min.apply(null, rtsValid.map(function (r) { return r.rt; })))
      : null;

    const area = document.getElementById('game-area');
    if (!area) return;

    area.innerHTML = `
      <div class="crt-screen">
        <div class="crt-summary">
          <h3>Level ${state.level} Complete</h3>
          <div class="stat-row">
            <div class="stat"><span class="stat__val">${pct}%</span><span class="stat__lbl">Score</span></div>
            ${meanRT !== null ? `<div class="stat"><span class="stat__val">${meanRT} ms</span><span class="stat__lbl">Mean RT</span></div>` : ''}
            ${bestRT !== null ? `<div class="stat"><span class="stat__val">${bestRT} ms</span><span class="stat__lbl">Best RT</span></div>` : ''}
            <div class="stat"><span class="stat__val">${passed}/${n}</span><span class="stat__lbl">Under Threshold</span></div>
          </div>
          <p style="color:var(--text-secondary);font-size:13px;margin-top:8px;">
            Threshold: ${state.cfg.threshold} ms
          </p>
        </div>
      </div>`;

    engine.updateScore(pct);
    engine.completeLevel(pct);
  }

  // ── Keyboard support ─────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.awaitingResponse) return;
    const map = {
      ArrowLeft: 'left', ArrowRight: 'right',
      ArrowUp: 'up', ArrowDown: 'down'
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      handleResponse(dir);
    }
  }

  document.addEventListener('keydown', onKeyDown);

  function clearTimers() {
    clearTimeout(state.fpTimer);
    clearTimeout(state.trialTimer);
    state.fpTimer = null;
    state.trialTimer = null;
  }

  injectStyles();
})();
