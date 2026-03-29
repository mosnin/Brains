(function () {
  'use strict';

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .pms-fixation {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      font-size: 2.5rem;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
    }
    .pms-pair {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 1.5rem 0;
    }
    .pms-pattern {
      background: var(--bg-elevated);
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 1.25rem 2rem;
      min-width: 140px;
      text-align: center;
      font-size: 1.6rem;
      letter-spacing: 0.18em;
      font-family: 'Courier New', Courier, monospace;
      color: var(--text-primary);
      transition: border-color 0.15s;
    }
    .pms-pattern--correct  { border-color: var(--success); }
    .pms-pattern--wrong    { border-color: var(--error); }
    .pms-vs {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-secondary);
      user-select: none;
    }
    .pms-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.25rem;
    }
    .pms-btn {
      min-width: 140px;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      border: 2px solid transparent;
      transition: background 0.15s, transform 0.08s;
      letter-spacing: 0.04em;
    }
    .pms-btn--same {
      background: var(--primary-500);
      color: #fff;
    }
    .pms-btn--same:hover { background: #3d5ae0; }
    .pms-btn--diff {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border-color: var(--bg-elevated);
    }
    .pms-btn--diff:hover { background: #3f536b; }
    .pms-btn:active { transform: scale(0.96); }
    .pms-btn:disabled { opacity: 0.45; cursor: default; }
    .pms-key-hint {
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      letter-spacing: 0.03em;
    }
    .pms-trial-counter {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .pms-stats {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .pms-stat {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      text-align: center;
      min-width: 90px;
    }
    .pms-stat__label {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .pms-stat__value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  `;
  document.head.appendChild(style);

  // ── Level Config ────────────────────────────────────────────────────────────
  const LEVELS = [
    // [stimulus_type, length, time_limit_ms]
    ['symbols', 2, 4000], // 1
    ['symbols', 2, 4000], // 2
    ['symbols', 3, 3000], // 3
    ['symbols', 3, 3000], // 4
    ['numbers', 4, 3000], // 5
    ['numbers', 4, 3000], // 6
    ['numbers', 5, 2500], // 7
    ['numbers', 5, 2500], // 8
    ['numbers', 6, 2500], // 9
    ['numbers', 6, 2500], // 10
    ['letters', 5, 2000], // 11
    ['letters', 5, 2000], // 12
    ['letters', 6, 2000], // 13
    ['letters', 6, 2000], // 14
    ['letters', 7, 1800], // 15
    ['letters', 7, 1800], // 16
    ['numbers', 8, 1800], // 17
    ['numbers', 8, 1800], // 18
    ['letters', 8, 1500], // 19
    ['letters', 8, 1500], // 20
    ['mixed',   6, 1500], // 21
    ['mixed',   6, 1500], // 22
    ['mixed',   8, 1200], // 23
    ['mixed',   8, 1200], // 24
    ['mixed',  10, 1200], // 25
    ['mixed',  10, 1200], // 26
    ['mixed',  10, 1000], // 27
    ['mixed',  10, 1000], // 28
    ['mixed',  12,  800], // 29
    ['mixed',  12,  800], // 30
  ];

  const SYMBOLS = ['★', '☆', '♦', '♣', '♠', '♥', '●', '○', '▲', '△'];
  const DIGITS  = '0123456789';
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const MIXED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&!?';

  const TRIALS_PER_LEVEL = 20;
  const PASS_THRESHOLD   = 80;

  // ── State ───────────────────────────────────────────────────────────────────
  let engine, currentLevel, trialIndex, correctCount;
  let trialTimer = null, answerLocked = false;
  let totalResponseMs = 0, trialStartTime = 0;
  let currentAnswer = false; // whether current pair is SAME

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generatePattern(type, length) {
    let chars = '';
    if (type === 'symbols') {
      for (let i = 0; i < length; i++) chars += rand(SYMBOLS);
    } else if (type === 'numbers') {
      for (let i = 0; i < length; i++) chars += rand(DIGITS);
    } else if (type === 'letters') {
      for (let i = 0; i < length; i++) chars += rand(LETTERS);
    } else { // mixed
      for (let i = 0; i < length; i++) chars += rand(MIXED_CHARS);
    }
    return chars;
  }

  function mutateSingle(str) {
    const pool = str.length > 0 ? str[0] : 'A';
    const idx   = Math.floor(Math.random() * str.length);
    let newChar;
    // pick a char not equal to the one being replaced
    if (/[0-9]/.test(pool)) {
      do { newChar = rand(DIGITS); } while (newChar === str[idx]);
    } else if (/[A-Z]/.test(pool)) {
      do { newChar = rand(LETTERS); } while (newChar === str[idx]);
    } else {
      do { newChar = rand(SYMBOLS); } while (newChar === str[idx]);
    }
    // for mixed, pick from full pool
    if (MIXED_CHARS.includes(str[0]) && /[A-Za-z0-9]/.test(pool)) {
      do { newChar = rand(MIXED_CHARS); } while (newChar === str[idx]);
    }
    return str.slice(0, idx) + newChar + str.slice(idx + 1);
  }

  function buildTrial(type, length) {
    const base  = generatePattern(type, length);
    const isSame = Math.random() < 0.5;
    const right = isSame ? base : mutateSingle(base);
    return { left: base, right, isSame };
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderTrial() {
    const cfg = LEVELS[currentLevel - 1];
    const [type, length, timeLimitMs] = cfg;
    const trial = buildTrial(type, length);
    currentAnswer = trial.isSame;

    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div class="pms-trial-counter">Trial ${trialIndex + 1} of ${TRIALS_PER_LEVEL}</div>
      <div class="pms-pair">
        <div class="pms-pattern" id="pms-left">${trial.left}</div>
        <div class="pms-vs">VS</div>
        <div class="pms-pattern" id="pms-right">${trial.right}</div>
      </div>
      <div class="pms-buttons">
        <button class="pms-btn pms-btn--same" id="pms-same">Same &nbsp;<kbd>S</kbd></button>
        <button class="pms-btn pms-btn--diff" id="pms-diff">Different &nbsp;<kbd>D</kbd></button>
      </div>
      <div class="pms-key-hint">Press <strong>S</strong> for Same &nbsp;|&nbsp; <strong>D</strong> for Different</div>
    `;

    document.getElementById('pms-same').addEventListener('click', () => respond(true));
    document.getElementById('pms-diff').addEventListener('click', () => respond(false));

    answerLocked = false;
    trialStartTime = performance.now();

    // per-trial timer
    clearTimeout(trialTimer);
    trialTimer = setTimeout(() => { if (!answerLocked) respond(null); }, timeLimitMs);

    // drive the HUD timer bar
    engine.startTimer(Math.round(timeLimitMs / 1000), () => {});
  }

  function respond(userSaidSame) {
    if (answerLocked) return;
    answerLocked = true;
    engine.stopTimer();
    clearTimeout(trialTimer);

    const rt = performance.now() - trialStartTime;
    totalResponseMs += rt;

    const isCorrect = userSaidSame === currentAnswer;
    if (isCorrect) {
      correctCount++;
      BrainForge.Audio.correct();
    } else {
      BrainForge.Audio.wrong();
    }

    // visual feedback
    const cls = isCorrect ? 'pms-pattern--correct' : 'pms-pattern--wrong';
    const lEl = document.getElementById('pms-left');
    const rEl = document.getElementById('pms-right');
    if (lEl) lEl.classList.add(cls);
    if (rEl) rEl.classList.add(cls);

    // disable buttons
    ['pms-same', 'pms-diff'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });

    trialIndex++;
    const pct = Math.round((correctCount / TRIALS_PER_LEVEL) * 100);
    engine.updateScore(pct);

    setTimeout(() => {
      if (trialIndex >= TRIALS_PER_LEVEL) {
        finishLevel();
      } else {
        renderTrial();
      }
    }, 350);
  }

  function finishLevel() {
    const pct = Math.round((correctCount / TRIALS_PER_LEVEL) * 100);
    const avgRt = Math.round(totalResponseMs / TRIALS_PER_LEVEL);

    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div style="text-align:center;padding:1rem 0 0.5rem;">
        <div class="pms-stats">
          <div class="pms-stat">
            <div class="pms-stat__label">Accuracy</div>
            <div class="pms-stat__value" style="color:${pct >= PASS_THRESHOLD ? 'var(--success)' : 'var(--error)'}">${pct}%</div>
          </div>
          <div class="pms-stat">
            <div class="pms-stat__label">Avg Speed</div>
            <div class="pms-stat__value">${avgRt}<span style="font-size:0.7rem;color:var(--text-secondary)">ms</span></div>
          </div>
          <div class="pms-stat">
            <div class="pms-stat__label">Correct</div>
            <div class="pms-stat__value">${correctCount}/${TRIALS_PER_LEVEL}</div>
          </div>
        </div>
      </div>
    `;

    engine.completeLevel(pct);
  }

  // ── Keyboard Handler ─────────────────────────────────────────────────────────
  function onKey(e) {
    if (e.key === 's' || e.key === 'S') respond(true);
    else if (e.key === 'd' || e.key === 'D') respond(false);
  }

  // ── Game Engine Init ─────────────────────────────────────────────────────────
  function startLevel(level) {
    currentLevel  = level;
    trialIndex    = 0;
    correctCount  = 0;
    totalResponseMs = 0;
    answerLocked  = false;

    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);

    renderTrial();
  }

  engine = new BrainForge.GameEngine({
    gameId: 'pattern-matching-speed',
    totalLevels: 30,
    passThreshold: PASS_THRESHOLD,
    onGameStart(level) { startLevel(level); },
  });

})();
