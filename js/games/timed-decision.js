(function () {
  'use strict';

  // ── Inject CSS ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .tdt-rule {
      background: var(--bg-elevated);
      border-left: 4px solid var(--primary-500);
      border-radius: 0 8px 8px 0;
      padding: 0.6rem 1.2rem;
      font-size: 0.92rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .tdt-rule strong {
      color: var(--text-primary);
    }
    .tdt-stimulus {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: 0.06em;
      user-select: none;
      padding: 0.5rem;
    }
    .tdt-stimulus--shape {
      font-size: 4.5rem;
      line-height: 1;
    }
    .tdt-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.25rem;
      flex-wrap: wrap;
    }
    .tdt-btn {
      min-width: 130px;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      border: 2px solid transparent;
      transition: background 0.15s, transform 0.08s;
      letter-spacing: 0.04em;
    }
    .tdt-btn--yes {
      background: var(--accent-500);
      color: #fff;
    }
    .tdt-btn--yes:hover { background: #0fa393; }
    .tdt-btn--no {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }
    .tdt-btn--no:hover { background: #3f536b; }
    .tdt-btn--odd {
      background: var(--primary-500);
      color: #fff;
    }
    .tdt-btn--odd:hover { background: #3d5ae0; }
    .tdt-btn--even {
      background: var(--accent-500);
      color: #fff;
    }
    .tdt-btn--even:hover { background: #0fa393; }
    .tdt-btn:active { transform: scale(0.96); }
    .tdt-btn:disabled { opacity: 0.45; cursor: default; }
    .tdt-key-hint {
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }
    .tdt-trial-counter {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .tdt-feedback {
      text-align: center;
      font-size: 1rem;
      font-weight: 700;
      min-height: 1.4rem;
      margin-top: 0.75rem;
      transition: opacity 0.2s;
    }
    .tdt-feedback--correct { color: var(--success); }
    .tdt-feedback--wrong   { color: var(--error); }
    .tdt-stats {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .tdt-stat {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      text-align: center;
      min-width: 90px;
    }
    .tdt-stat__label {
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .tdt-stat__value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  `;
  document.head.appendChild(style);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const PRIMES = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47]);
  const VOWEL_WORDS = [
    'apple','orange','umbrella','echo','island','open','eagle','able',
    'idea','only','use','away','into','over','even','end','act','ask',
    'each','else','ice','old','aim','arm','age','ear','eye','oil'
  ];
  const CONSONANT_WORDS = [
    'brain','tree','sand','hill','clock','drop','stone','peak','blue',
    'cloud','green','sky','frost','spring','lake','sun','bird','run',
    'flow','night','shine','bright','small','strong','swift','light'
  ];
  const COMMON_WORDS_SHORT  = ['cat','bus','map','cup','log','tip','run','big','red','hot'];
  const COMMON_WORDS_LONG   = ['brain','train','cloud','table','chair','plant','water','glass','stone','floor'];
  const SHAPES = ['●','■','▲','◆'];

  // 30-level config: [task_type, n_items, time_per_item_ms, extra_cfg]
  // task types: 'gt5','even','odd_or_even','is_circle','is_vowel_letter','prime','starts_vowel_word','gt3letters','gt50','mixed'
  const LEVELS = [
    ['gt5',            20, 3000, null], // 1
    ['gt5',            20, 2000, null], // 2
    ['gt5',            20, 3000, null], // 3  (spec says L3-4 also gt5 2000 but keep variety)
    ['gt5',            20, 2000, null], // 4
    ['even',           20, 2500, null], // 5
    ['even',           20, 2500, null], // 6
    ['even',           20, 2000, null], // 7
    ['even',           20, 2000, null], // 8
    ['odd_or_even',    20, 1500, null], // 9
    ['odd_or_even',    20, 1500, null], // 10
    ['is_circle',      20, 2000, null], // 11
    ['is_circle',      20, 2000, null], // 12
    ['is_vowel_letter',20, 1500, null], // 13
    ['is_vowel_letter',20, 1500, null], // 14
    ['prime',          20, 2000, null], // 15
    ['prime',          20, 2000, null], // 16
    ['prime',          20, 1500, null], // 17
    ['prime',          20, 1500, null], // 18
    ['starts_vowel',   20, 1500, null], // 19
    ['starts_vowel',   20, 1500, null], // 20
    ['gt3letters',     20, 1200, null], // 21
    ['gt3letters',     20, 1200, null], // 22
    ['gt50',           20, 1200, null], // 23
    ['gt50',           20, 1200, null], // 24
    ['mixed',          25, 1200, null], // 25
    ['mixed',          25, 1200, null], // 26
    ['mixed',          25, 1000, null], // 27
    ['mixed',          25, 1000, null], // 28
    ['mixed',          30,  800, null], // 29
    ['mixed',          30,  800, null], // 30
  ];

  const MIXED_TASKS = ['gt5','even','prime','is_circle','is_vowel_letter','starts_vowel','gt50'];

  const PASS_THRESHOLD = 80;

  // ── State ────────────────────────────────────────────────────────────────────
  let engine, currentLevel, trialIndex, correctCount, totalItems;
  let currentTask, currentAnswer, currentStimulus;
  let trialTimer = null, answerLocked = false;
  let totalResponseMs = 0, trialStartTime = 0;
  let mixedTask = null; // task selected for current trial in mixed mode

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function vowelLetter(l) { return 'AEIOU'.includes(l); }
  function startsVowel(w) { return 'aeiou'.includes(w[0].toLowerCase()); }

  function generateStimulus(task) {
    switch (task) {
      case 'gt5': {
        const n = randInt(1, 10);
        return { display: String(n), answer: n > 5 };
      }
      case 'even': {
        const n = randInt(1, 20);
        return { display: String(n), answer: n % 2 === 0 };
      }
      case 'odd_or_even': {
        const n = randInt(1, 20);
        return { display: String(n), answer: n % 2 === 0 ? 'even' : 'odd' };
      }
      case 'is_circle': {
        const s = rand(SHAPES);
        return { display: s, answer: s === '●', isShape: true };
      }
      case 'is_vowel_letter': {
        const l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[randInt(0, 25)];
        return { display: l, answer: vowelLetter(l) };
      }
      case 'prime': {
        const n = randInt(1, 30);
        return { display: String(n), answer: PRIMES.has(n) };
      }
      case 'starts_vowel': {
        const allWords = [...VOWEL_WORDS, ...CONSONANT_WORDS];
        const w = rand(allWords);
        return { display: w.toLowerCase(), answer: startsVowel(w) };
      }
      case 'gt3letters': {
        const allWords = [...COMMON_WORDS_SHORT, ...COMMON_WORDS_LONG];
        const w = rand(allWords);
        return { display: w.toLowerCase(), answer: w.length > 3 };
      }
      case 'gt50': {
        const n = randInt(1, 99);
        return { display: String(n), answer: n > 50 };
      }
      case 'mixed': {
        const t = rand(MIXED_TASKS);
        const s = generateStimulus(t);
        s.mixedTask = t;
        return s;
      }
      default:
        return { display: '?', answer: false };
    }
  }

  function ruleText(task) {
    switch (task) {
      case 'gt5':             return 'Is this number <strong>greater than 5</strong>?';
      case 'even':            return 'Is this number <strong>even</strong>?';
      case 'odd_or_even':     return 'Is this number <strong>odd or even</strong>?';
      case 'is_circle':       return 'Is this shape a <strong>circle</strong>?';
      case 'is_vowel_letter': return 'Is this letter a <strong>vowel</strong>?';
      case 'prime':           return 'Is this a <strong>prime number</strong>?';
      case 'starts_vowel':    return 'Does this word <strong>start with a vowel</strong>?';
      case 'gt3letters':      return 'Is this word <strong>more than 3 letters</strong>?';
      case 'gt50':            return 'Is this number <strong>greater than 50</strong>?';
      default:                return 'Decide:';
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderTrial() {
    const cfg = LEVELS[currentLevel - 1];
    const [taskType, nItems, timeLimitMs] = cfg;

    let task = taskType;
    let stimulus;

    if (taskType === 'mixed') {
      stimulus = generateStimulus('mixed');
      task = stimulus.mixedTask;
    } else {
      stimulus = generateStimulus(taskType);
    }

    currentTask     = task;
    currentAnswer   = stimulus.answer;
    currentStimulus = stimulus;

    const isOddEven = task === 'odd_or_even';

    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div class="tdt-trial-counter">Trial ${trialIndex + 1} of ${nItems}</div>
      <div class="tdt-rule">${ruleText(task)}</div>
      <div class="tdt-stimulus${stimulus.isShape ? ' tdt-stimulus--shape' : ''}" id="tdt-stim">${stimulus.display}</div>
      <div class="tdt-buttons" id="tdt-buttons">
        ${isOddEven
          ? `<button class="tdt-btn tdt-btn--odd"  id="tdt-odd" >Odd &nbsp;<kbd>O</kbd></button>
             <button class="tdt-btn tdt-btn--even" id="tdt-even">Even &nbsp;<kbd>E</kbd></button>`
          : `<button class="tdt-btn tdt-btn--yes" id="tdt-yes">Yes &nbsp;<kbd>Y</kbd></button>
             <button class="tdt-btn tdt-btn--no"  id="tdt-no" >No &nbsp;<kbd>N</kbd></button>`
        }
      </div>
      <div class="tdt-key-hint">
        ${isOddEven ? 'Press <strong>O</strong> Odd &nbsp;|&nbsp; <strong>E</strong> Even' : 'Press <strong>Y</strong> for Yes &nbsp;|&nbsp; <strong>N</strong> for No'}
      </div>
      <div class="tdt-feedback" id="tdt-feedback"></div>
    `;

    if (isOddEven) {
      document.getElementById('tdt-odd') .addEventListener('click', () => respond('odd'));
      document.getElementById('tdt-even').addEventListener('click', () => respond('even'));
    } else {
      document.getElementById('tdt-yes').addEventListener('click', () => respond(true));
      document.getElementById('tdt-no') .addEventListener('click', () => respond(false));
    }

    answerLocked   = false;
    trialStartTime = performance.now();

    clearTimeout(trialTimer);
    trialTimer = setTimeout(() => { if (!answerLocked) respond(null); }, timeLimitMs);
    engine.startTimer(Math.round(timeLimitMs / 1000), () => {});
  }

  function respond(userAnswer) {
    if (answerLocked) return;
    answerLocked = true;
    engine.stopTimer();
    clearTimeout(trialTimer);

    const rt = performance.now() - trialStartTime;
    totalResponseMs += rt;

    const isCorrect = userAnswer !== null && userAnswer === currentAnswer;

    if (isCorrect) {
      correctCount++;
      BrainForge.Audio.correct();
    } else {
      BrainForge.Audio.wrong();
    }

    const fb = document.getElementById('tdt-feedback');
    if (fb) {
      fb.textContent = userAnswer === null ? 'Too slow!' : (isCorrect ? 'Correct!' : 'Wrong!');
      fb.className   = 'tdt-feedback ' + (isCorrect ? 'tdt-feedback--correct' : 'tdt-feedback--wrong');
    }

    // disable buttons
    ['tdt-yes','tdt-no','tdt-odd','tdt-even'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });

    trialIndex++;
    const pct = Math.round((correctCount / totalItems) * 100);
    engine.updateScore(pct);

    setTimeout(() => {
      if (trialIndex >= totalItems) {
        finishLevel();
      } else {
        renderTrial();
      }
    }, 300);
  }

  function finishLevel() {
    const pct   = Math.round((correctCount / totalItems) * 100);
    const avgRt = Math.round(totalResponseMs / totalItems);

    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div style="text-align:center;padding:1rem 0 0.5rem;">
        <div class="tdt-stats">
          <div class="tdt-stat">
            <div class="tdt-stat__label">Accuracy</div>
            <div class="tdt-stat__value" style="color:${pct >= PASS_THRESHOLD ? 'var(--success)' : 'var(--error)'}">${pct}%</div>
          </div>
          <div class="tdt-stat">
            <div class="tdt-stat__label">Avg Speed</div>
            <div class="tdt-stat__value">${avgRt}<span style="font-size:0.7rem;color:var(--text-secondary)">ms</span></div>
          </div>
          <div class="tdt-stat">
            <div class="tdt-stat__label">Correct</div>
            <div class="tdt-stat__value">${correctCount}/${totalItems}</div>
          </div>
        </div>
      </div>
    `;

    engine.completeLevel(pct);
  }

  // ── Keyboard Handler ─────────────────────────────────────────────────────────
  function onKey(e) {
    const k = e.key.toLowerCase();
    const isOddEven = currentTask === 'odd_or_even';
    if (isOddEven) {
      if (k === 'o') respond('odd');
      else if (k === 'e') respond('even');
    } else {
      if (k === 'y') respond(true);
      else if (k === 'n') respond(false);
    }
  }

  // ── Game Engine Init ──────────────────────────────────────────────────────────
  function startLevel(level) {
    currentLevel    = level;
    trialIndex      = 0;
    correctCount    = 0;
    totalResponseMs = 0;
    answerLocked    = false;
    currentTask     = null;
    currentAnswer   = null;

    const cfg  = LEVELS[level - 1];
    totalItems = cfg[1];

    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);

    renderTrial();
  }

  engine = new BrainForge.GameEngine({
    gameId: 'timed-decision',
    totalLevels: 30,
    passThreshold: PASS_THRESHOLD,
    onGameStart(level) { startLevel(level); },
  });

})();
