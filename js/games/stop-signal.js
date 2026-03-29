(function () {
  'use strict';

  // ── Injected styles ──────────────────────────────────────────────────────────
  const STYLE = `
    .ss-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 360px;
      gap: 20px;
      padding: 24px 16px;
    }
    .ss-stimulus-wrap {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ss-fixation {
      font-size: 48px;
      color: var(--text-secondary);
      opacity: 0.5;
      line-height: 1;
      position: absolute;
    }
    .ss-go-stimulus {
      font-size: 96px;
      line-height: 1;
      color: var(--text-primary);
      user-select: none;
      position: absolute;
      display: none;
    }
    .ss-go-stimulus.left  { color: #3B82F6; }
    .ss-go-stimulus.right { color: #34D399; }
    .ss-stop-signal {
      position: absolute;
      font-size: 80px;
      line-height: 1;
      color: #EF4444;
      font-weight: 900;
      display: none;
      user-select: none;
      filter: drop-shadow(0 0 16px rgba(239,68,68,0.7));
      animation: ss-flash 0.12s ease-in-out;
    }
    @keyframes ss-flash {
      0%   { transform: scale(0.7); opacity: 0; }
      60%  { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .ss-buttons {
      display: flex;
      gap: 20px;
    }
    .ss-buttons .choice-btn {
      min-width: 90px;
      font-size: 28px;
      padding: 14px 20px;
      border-radius: 12px;
      border: 2px solid var(--bg-elevated);
      background: var(--bg-surface);
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.08s;
      user-select: none;
    }
    .ss-buttons .choice-btn:hover { background: var(--bg-elevated); border-color: var(--primary-500); }
    .ss-buttons .choice-btn:active { transform: scale(0.93); }
    .ss-buttons .choice-btn[data-dir="left"]  { border-left: 4px solid #3B82F6; }
    .ss-buttons .choice-btn[data-dir="right"] { border-right: 4px solid #34D399; }
    .ss-feedback {
      min-height: 26px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
    }
    .ss-feedback.go-correct     { color: var(--success); }
    .ss-feedback.go-wrong       { color: var(--error); }
    .ss-feedback.go-miss        { color: #F59E0B; }
    .ss-feedback.stop-success   { color: var(--accent-500); }
    .ss-feedback.stop-fail      { color: var(--error); }
    .ss-stats {
      display: flex;
      gap: 28px;
      font-size: 13px;
      color: var(--text-secondary);
      flex-wrap: wrap;
      justify-content: center;
    }
    .ss-stats .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .ss-stats .stat__val { font-size: 17px; font-weight: 700; color: var(--text-primary); }
    .ss-ssd-bar-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-secondary);
    }
    .ss-ssd-bar-bg {
      width: 120px;
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 99px;
      overflow: hidden;
    }
    .ss-ssd-bar {
      height: 100%;
      background: var(--accent-500);
      border-radius: 99px;
      transition: width 0.3s ease;
    }
    .ss-progress-row {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .ss-progress-row strong { color: var(--text-primary); }
    .ss-trial-type {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid transparent;
    }
    .ss-trial-type.go   { color: var(--success); border-color: rgba(34,197,94,0.3); }
    .ss-trial-type.stop { color: #EF4444; border-color: rgba(239,68,68,0.3); }
    .ss-summary { text-align: center; padding: 8px 0; }
    .ss-summary h3 { font-size: 18px; margin-bottom: 12px; color: var(--text-primary); }
    .ss-summary .stat-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
    .ss-summary .stat__val { font-size: 24px; font-weight: 700; color: var(--accent-500); }
    .ss-summary .stat__lbl { font-size: 12px; color: var(--text-secondary); }
    .ss-hint {
      font-size: 12px;
      color: var(--text-secondary);
      text-align: center;
      max-width: 320px;
    }
  `;

  function injectStyles() {
    if (document.getElementById('ss-styles')) return;
    const s = document.createElement('style');
    s.id = 'ss-styles';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ── Level config ─────────────────────────────────────────────────────────────
  // Each entry: { n, goPct, initSSD, trialMs }
  const LEVELS = (function () {
    const cfg = [];
    const rows = [
      [3,  40, 0.75, 250, 2000],
      [3,  40, 0.75, 200, 1800],
      [3,  50, 0.75, 175, 1600],
      [3,  50, 0.75, 150, 1500],
      [3,  50, 0.75, 125, 1400],
      [3,  60, 0.75, 100, 1300],
      [3,  60, 0.75, 75,  1200],
      [3,  70, 0.75, 75,  1100],
      [3,  70, 0.75, 50,  1000],
      [3,  80, 0.75, 50,  900]
    ];
    rows.forEach(function (r) {
      const count = r[0];
      for (let i = 0; i < count; i++) {
        cfg.push({ n: r[1], goPct: r[2], initSSD: r[3], trialMs: r[4] });
      }
    });
    return cfg;
  })();

  // ── Engine init ──────────────────────────────────────────────────────────────
  const engine = new BrainForge.GameEngine({
    gameId: 'stop-signal',
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
    isStopTrial: false,
    stimulusDir: null,
    stimulusTime: null,
    awaitingGo: false,
    ssd: 250,           // current stop-signal delay
    stopTimer: null,    // timer for showing stop signal
    trialDeadline: null,
    fpTimer: null,
    trials: [],         // {type:'go'|'stop', correct:bool, rt:null|number}
    goRTs: []           // valid go RTs for SSRT calculation
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function clearTimers() {
    clearTimeout(state.fpTimer);
    clearTimeout(state.stopTimer);
    clearTimeout(state.trialDeadline);
    state.fpTimer = null;
    state.stopTimer = null;
    state.trialDeadline = null;
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────
  function buildScreen() {
    const area = document.getElementById('game-area');
    const cfg = state.cfg;

    area.innerHTML = `
      <div class="ss-screen">
        <div class="ss-progress-row">
          Trial <strong id="ss-trial-num">0</strong> / <strong>${cfg.n}</strong>
        </div>

        <div class="ss-stats">
          <div class="stat">
            <span class="stat__val" id="ss-go-correct">0</span>
            <span class="stat__lbl">Go Correct</span>
          </div>
          <div class="stat">
            <span class="stat__val" id="ss-stop-success">0</span>
            <span class="stat__lbl">Stops Inhibited</span>
          </div>
          <div class="ss-ssd-bar-wrap">
            <div class="ss-ssd-bar-bg"><div class="ss-ssd-bar" id="ss-ssd-bar" style="width:50%"></div></div>
            <span>SSD: <strong id="ss-ssd-val">${state.ssd}</strong> ms</span>
          </div>
        </div>

        <div class="ss-stimulus-wrap">
          <div class="ss-fixation" id="ss-fixation">+</div>
          <div class="ss-go-stimulus" id="ss-go-stim"></div>
          <div class="ss-stop-signal" id="ss-stop-sig">✕</div>
        </div>

        <div class="ss-feedback" id="ss-feedback"></div>

        <div class="ss-buttons" id="ss-buttons">
          <button class="choice-btn" data-dir="left" aria-label="Left">←</button>
          <button class="choice-btn" data-dir="right" aria-label="Right">→</button>
        </div>

        <p class="ss-hint">Press Left or Right to respond. If you see ✕ — STOP!</p>
      </div>`;

    document.getElementById('ss-buttons').addEventListener('click', function (e) {
      const btn = e.target.closest('.choice-btn');
      if (btn) handleGoResponse(btn.dataset.dir);
    });
  }

  // ── Trial flow ────────────────────────────────────────────────────────────────
  function startLevel(levelNum) {
    state.level = levelNum;
    state.cfg = LEVELS[levelNum - 1];
    state.trialIndex = 0;
    state.trials = [];
    state.goRTs = [];
    state.ssd = state.cfg.initSSD;
    state.awaitingGo = false;
    clearTimers();
    buildScreen();
    setTimeout(nextTrial, 600);
  }

  function nextTrial() {
    if (state.trialIndex >= state.cfg.n) {
      endLevel();
      return;
    }

    state.awaitingGo = false;
    state.stimulusDir = null;
    state.stimulusTime = null;

    const goEl = document.getElementById('ss-go-stim');
    const stopEl = document.getElementById('ss-stop-sig');
    const fixEl = document.getElementById('ss-fixation');
    const fbEl = document.getElementById('ss-feedback');

    if (!goEl) return;

    goEl.style.display = 'none';
    goEl.className = 'ss-go-stimulus';
    stopEl.style.display = 'none';
    if (fixEl) fixEl.style.display = 'block';
    if (fbEl) { fbEl.textContent = ''; fbEl.className = 'ss-feedback'; }

    // Decide trial type
    state.isStopTrial = Math.random() > state.cfg.goPct;

    const fp = rand(600, 1200);
    state.fpTimer = setTimeout(showGoSignal, fp);
  }

  function showGoSignal() {
    const dir = pick(['left', 'right']);
    state.stimulusDir = dir;
    state.stimulusTime = performance.now();
    state.awaitingGo = true;

    const goEl = document.getElementById('ss-go-stim');
    const fixEl = document.getElementById('ss-fixation');

    if (!goEl) return;

    if (fixEl) fixEl.style.display = 'none';
    goEl.className = 'ss-go-stimulus ' + dir;
    goEl.textContent = dir === 'left' ? '←' : '→';
    goEl.style.display = 'block';

    if (state.isStopTrial) {
      // Show stop signal after SSD
      state.stopTimer = setTimeout(showStopSignal, state.ssd);
    }

    // Trial deadline
    state.trialDeadline = setTimeout(function () {
      if (!state.awaitingGo) return;
      state.awaitingGo = false;
      if (state.isStopTrial) {
        // Waited out the trial — stop success
        handleStopOutcome(true);
      } else {
        // Go miss
        recordTrial('go', false, null);
        showFeedback('go-miss', 'Too slow!');
        BrainForge.Audio.wrong();
        advanceTrial();
      }
    }, state.cfg.trialMs);
  }

  function showStopSignal() {
    const stopEl = document.getElementById('ss-stop-sig');
    if (!stopEl) return;
    stopEl.style.display = 'block';
  }

  function handleGoResponse(dir) {
    if (!state.awaitingGo) return;
    const rt = performance.now() - state.stimulusTime;
    state.awaitingGo = false;
    clearTimeout(state.trialDeadline);
    clearTimeout(state.stopTimer);

    const goEl = document.getElementById('ss-go-stim');
    const stopEl = document.getElementById('ss-stop-sig');
    if (goEl) goEl.style.display = 'none';
    if (stopEl) stopEl.style.display = 'none';

    if (state.isStopTrial) {
      // Responded on stop trial — inhibition failure
      handleStopOutcome(false, rt);
    } else {
      // Go trial — check direction
      const correct = dir === state.stimulusDir;
      if (correct) {
        BrainForge.Audio.correct();
        state.goRTs.push(rt);
        recordTrial('go', true, rt);
        showFeedback('go-correct', Math.round(rt) + ' ms');
      } else {
        BrainForge.Audio.wrong();
        recordTrial('go', false, rt);
        showFeedback('go-wrong', 'Wrong direction!');
      }
      advanceTrial();
    }
  }

  function handleStopOutcome(inhibited, rt) {
    clearTimeout(state.trialDeadline);
    clearTimeout(state.stopTimer);

    const goEl = document.getElementById('ss-go-stim');
    const stopEl = document.getElementById('ss-stop-sig');
    if (goEl) goEl.style.display = 'none';
    if (stopEl) stopEl.style.display = 'none';

    if (inhibited) {
      // Successful stop — increase SSD (harder next stop)
      state.ssd = Math.min(state.ssd + 50, state.cfg.trialMs - 100);
      BrainForge.Audio.correct();
      recordTrial('stop', true, null);
      showFeedback('stop-success', 'Stopped! ✓');
    } else {
      // Failed stop — decrease SSD (easier next stop)
      state.ssd = Math.max(state.ssd - 50, 50);
      BrainForge.Audio.wrong();
      recordTrial('stop', false, rt);
      showFeedback('stop-fail', 'Failed to stop!');
    }

    updateSSDBar();
    advanceTrial();
  }

  function recordTrial(type, correct, rt) {
    state.trials.push({ type: type, correct: correct, rt: rt });
    state.trialIndex++;
    updateStats();
  }

  function updateStats() {
    const trialNumEl = document.getElementById('ss-trial-num');
    const goCorrectEl = document.getElementById('ss-go-correct');
    const stopSuccessEl = document.getElementById('ss-stop-success');

    if (trialNumEl) trialNumEl.textContent = state.trialIndex;

    const goCorrect = state.trials.filter(function (t) { return t.type === 'go' && t.correct; }).length;
    const stopSuccess = state.trials.filter(function (t) { return t.type === 'stop' && t.correct; }).length;

    if (goCorrectEl) goCorrectEl.textContent = goCorrect;
    if (stopSuccessEl) stopSuccessEl.textContent = stopSuccess;
  }

  function updateSSDBar() {
    const bar = document.getElementById('ss-ssd-bar');
    const val = document.getElementById('ss-ssd-val');
    const maxSSD = state.cfg.trialMs - 100;
    const pct = Math.min(100, Math.max(0, (state.ssd / maxSSD) * 100));
    if (bar) bar.style.width = pct + '%';
    if (val) val.textContent = state.ssd;
  }

  function showFeedback(cls, msg) {
    const fbEl = document.getElementById('ss-feedback');
    if (!fbEl) return;
    fbEl.className = 'ss-feedback ' + cls;
    fbEl.textContent = msg;
  }

  function advanceTrial() {
    setTimeout(function () {
      const fixEl = document.getElementById('ss-fixation');
      if (fixEl) fixEl.style.display = 'block';
    }, 100);
    setTimeout(nextTrial, 500);
  }

  // ── Level end ────────────────────────────────────────────────────────────────
  function endLevel() {
    clearTimers();

    const trials = state.trials;
    const goTrials   = trials.filter(function (t) { return t.type === 'go'; });
    const stopTrials = trials.filter(function (t) { return t.type === 'stop'; });

    const goCorrect   = goTrials.filter(function (t) { return t.correct; }).length;
    const stopSuccess = stopTrials.filter(function (t) { return t.correct; }).length;
    const total       = trials.length;

    const pct = total > 0 ? Math.round(((goCorrect + stopSuccess) / total) * 100) : 0;

    const goPct   = goTrials.length   > 0 ? Math.round((goCorrect / goTrials.length) * 100)     : 0;
    const stopPct = stopTrials.length > 0 ? Math.round((stopSuccess / stopTrials.length) * 100) : 0;

    // Mean go RT from correct go trials
    const goRTsCorrect = goTrials
      .filter(function (t) { return t.correct && t.rt !== null; })
      .map(function (t) { return t.rt; });

    const meanGoRT = goRTsCorrect.length
      ? Math.round(goRTsCorrect.reduce(function (s, v) { return s + v; }, 0) / goRTsCorrect.length)
      : null;

    // SSRT estimate = mean Go RT - current SSD (tracking method approximation)
    const ssrt = meanGoRT !== null ? Math.max(0, meanGoRT - state.ssd) : null;

    const area = document.getElementById('game-area');
    if (!area) return;

    area.innerHTML = `
      <div class="ss-screen">
        <div class="ss-summary">
          <h3>Level ${state.level} Complete</h3>
          <div class="stat-row">
            <div class="stat"><span class="stat__val">${pct}%</span><span class="stat__lbl">Overall Score</span></div>
            <div class="stat"><span class="stat__val">${goPct}%</span><span class="stat__lbl">Go Accuracy</span></div>
            <div class="stat"><span class="stat__val">${stopPct}%</span><span class="stat__lbl">Inhibition Rate</span></div>
            ${meanGoRT !== null ? `<div class="stat"><span class="stat__val">${meanGoRT} ms</span><span class="stat__lbl">Mean Go RT</span></div>` : ''}
            ${ssrt !== null ? `<div class="stat"><span class="stat__val">${ssrt} ms</span><span class="stat__lbl">Est. SSRT</span></div>` : ''}
          </div>
          <p style="color:var(--text-secondary);font-size:13px;margin-top:4px;">
            Final SSD: ${state.ssd} ms &nbsp;|&nbsp;
            Go trials: ${goTrials.length} &nbsp;|&nbsp;
            Stop trials: ${stopTrials.length}
          </p>
        </div>
      </div>`;

    engine.updateScore(pct);
    engine.completeLevel(pct);
  }

  // ── Keyboard support ─────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.awaitingGo) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); handleGoResponse('left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); handleGoResponse('right'); }
  }

  document.addEventListener('keydown', onKeyDown);

  injectStyles();
})();
