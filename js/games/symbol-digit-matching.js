(function () {
  'use strict';

  // ── Inject game-specific styles ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .sdm-key-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: var(--bg-elevated);
      border-radius: 10px;
      overflow: hidden;
    }
    .sdm-key-table th,
    .sdm-key-table td {
      padding: 8px 4px;
      text-align: center;
      border: 1px solid var(--bg-surface);
      font-size: 0.9rem;
    }
    .sdm-key-table th {
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sdm-key-symbol {
      font-size: 1.3rem;
      color: var(--text-primary);
    }
    .sdm-key-digit {
      color: var(--accent-500);
      font-weight: 700;
      font-size: 1rem;
    }
    .sdm-stimulus-wrap {
      text-align: center;
      margin: 8px 0 16px;
    }
    .sdm-stimulus {
      font-size: 72px;
      line-height: 1;
      color: var(--text-primary);
      min-height: 88px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .sdm-digit-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-top: 8px;
    }
    .sdm-digit-btn {
      width: 52px;
      height: 52px;
      border-radius: 10px;
      border: 2px solid var(--bg-elevated);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.1s, transform 0.08s, border-color 0.1s;
      touch-action: manipulation;
    }
    .sdm-digit-btn:hover {
      background: var(--bg-elevated);
      border-color: var(--primary-500);
    }
    .sdm-digit-btn:active {
      transform: scale(0.92);
    }
    .sdm-digit-btn--correct {
      background: var(--success) !important;
      border-color: var(--success) !important;
      color: #fff !important;
    }
    .sdm-digit-btn--wrong {
      background: var(--error) !important;
      border-color: var(--error) !important;
      color: #fff !important;
    }
    .sdm-counters {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 16px;
    }
    .sdm-counter {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 10px 6px;
      text-align: center;
    }
    .sdm-counter__label {
      font-size: 0.68rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 3px;
    }
    .sdm-counter__value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .sdm-kbd-hint {
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 10px;
    }
    .sdm-key-badge {
      display: inline-block;
      background: var(--bg-elevated);
      border: 1px solid var(--text-secondary);
      border-radius: 4px;
      padding: 1px 6px;
      font-family: monospace;
      font-size: 0.85em;
    }
  `;
  document.head.appendChild(style);

  // ── Symbol sets ───────────────────────────────────────────────────────────────
  // 14 distinct Unicode symbols for extended levels
  const ALL_SYMBOLS = ['⊕','⊗','⊞','⊠','⊡','⊟','⊛','⊜','⊝','⊘','⊖','⊙','⊚','⊋'];
  // Digits used for the standard 9-symbol key (1-9) and extended (1-9, then 10-14 map to A..E visually shown as digits)
  // For the extended 14-symbol key we map to digit labels 1-9 then 10-14
  function getDigitLabel(i) {
    return i < 10 ? String(i) : String(i); // 10,11,12,13,14 shown as-is
  }

  // ── Level configuration ───────────────────────────────────────────────────────
  const LEVELS = (function () {
    const cfg = [];
    const push = (from, to, timeLimit, numSymbols, useKeyboard, rotateKey) => {
      for (let i = from; i <= to; i++) cfg.push({ timeLimit, numSymbols, useKeyboard, rotateKey });
    };
    push(1,  3,  90, 4,  false, false);
    push(4,  6,  90, 6,  false, false);
    push(7,  9,  90, 9,  false, false);
    push(10, 12, 75, 9,  false, false);
    push(13, 15, 60, 9,  false, false);
    push(16, 18, 60, 9,  true,  false);
    push(19, 21, 45, 9,  true,  false);
    push(22, 24, 45, 14, true,  false);
    push(25, 27, 90, 14, true,  false);
    push(28, 30, 75, 14, true,  true);
    return cfg;
  }());

  // ── Game state ────────────────────────────────────────────────────────────────
  let engine = null;
  let state = {};

  function resetState(levelIndex) {
    const cfg = LEVELS[levelIndex];
    state = {
      cfg,
      keyMap: [],       // [{symbol, digit}]
      currentSymbol: null,
      currentAnswer: null,
      responded: false,
      correct: 0,
      incorrect: 0,
      total: 0,
      running: false,
      timeLeft: cfg.timeLimit,
      timerInterval: null,
    };
  }

  // ── Build key mapping for this level ─────────────────────────────────────────
  function buildKeyMap(numSymbols, shuffle) {
    const symbols = ALL_SYMBOLS.slice(0, numSymbols);
    if (shuffle) {
      // Fisher-Yates
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }
    }
    return symbols.map((sym, i) => ({ symbol: sym, digit: i + 1 }));
  }

  function pickNextSymbol() {
    const entry = state.keyMap[Math.floor(Math.random() * state.keyMap.length)];
    state.currentSymbol = entry.symbol;
    state.currentAnswer = entry.digit;
    state.responded = false;
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────────
  function getArea() { return document.getElementById('game-area'); }

  function renderKeyTable() {
    const { keyMap } = state;
    const cols = keyMap.map(({ symbol, digit }) =>
      `<td class="sdm-key-symbol">${symbol}</td>`
    ).join('');
    const digitCols = keyMap.map(({ digit }) =>
      `<td class="sdm-key-digit">${digit}</td>`
    ).join('');
    return `
      <table class="sdm-key-table" id="sdm-key-table">
        <thead><tr><th colspan="${keyMap.length}">Key — match the symbol to its digit</th></tr></thead>
        <tbody>
          <tr>${cols}</tr>
          <tr>${digitCols}</tr>
        </tbody>
      </table>
    `;
  }

  function renderDigitBtns() {
    const { keyMap } = state;
    const maxDigit = keyMap.length;
    const btns = [];
    for (let d = 1; d <= maxDigit; d++) {
      btns.push(`<button class="sdm-digit-btn" data-digit="${d}" id="sdm-btn-${d}">${d}</button>`);
    }
    return `<div class="sdm-digit-btns" id="sdm-digit-btns">${btns.join('')}</div>`;
  }

  function renderGameUI() {
    const area = getArea();
    const { cfg } = state;
    const kbdHint = cfg.useKeyboard
      ? `<p class="sdm-kbd-hint">Type a digit key <span class="sdm-key-badge">1</span>–<span class="sdm-key-badge">${cfg.numSymbols}</span> or click a button</p>`
      : '';
    area.innerHTML = `
      <div class="problem-display">
        ${renderKeyTable()}
        <div class="sdm-stimulus-wrap">
          <div class="sdm-stimulus" id="sdm-stimulus">?</div>
        </div>
        ${renderDigitBtns()}
        ${kbdHint}
        <div class="sdm-counters">
          <div class="sdm-counter">
            <span class="sdm-counter__label">Correct</span>
            <span class="sdm-counter__value" id="sdm-correct">0</span>
          </div>
          <div class="sdm-counter">
            <span class="sdm-counter__label">Wrong</span>
            <span class="sdm-counter__value" id="sdm-wrong">0</span>
          </div>
          <div class="sdm-counter">
            <span class="sdm-counter__label">Total</span>
            <span class="sdm-counter__value" id="sdm-total">0</span>
          </div>
        </div>
      </div>
    `;

    // Attach button listeners
    document.querySelectorAll('.sdm-digit-btn').forEach(btn => {
      btn.addEventListener('click', () => onAnswer(parseInt(btn.dataset.digit, 10), btn));
    });
  }

  function updateStimulus() {
    const el = document.getElementById('sdm-stimulus');
    if (el) el.textContent = state.currentSymbol;
  }

  function updateCounters() {
    const c = document.getElementById('sdm-correct');
    const w = document.getElementById('sdm-wrong');
    const t = document.getElementById('sdm-total');
    if (c) c.textContent = state.correct;
    if (w) w.textContent = state.incorrect;
    if (t) t.textContent = state.total;
  }

  // ── Answer handling ───────────────────────────────────────────────────────────
  function onAnswer(digit, btnEl) {
    if (!state.running || state.responded) return;
    state.responded = true;
    state.total++;

    const correct = digit === state.currentAnswer;
    if (correct) {
      state.correct++;
      if (BrainForge.Audio) BrainForge.Audio.correct();
      if (btnEl) {
        btnEl.classList.add('sdm-digit-btn--correct');
        setTimeout(() => btnEl.classList.remove('sdm-digit-btn--correct'), 200);
      }
    } else {
      state.incorrect++;
      if (BrainForge.Audio) BrainForge.Audio.wrong();
      if (btnEl) {
        btnEl.classList.add('sdm-digit-btn--wrong');
        // Also flash correct btn green
        const correctBtn = document.getElementById(`sdm-btn-${state.currentAnswer}`);
        if (correctBtn) correctBtn.classList.add('sdm-digit-btn--correct');
        setTimeout(() => {
          btnEl.classList.remove('sdm-digit-btn--wrong');
          if (correctBtn) correctBtn.classList.remove('sdm-digit-btn--correct');
        }, 350);
      }
    }
    updateCounters();

    // Next symbol after brief flash
    setTimeout(() => {
      if (!state.running) return;
      // If rotate key is on, rebuild key map each trial
      if (state.cfg.rotateKey) {
        state.keyMap = buildKeyMap(state.cfg.numSymbols, true);
        const tableEl = document.getElementById('sdm-key-table');
        if (tableEl) tableEl.outerHTML = renderKeyTable();
        // Re-render the whole key table area
        const area = getArea();
        const oldTable = area.querySelector('.sdm-key-table');
        if (oldTable) {
          const tmpDiv = document.createElement('div');
          tmpDiv.innerHTML = renderKeyTable();
          oldTable.replaceWith(tmpDiv.firstElementChild);
        }
      }
      pickNextSymbol();
      updateStimulus();
    }, correct ? 100 : 400);
  }

  function onKeyDown(e) {
    if (!state.running || !state.cfg.useKeyboard) return;
    const digit = parseInt(e.key, 10);
    if (digit >= 1 && digit <= state.cfg.numSymbols) {
      const btn = document.getElementById(`sdm-btn-${digit}`);
      onAnswer(digit, btn);
    }
  }

  // ── Timer ─────────────────────────────────────────────────────────────────────
  function startGameTimer() {
    state.timeLeft = state.cfg.timeLimit;
    engine.startTimer(state.cfg.timeLimit, () => {
      endGame();
    });
  }

  function endGame() {
    if (!state.running) return;
    state.running = false;
    document.removeEventListener('keydown', onKeyDown);
    engine.stopTimer();

    const score = state.total > 0
      ? Math.round((state.correct / state.total) * 100)
      : 0;
    engine.completeLevel(score);
  }

  // ── Engine init ───────────────────────────────────────────────────────────────
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: 'symbol-digit-matching',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart(levelNumber) {
        const levelIndex = levelNumber - 1;
        resetState(levelIndex);

        state.keyMap = buildKeyMap(state.cfg.numSymbols, false);
        state.running = true;

        renderGameUI();
        pickNextSymbol();
        updateStimulus();
        updateCounters();

        document.addEventListener('keydown', onKeyDown);
        startGameTimer();
      },
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
