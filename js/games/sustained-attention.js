(function () {
  'use strict';

  /* ── Inject game-specific CSS ───────────────────────────────────────── */
  const STYLE = `
    .sart-rule {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 24px;
    }
    .sart-rule strong { color: var(--text-primary); }
    .sart-rule .sart-no-go {
      color: var(--error);
      font-size: 16px;
    }
    .sart-number {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
      font-weight: 800;
      color: var(--text-primary);
      background: var(--bg-elevated);
      border: 2px solid var(--bg-elevated);
      border-radius: 16px;
      width: 160px;
      height: 160px;
      margin: 0 auto 32px;
      transition: border-color 0.1s, background 0.1s, color 0.1s;
      user-select: none;
    }
    .sart-number--error {
      border-color: var(--error);
      background: rgba(239,68,68,0.15);
      color: var(--error);
    }
    .sart-number--correct {
      border-color: var(--success);
      background: rgba(34,197,94,0.08);
    }
    .sart-btn {
      display: block;
      width: 100%;
      max-width: 320px;
      margin: 0 auto 24px;
      padding: 20px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      background: var(--primary-500);
      color: #fff;
      border: none;
      transition: transform 0.1s, opacity 0.1s;
    }
    .sart-btn:active { transform: scale(0.96); opacity: 0.85; }
    .sart-stats {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .sart-stat {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      text-align: center;
      min-width: 80px;
    }
    .sart-stat span {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }
    #game-area { padding: 24px 16px; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ── Level config ───────────────────────────────────────────────────── */
  const LEVELS = (function () {
    const cfg = [];
    for (let i = 1; i <= 30; i++) {
      let trials, isi, digitDuration;
      if      (i <= 3)  { trials = 36;  isi = 1200; digitDuration = 250; }
      else if (i <= 6)  { trials = 45;  isi = 1000; digitDuration = 250; }
      else if (i <= 9)  { trials = 54;  isi = 900;  digitDuration = 200; }
      else if (i <= 12) { trials = 63;  isi = 800;  digitDuration = 200; }
      else if (i <= 15) { trials = 72;  isi = 700;  digitDuration = 150; }
      else if (i <= 18) { trials = 81;  isi = 650;  digitDuration = 150; }
      else if (i <= 21) { trials = 90;  isi = 600;  digitDuration = 120; }
      else if (i <= 24) { trials = 90;  isi = 550;  digitDuration = 100; }
      else if (i <= 27) { trials = 99;  isi = 500;  digitDuration = 100; }
      else              { trials = 108; isi = 450;  digitDuration = 80;  }
      cfg.push({ level: i, trials, isi, digitDuration });
    }
    return cfg;
  }());

  const NO_GO = 3;
  // ~11 % target: each 9-digit cycle has one "3"
  function buildSequence(numTrials) {
    const seq = [];
    const digits = [1, 2, 4, 5, 6, 7, 8, 9]; // go digits
    let slot = 0;
    while (seq.length < numTrials) {
      // Every 9 stimuli include one NO_GO
      const cycle = [];
      // Place NO_GO at random position within 9
      const noGoPos = Math.floor(Math.random() * 9);
      let goIdx = 0;
      for (let p = 0; p < 9; p++) {
        if (p === noGoPos) {
          cycle.push(NO_GO);
        } else {
          cycle.push(digits[goIdx % digits.length]);
          goIdx++;
        }
      }
      // Shuffle go digits within the cycle (keep NO_GO position fixed)
      // Already random enough — just push
      for (let p = 0; p < cycle.length && seq.length < numTrials; p++) {
        seq.push(cycle[p]);
      }
      slot++;
    }
    return seq;
  }

  /* ── Game state ─────────────────────────────────────────────────────── */
  let engine, currentCfg, sequence, index;
  let correctCount, errorCount, totalSeen;
  let stimulusTimeout, clearTimeout2;
  let responded, currentDigit, running;
  let keyHandler;

  /* ── DOM builders ───────────────────────────────────────────────────── */
  function buildGameArea() {
    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div class="sart-rule">
        Press for <strong>all numbers</strong> except <span class="sart-no-go">3</span>.
        When you see <span class="sart-no-go"><strong>3</strong></span> — do <strong>NOT</strong> press.
      </div>
      <div class="sart-number" id="sart-number"></div>
      <button class="sart-btn" id="sart-btn" aria-label="Respond">PRESS — Not a 3!</button>
      <div class="sart-stats">
        <div class="sart-stat">Correct<span id="sart-correct">0</span></div>
        <div class="sart-stat">Errors<span id="sart-errors">0</span></div>
        <div class="sart-stat">Accuracy<span id="sart-acc">—</span></div>
      </div>
    `;
    document.getElementById('sart-btn').addEventListener('click', handleResponse);
  }

  function updateStats() {
    document.getElementById('sart-correct').textContent = correctCount;
    document.getElementById('sart-errors').textContent  = errorCount;
    const acc = totalSeen > 0 ? Math.round(correctCount / totalSeen * 100) + '%' : '—';
    document.getElementById('sart-acc').textContent = acc;
  }

  /* ── Core game loop ─────────────────────────────────────────────────── */
  function startLevel(level) {
    currentCfg   = LEVELS[level - 1];
    sequence     = buildSequence(currentCfg.trials);
    index        = 0;
    correctCount = 0;
    errorCount   = 0;
    totalSeen    = 0;
    responded    = false;
    running      = true;

    buildGameArea();
    attachKeyHandler();
    scheduleNext();
  }

  function scheduleNext() {
    if (!running) return;
    if (index >= sequence.length) {
      finishLevel();
      return;
    }
    stimulusTimeout = setTimeout(showDigit, 150);
  }

  function showDigit() {
    if (!running) return;
    currentDigit = sequence[index];
    responded    = false;
    totalSeen++;

    const numEl = document.getElementById('sart-number');
    if (!numEl) return;
    numEl.textContent = currentDigit;
    numEl.className   = 'sart-number';

    // Digit visible for digitDuration ms, then blank; response window = full ISI
    clearTimeout2 = setTimeout(function () {
      const el = document.getElementById('sart-number');
      if (el) {
        el.textContent = '';
        el.className   = 'sart-number';
      }
    }, currentCfg.digitDuration);

    // End of ISI — evaluate
    stimulusTimeout = setTimeout(function () {
      evaluateResponse();
    }, currentCfg.isi);
  }

  function handleResponse() {
    if (!running || responded) return;
    responded = true;
    const numEl = document.getElementById('sart-number');

    if (currentDigit === NO_GO) {
      // Commission error — pressed on 3
      errorCount++;
      BrainForge.Audio.wrong();
      if (numEl) numEl.classList.add('sart-number--error');
    } else {
      // Correct go response
      correctCount++;
      BrainForge.Audio.correct();
      if (numEl) numEl.classList.add('sart-number--correct');
    }
    updateStats();
    engine.updateScore(totalSeen > 0 ? Math.round(correctCount / totalSeen * 100) : 0);
  }

  function evaluateResponse() {
    if (!running) return;
    if (!responded) {
      if (currentDigit !== NO_GO) {
        // Omission error — failed to press for a go digit
        errorCount++;
        const numEl = document.getElementById('sart-number');
        if (numEl) numEl.classList.add('sart-number--error');
      } else {
        // Correct rejection — correctly withheld for 3
        correctCount++;
      }
      updateStats();
      engine.updateScore(totalSeen > 0 ? Math.round(correctCount / totalSeen * 100) : 0);
    }
    const numEl = document.getElementById('sart-number');
    if (numEl) {
      numEl.textContent = '';
      numEl.className   = 'sart-number';
    }
    index++;
    scheduleNext();
  }

  function finishLevel() {
    running = false;
    detachKeyHandler();
    clearTimeout(stimulusTimeout);
    clearTimeout(clearTimeout2);

    const pct = totalSeen > 0 ? Math.round(correctCount / totalSeen * 100) : 0;
    engine.completeLevel(pct);
  }

  function stopLevel() {
    running = false;
    clearTimeout(stimulusTimeout);
    clearTimeout(clearTimeout2);
    detachKeyHandler();
  }

  /* ── Keyboard ───────────────────────────────────────────────────────── */
  function attachKeyHandler() {
    detachKeyHandler();
    keyHandler = function (e) {
      if (e.code === 'Space') {
        e.preventDefault();
        handleResponse();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  function detachKeyHandler() {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  /* ── Engine init ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    engine = new BrainForge.GameEngine({
      gameId        : 'sustained-attention',
      totalLevels   : 30,
      passThreshold : 80,
      onGameStart   : function (level) {
        stopLevel();
        startLevel(level);
      }
    });
  });
}());
