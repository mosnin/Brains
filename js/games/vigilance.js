(function () {
  'use strict';

  // ── Inject game-specific styles ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .vig-stimulus {
      font-size: 80px;
      font-weight: 700;
      color: var(--text-primary);
      text-align: center;
      line-height: 1;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -2px;
      transition: opacity 0.06s ease;
      user-select: none;
    }
    .vig-stimulus--blank {
      opacity: 0;
    }
    .vig-btn {
      display: block;
      margin: 24px auto 0;
      padding: 18px 48px;
      font-size: 1.1rem;
      font-weight: 600;
      background: var(--primary-500);
      color: #fff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      letter-spacing: 0.04em;
      transition: transform 0.08s, background 0.1s;
      touch-action: manipulation;
    }
    .vig-btn:active {
      transform: scale(0.95);
    }
    .vig-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .vig-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 28px;
    }
    .vig-stat {
      background: var(--bg-elevated);
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
    }
    .vig-stat__label {
      font-size: 0.72rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 4px;
    }
    .vig-stat__value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .vig-stat--hit .vig-stat__value { color: var(--success); }
    .vig-stat--miss .vig-stat__value { color: var(--error); }
    .vig-stat--fa .vig-stat__value { color: #F59E0B; }
    .vig-instructions {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin-top: 16px;
      line-height: 1.5;
    }
    .vig-instructions strong {
      color: var(--text-primary);
    }
    .vig-trial-progress {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.8rem;
      margin-top: 12px;
    }
  `;
  document.head.appendChild(style);

  // ── Level configuration ───────────────────────────────────────────────────────
  const LEVELS = (function () {
    const cfg = [];
    const push = (from, to, trials, isi, freq) => {
      for (let i = from; i <= to; i++) cfg.push({ trials, isi, freq });
    };
    push(1,  3,  50, 1500, 0.20);
    push(4,  6,  60, 1200, 0.15);
    push(7,  9,  70, 1000, 0.12);
    push(10, 12, 80,  900, 0.10);
    push(13, 15, 80,  800, 0.10);
    push(16, 18, 90,  700, 0.08);
    push(19, 21, 100, 650, 0.08);
    push(22, 24, 100, 600, 0.08);
    push(25, 27, 120, 550, 0.06);
    push(28, 30, 120, 500, 0.06);
    return cfg;
  }());

  // ── Game state ────────────────────────────────────────────────────────────────
  let engine = null;
  let state = {};

  function resetState(levelIndex) {
    const cfg = LEVELS[levelIndex];
    state = {
      cfg,
      sequence: [],
      currentTrial: 0,
      responded: false,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      running: false,
      stimulusTimer: null,
      isiTimer: null,
      currentDigit: null,
      stimulusVisible: false,
    };
  }

  // ── Generate trial sequence ───────────────────────────────────────────────────
  function generateSequence(totalTrials, targetFreq) {
    const seq = [];
    const targetCount = Math.max(2, Math.round(totalTrials * targetFreq));
    const targetPositions = new Set();

    // Ensure targets never on first 3 trials
    while (targetPositions.size < targetCount) {
      const pos = Math.floor(Math.random() * (totalTrials - 3)) + 3;
      targetPositions.add(pos);
    }

    for (let i = 0; i < totalTrials; i++) {
      if (targetPositions.has(i)) {
        seq.push(0);
      } else {
        // Non-zero digit (1-9)
        seq.push(Math.floor(Math.random() * 9) + 1);
      }
    }
    return seq;
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────────
  function getArea() { return document.getElementById('game-area'); }

  function renderGameUI() {
    const area = getArea();
    area.innerHTML = `
      <div class="problem-display">
        <div class="vig-stimulus vig-stimulus--blank" id="vig-digit">0</div>
        <p class="vig-instructions">Press <strong>SPACE</strong> or tap <strong>RESPOND</strong> only when you see the digit <strong>0</strong></p>
        <p class="vig-trial-progress" id="vig-progress">Trial 0 / ${state.cfg.trials}</p>
        <button class="vig-btn" id="vig-btn" disabled>RESPOND</button>
        <div class="vig-stats">
          <div class="vig-stat vig-stat--hit">
            <span class="vig-stat__label">Hits</span>
            <span class="vig-stat__value" id="vig-hits">0</span>
          </div>
          <div class="vig-stat vig-stat--miss">
            <span class="vig-stat__label">Misses</span>
            <span class="vig-stat__value" id="vig-misses">0</span>
          </div>
          <div class="vig-stat vig-stat--fa">
            <span class="vig-stat__label">False Alarms</span>
            <span class="vig-stat__value" id="vig-fa">0</span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('vig-btn').addEventListener('click', onRespond);
  }

  function updateStats() {
    const h = document.getElementById('vig-hits');
    const m = document.getElementById('vig-misses');
    const fa = document.getElementById('vig-fa');
    const prog = document.getElementById('vig-progress');
    if (h) h.textContent = state.hits;
    if (m) m.textContent = state.misses;
    if (fa) fa.textContent = state.falseAlarms;
    if (prog) prog.textContent = `Trial ${state.currentTrial} / ${state.cfg.trials}`;
  }

  // ── Trial logic ───────────────────────────────────────────────────────────────
  function startNextTrial() {
    if (!state.running) return;

    const { currentTrial, cfg, sequence } = state;

    if (currentTrial >= cfg.trials) {
      endGame();
      return;
    }

    state.responded = false;
    state.currentDigit = sequence[currentTrial];
    state.stimulusVisible = true;

    const digitEl = document.getElementById('vig-digit');
    const btn = document.getElementById('vig-btn');

    if (digitEl) {
      digitEl.textContent = state.currentDigit;
      digitEl.classList.remove('vig-stimulus--blank');
    }
    if (btn) btn.disabled = false;

    // Stimulus display duration: 200ms then blank, then ISI gap
    const stimDuration = Math.min(200, cfg.isi * 0.25);
    state.stimulusTimer = setTimeout(() => {
      if (digitEl) digitEl.classList.add('vig-stimulus--blank');
      state.stimulusVisible = false;

      // Score the previous trial outcome at end of stimulus
      if (state.currentDigit === 0 && !state.responded) {
        state.misses++;
        if (BrainForge.Audio) BrainForge.Audio.wrong();
      }

      updateStats();

      const isiRemaining = cfg.isi - stimDuration;
      state.isiTimer = setTimeout(() => {
        state.currentTrial++;
        startNextTrial();
      }, Math.max(50, isiRemaining));

    }, stimDuration);
  }

  function onRespond() {
    if (!state.running || state.responded) return;
    state.responded = true;

    const btn = document.getElementById('vig-btn');
    if (btn) btn.disabled = true;

    if (state.currentDigit === 0) {
      state.hits++;
      if (BrainForge.Audio) BrainForge.Audio.correct();
    } else {
      state.falseAlarms++;
      if (BrainForge.Audio) BrainForge.Audio.wrong();
    }
    updateStats();
  }

  function onKeyDown(e) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      onRespond();
    }
  }

  function endGame() {
    state.running = false;
    clearTimeout(state.stimulusTimer);
    clearTimeout(state.isiTimer);
    document.removeEventListener('keydown', onKeyDown);

    const { hits, misses, falseAlarms, cfg } = state;
    const totalTargets = state.sequence.filter(d => d === 0).length;
    const totalNonTargets = cfg.trials - totalTargets;
    const correctRejections = totalNonTargets - falseAlarms;
    const total = cfg.trials;
    const score = Math.round(((hits + Math.max(0, correctRejections)) / total) * 100);

    engine.completeLevel(score);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  function cleanupGame() {
    state.running = false;
    clearTimeout(state.stimulusTimer);
    clearTimeout(state.isiTimer);
    document.removeEventListener('keydown', onKeyDown);
  }

  // ── Engine init ───────────────────────────────────────────────────────────────
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: 'vigilance',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart(levelNumber) {
        const levelIndex = levelNumber - 1;
        resetState(levelIndex);
        state.sequence = generateSequence(state.cfg.trials, state.cfg.freq);
        state.running = true;

        renderGameUI();
        updateStats();
        document.addEventListener('keydown', onKeyDown);

        // Brief ready delay
        setTimeout(() => {
          startNextTrial();
        }, 600);
      },
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
