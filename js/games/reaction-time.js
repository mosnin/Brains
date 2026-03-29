(function () {
  'use strict';

  // ── Inject styles ──────────────────────────────────────────────────────────
  const CSS = `
    #game-area {
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .rt-screen {
      width: 100%;
      min-height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      cursor: crosshair;
      border-radius: 14px;
      background: var(--bg-surface);
      position: relative;
      user-select: none;
      gap: 16px;
      padding: 24px;
      box-sizing: border-box;
    }

    .rt-screen--wait {
      background: #0B1120;
    }
    .rt-screen--ready {
      background: #0B1120;
    }
    .rt-screen--go {
      background: #0B1120;
      cursor: crosshair;
    }
    .rt-screen--early {
      background: #1a0a0a;
    }

    .rt-fixation {
      font-size: 3rem;
      color: rgba(241, 245, 249, 0.35);
      line-height: 1;
      pointer-events: none;
    }

    .rt-stimulus {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #22C55E;
      box-shadow: 0 0 40px rgba(34,197,94,0.55);
      animation: rt-pop 0.08s ease-out;
    }
    @keyframes rt-pop {
      from { transform: scale(0.7); opacity: 0.5; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .rt-instruction {
      color: var(--text-secondary);
      font-size: 0.95rem;
      text-align: center;
      pointer-events: none;
    }
    .rt-instruction strong { color: var(--text-primary); }

    .rt-result {
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent-500);
      text-align: center;
    }
    .rt-result .rt-result-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .rt-result .rt-result-tag {
      display: inline-block;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 6px;
      font-weight: 600;
    }
    .rt-result .rt-result-tag.pass { background: rgba(34,197,94,0.15); color: var(--success); }
    .rt-result .rt-result-tag.fail { background: rgba(239,68,68,0.15);  color: var(--error); }
    .rt-result .rt-result-tag.early { background: rgba(245,158,11,0.15); color: var(--warning); }

    .rt-trial-counter {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .rt-early-msg {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--warning);
      text-align: center;
    }

    /* ── Summary panel ── */
    .rt-summary {
      width: 100%;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-sizing: border-box;
    }
    .rt-summary h3 { margin: 0; font-size: 1.3rem; }

    .rt-stats-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .rt-stat-box {
      background: var(--bg-elevated);
      border-radius: 10px;
      padding: 10px 18px;
      text-align: center;
      min-width: 90px;
    }
    .rt-stat-box .rt-stat-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--accent-500);
    }
    .rt-stat-box .rt-stat-lbl {
      font-size: 0.72rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rt-big-score {
      font-size: 3rem;
      font-weight: 800;
      color: var(--primary-500);
      line-height: 1;
    }
    .rt-score-label { font-size: 0.9rem; color: var(--text-secondary); }

    /* ── Bar chart ── */
    .rt-bar-chart {
      width: 100%;
      max-width: 480px;
    }
    .rt-bar-chart-title {
      font-size: 0.78rem;
      color: var(--text-secondary);
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: 0.04em;
    }
    .rt-bars {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 80px;
      background: var(--bg-surface);
      border-radius: 8px;
      padding: 8px 6px 0;
      box-sizing: border-box;
    }
    .rt-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .rt-bar {
      width: 100%;
      border-radius: 3px 3px 0 0;
      min-height: 2px;
      transition: height 0.4s ease;
    }
    .rt-bar.pass   { background: var(--success); }
    .rt-bar.fail   { background: var(--error); }
    .rt-bar.early  { background: var(--warning); }
    .rt-threshold-line {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-align: center;
      margin-top: 4px;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── Level config ───────────────────────────────────────────────────────────
  const LEVEL_CONFIGS = [
    { n: 20, fpMin: 2000, fpMax: 4000, threshold: 800 },   // L1
    { n: 20, fpMin: 2000, fpMax: 4000, threshold: 750 },   // L2
    { n: 20, fpMin: 1500, fpMax: 3500, threshold: 700 },   // L3
    { n: 20, fpMin: 1500, fpMax: 3500, threshold: 650 },   // L4
    { n: 20, fpMin: 1500, fpMax: 4000, threshold: 630 },   // L5
    { n: 20, fpMin: 1000, fpMax: 3000, threshold: 600 },   // L6
    { n: 20, fpMin: 1000, fpMax: 4000, threshold: 580 },   // L7
    { n: 20, fpMin: 1000, fpMax: 4000, threshold: 560 },   // L8
    { n: 20, fpMin: 1000, fpMax: 4500, threshold: 540 },   // L9
    { n: 20, fpMin: 1000, fpMax: 4500, threshold: 520 },   // L10
    { n: 20, fpMin:  800, fpMax: 4000, threshold: 510 },   // L11
    { n: 20, fpMin:  800, fpMax: 4000, threshold: 500 },   // L12
    { n: 20, fpMin:  800, fpMax: 5000, threshold: 490 },   // L13
    { n: 20, fpMin:  800, fpMax: 5000, threshold: 480 },   // L14
    { n: 20, fpMin:  600, fpMax: 4000, threshold: 470 },   // L15
    { n: 20, fpMin:  600, fpMax: 5000, threshold: 460 },   // L16
    { n: 20, fpMin:  600, fpMax: 5000, threshold: 450 },   // L17
    { n: 20, fpMin:  500, fpMax: 5000, threshold: 440 },   // L18
    { n: 20, fpMin:  500, fpMax: 5000, threshold: 430 },   // L19
    { n: 20, fpMin:  500, fpMax: 5000, threshold: 420 },   // L20
    { n: 20, fpMin:  400, fpMax: 5000, threshold: 415 },   // L21
    { n: 20, fpMin:  400, fpMax: 5000, threshold: 410 },   // L22
    { n: 20, fpMin:  400, fpMax: 6000, threshold: 405 },   // L23
    { n: 20, fpMin:  400, fpMax: 6000, threshold: 400 },   // L24
    { n: 20, fpMin:  300, fpMax: 6000, threshold: 395 },   // L25
    { n: 20, fpMin:  300, fpMax: 6000, threshold: 390 },   // L26
    { n: 20, fpMin:  300, fpMax: 6000, threshold: 385 },   // L27
    { n: 20, fpMin:  200, fpMax: 6000, threshold: 380 },   // L28
    { n: 20, fpMin:  200, fpMax: 6000, threshold: 375 },   // L29
    { n: 20, fpMin:  200, fpMax: 6000, threshold: 370 },   // L30
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  let engine;
  let currentLevel = 1;
  let cfg;
  let trialIndex = 0;
  let trialResults = []; // { rt, early, pass }
  let stimulusTimeout = null;
  let stimulusShownAt = null;
  let phase = 'idle'; // idle | waiting | stimulus | result | done

  const EARLY_PENALTY = 500; // ms added to RT on false start

  // ── Engine init ────────────────────────────────────────────────────────────
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: 'reaction-time',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: startLevel,
    });
  }

  // ── Start level ────────────────────────────────────────────────────────────
  function startLevel(level) {
    currentLevel = level;
    cfg = LEVEL_CONFIGS[level - 1];
    trialIndex = 0;
    trialResults = [];
    phase = 'idle';
    renderScreen('ready');
  }

  // ── Render states ──────────────────────────────────────────────────────────
  function renderScreen(state, extraData) {
    const area = document.getElementById('game-area');
    if (!area) return;

    if (state === 'ready') {
      area.innerHTML = `
        <div class="rt-screen rt-screen--ready" id="rt-screen">
          <div class="rt-fixation">+</div>
          <div class="rt-instruction">
            <strong>Click</strong> or press <strong>SPACE</strong> when the green circle appears.<br>
            Don't click before it appears — false starts are penalised.
          </div>
          <div class="rt-trial-counter">Trial ${trialIndex + 1} of ${cfg.n}</div>
          <button class="btn btn--primary" id="rt-start-btn" style="margin-top:8px">Start Trial</button>
        </div>
      `;
      document.getElementById('rt-start-btn').addEventListener('click', beginTrial);
      phase = 'ready';

    } else if (state === 'wait') {
      area.innerHTML = `
        <div class="rt-screen rt-screen--wait" id="rt-screen">
          <div class="rt-fixation">+</div>
          <div class="rt-instruction">Wait for the green circle…</div>
          <div class="rt-trial-counter">Trial ${trialIndex + 1} of ${cfg.n}</div>
        </div>
      `;
      attachClickListener();

    } else if (state === 'stimulus') {
      area.innerHTML = `
        <div class="rt-screen rt-screen--go" id="rt-screen">
          <div class="rt-stimulus" id="rt-stimulus"></div>
          <div class="rt-instruction"><strong>Click now!</strong></div>
          <div class="rt-trial-counter">Trial ${trialIndex + 1} of ${cfg.n}</div>
        </div>
      `;
      attachClickListener();

    } else if (state === 'result') {
      const { rt, early, pass } = extraData;
      let displayRT, tag, tagClass;
      if (early) {
        displayRT = rt;
        tag = 'Too Early! +500ms penalty';
        tagClass = 'early';
      } else {
        displayRT = rt;
        tag = pass ? `Under ${cfg.threshold}ms ✓` : `Over ${cfg.threshold}ms ✗`;
        tagClass = pass ? 'pass' : 'fail';
      }

      area.innerHTML = `
        <div class="rt-screen rt-screen--ready" id="rt-screen">
          <div class="rt-result">
            <span class="rt-result-label">REACTION TIME</span>
            ${displayRT} ms
            <span class="rt-result-tag ${tagClass}">${tag}</span>
          </div>
          <div class="rt-trial-counter">Trial ${trialIndex} of ${cfg.n}</div>
          <button class="btn btn--primary" id="rt-next-btn" style="margin-top:8px">
            ${trialIndex < cfg.n ? 'Next Trial' : 'See Results'}
          </button>
        </div>
      `;
      document.getElementById('rt-next-btn').addEventListener('click', () => {
        if (trialIndex < cfg.n) {
          beginTrial();
        } else {
          endLevel();
        }
      });

    } else if (state === 'early') {
      area.innerHTML = `
        <div class="rt-screen rt-screen--early" id="rt-screen">
          <div class="rt-early-msg">⚠ Too early! +500ms penalty</div>
          <div class="rt-trial-counter">Trial ${trialIndex} of ${cfg.n}</div>
          <button class="btn btn--primary" id="rt-next-btn" style="margin-top:16px">
            ${trialIndex < cfg.n ? 'Next Trial' : 'See Results'}
          </button>
        </div>
      `;
      document.getElementById('rt-next-btn').addEventListener('click', () => {
        if (trialIndex < cfg.n) {
          beginTrial();
        } else {
          endLevel();
        }
      });
    }
  }

  function attachClickListener() {
    const screen = document.getElementById('rt-screen');
    if (!screen) return;
    screen.addEventListener('click', onScreenClick, { once: true });
  }

  // ── Trial flow ─────────────────────────────────────────────────────────────
  function beginTrial() {
    phase = 'waiting';
    renderScreen('wait');

    const fp = cfg.fpMin + Math.random() * (cfg.fpMax - cfg.fpMin);
    stimulusShownAt = null;

    stimulusTimeout = setTimeout(() => {
      if (phase !== 'waiting') return;
      phase = 'stimulus';
      stimulusShownAt = performance.now();
      renderScreen('stimulus');
    }, fp);
  }

  function onScreenClick() {
    if (phase === 'waiting') {
      // False start
      clearTimeout(stimulusTimeout);
      const penalisedRT = EARLY_PENALTY;
      const result = { rt: penalisedRT, early: true, pass: false };
      trialResults.push(result);
      trialIndex++;
      phase = 'result';
      BrainForge.Audio.wrong();
      updateEngineScore();
      renderScreen('early');
      return;
    }

    if (phase === 'stimulus') {
      const now = performance.now();
      const raw = Math.round(now - stimulusShownAt);
      const pass = raw <= cfg.threshold;
      const result = { rt: raw, early: false, pass };
      trialResults.push(result);
      trialIndex++;
      phase = 'result';
      if (pass) {
        BrainForge.Audio.correct();
      } else {
        BrainForge.Audio.wrong();
      }
      updateEngineScore();
      renderScreen('result', result);
    }
  }

  function updateEngineScore() {
    const passCount = trialResults.filter(r => r.pass).length;
    const pct = Math.round((passCount / trialResults.length) * 100);
    engine.updateScore(pct);
  }

  // ── End level ──────────────────────────────────────────────────────────────
  function endLevel() {
    const area = document.getElementById('game-area');
    const passCount = trialResults.filter(r => r.pass).length;
    const score = Math.round((passCount / trialResults.length) * 100);

    const rts = trialResults.map(r => r.rt);
    const mean = Math.round(rts.reduce((a, b) => a + b, 0) / rts.length);
    const sorted = [...rts].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)];
    const best = sorted[0];

    // Bar chart
    const maxRT = Math.max(...rts, cfg.threshold * 1.2);
    const barsHTML = trialResults.map((r, i) => {
      const heightPct = Math.min(100, (r.rt / maxRT) * 100);
      const cls = r.early ? 'early' : (r.pass ? 'pass' : 'fail');
      return `<div class="rt-bar-wrap"><div class="rt-bar ${cls}" style="height:${heightPct}%" title="Trial ${i+1}: ${r.rt}ms"></div></div>`;
    }).join('');

    area.innerHTML = `
      <div class="rt-summary">
        <h3>Level ${currentLevel} Results</h3>
        <div class="rt-big-score">${score}%</div>
        <div class="rt-score-label">${passCount} of ${cfg.n} trials under ${cfg.threshold}ms</div>
        <div class="rt-stats-row">
          <div class="rt-stat-box">
            <div class="rt-stat-val">${mean}</div>
            <div class="rt-stat-lbl">Mean RT</div>
          </div>
          <div class="rt-stat-box">
            <div class="rt-stat-val">${median}</div>
            <div class="rt-stat-lbl">Median RT</div>
          </div>
          <div class="rt-stat-box">
            <div class="rt-stat-val">${best}</div>
            <div class="rt-stat-lbl">Best RT</div>
          </div>
        </div>
        <div class="rt-bar-chart">
          <div class="rt-bar-chart-title">Trial-by-trial RTs (green = pass, red = fail, yellow = false start)</div>
          <div class="rt-bars">${barsHTML}</div>
          <div class="rt-threshold-line">Threshold: ${cfg.threshold}ms</div>
        </div>
      </div>
    `;

    engine.completeLevel(score);
    BrainForge.Audio.levelUp();
  }

  // ── Keyboard support ───────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (phase === 'waiting' || phase === 'stimulus') {
        const screen = document.getElementById('rt-screen');
        if (screen) screen.click();
      }
    }
  });

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
