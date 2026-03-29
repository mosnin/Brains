(function () {
  'use strict';

  /* ── Inject game-specific CSS ───────────────────────────────────────── */
  const STYLE = `
    .cpt-letter {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 72px;
      font-weight: 700;
      color: var(--text-primary);
      background: var(--bg-elevated);
      border: 2px solid var(--bg-elevated);
      border-radius: 16px;
      width: 160px;
      height: 160px;
      margin: 0 auto 32px;
      transition: border-color 0.1s, background 0.1s;
      user-select: none;
      letter-spacing: 0;
    }
    .cpt-letter--hit {
      border-color: var(--success);
      background: rgba(34,197,94,0.15);
    }
    .cpt-letter--false-alarm {
      border-color: var(--error);
      background: rgba(239,68,68,0.15);
    }
    .cpt-respond-btn {
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
    .cpt-respond-btn:active { transform: scale(0.96); opacity: 0.85; }
    .cpt-stats {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .cpt-stat {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      text-align: center;
      min-width: 80px;
    }
    .cpt-stat span {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .cpt-instruction {
      text-align: center;
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 28px;
      padding: 12px 16px;
      background: var(--bg-elevated);
      border-radius: 8px;
    }
    .cpt-instruction strong { color: var(--text-primary); }
    #game-area { padding: 24px 16px; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ── Level config ───────────────────────────────────────────────────── */
  const LEVELS = (function () {
    const cfg = [];
    for (let i = 1; i <= 30; i++) {
      let stimuli, isi, targetFreq, useK;
      if      (i <= 3)  { stimuli = 40;  isi = 1500; targetFreq = 0.25; useK = false; }
      else if (i <= 6)  { stimuli = 50;  isi = 1200; targetFreq = 0.25; useK = false; }
      else if (i <= 9)  { stimuli = 50;  isi = 1000; targetFreq = 0.20; useK = false; }
      else if (i <= 12) { stimuli = 60;  isi = 900;  targetFreq = 0.20; useK = false; }
      else if (i <= 15) { stimuli = 60;  isi = 800;  targetFreq = 0.15; useK = false; }
      else if (i <= 18) { stimuli = 70;  isi = 700;  targetFreq = 0.15; useK = false; }
      else if (i <= 21) { stimuli = 70;  isi = 600;  targetFreq = 0.15; useK = true;  }
      else if (i <= 24) { stimuli = 80;  isi = 550;  targetFreq = 0.12; useK = true;  }
      else if (i <= 27) { stimuli = 80;  isi = 500;  targetFreq = 0.10; useK = true;  }
      else              { stimuli = 100; isi = 450;  targetFreq = 0.10; useK = true;  }
      cfg.push({ level: i, stimuli, isi, targetFreq, useK });
    }
    return cfg;
  }());

  /* Distractor pools */
  const EASY_POOL    = ['A','B','C','D','E','F','G','H'];
  const HARD_POOL    = ['A','B','C','D','E','F','G','H','K'];   // K is confusable
  const TARGET       = 'X';

  function buildSequence(cfg) {
    const pool    = cfg.useK ? HARD_POOL : EASY_POOL;
    const nTargets = Math.round(cfg.stimuli * cfg.targetFreq);
    const seq = [];
    for (let i = 0; i < nTargets; i++) seq.push(TARGET);
    while (seq.length < cfg.stimuli) seq.push(pool[Math.floor(Math.random() * pool.length)]);
    // Fisher-Yates shuffle
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    return seq;
  }

  /* ── Game state ─────────────────────────────────────────────────────── */
  let engine, currentCfg, sequence, index;
  let hits, misses, falseAlarms, correctRejections;
  let stimulusTimeout, feedbackTimeout;
  let responded, currentLetter, running;
  let keyHandler;

  /* ── DOM builders ───────────────────────────────────────────────────── */
  function buildGameArea() {
    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div class="cpt-instruction">
        Press <strong>SPACE</strong> (or the button below) <strong>only when you see X</strong>.
        Do <strong>not</strong> press for any other letter.
      </div>
      <div class="cpt-letter" id="cpt-letter"></div>
      <button class="cpt-respond-btn" id="cpt-btn" aria-label="Respond">PRESS — I see X!</button>
      <div class="cpt-stats">
        <div class="cpt-stat">Hits<span id="cpt-hits">0</span></div>
        <div class="cpt-stat">Misses<span id="cpt-misses">0</span></div>
        <div class="cpt-stat">False Alarms<span id="cpt-fa">0</span></div>
      </div>
    `;
    document.getElementById('cpt-btn').addEventListener('click', handleResponse);
  }

  function updateStats() {
    document.getElementById('cpt-hits').textContent    = hits;
    document.getElementById('cpt-misses').textContent  = misses;
    document.getElementById('cpt-fa').textContent      = falseAlarms;
  }

  /* ── Core game loop ─────────────────────────────────────────────────── */
  function startLevel(level) {
    currentCfg      = LEVELS[level - 1];
    sequence        = buildSequence(currentCfg);
    index           = 0;
    hits            = 0;
    misses          = 0;
    falseAlarms     = 0;
    correctRejections = 0;
    responded       = false;
    running         = true;

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
    stimulusTimeout = setTimeout(showStimulus, 200); // brief blank gap
  }

  function showStimulus() {
    if (!running) return;
    currentLetter = sequence[index];
    responded     = false;

    const letterEl = document.getElementById('cpt-letter');
    if (!letterEl) return;
    letterEl.textContent   = currentLetter;
    letterEl.className     = 'cpt-letter';

    // Wait ISI then evaluate response
    stimulusTimeout = setTimeout(function () {
      evaluateResponse();
    }, currentCfg.isi);
  }

  function handleResponse() {
    if (!running || responded) return;
    responded = true;
    const letterEl = document.getElementById('cpt-letter');
    if (!letterEl) return;

    if (currentLetter === TARGET) {
      // Hit
      hits++;
      letterEl.classList.add('cpt-letter--hit');
      BrainForge.Audio.correct();
    } else {
      // False alarm
      falseAlarms++;
      letterEl.classList.add('cpt-letter--false-alarm');
      BrainForge.Audio.wrong();
    }
    updateStats();
  }

  function evaluateResponse() {
    if (!running) return;
    if (!responded) {
      if (currentLetter === TARGET) {
        misses++;
      } else {
        correctRejections++;
      }
      updateStats();
    }
    const letterEl = document.getElementById('cpt-letter');
    if (letterEl) {
      letterEl.textContent = '';
      letterEl.className   = 'cpt-letter';
    }
    index++;
    scheduleNext();
  }

  function finishLevel() {
    running = false;
    detachKeyHandler();
    clearTimeout(stimulusTimeout);
    clearTimeout(feedbackTimeout);

    const total = hits + misses + falseAlarms + correctRejections;
    const pct   = total > 0 ? Math.round((hits + correctRejections) / total * 100) : 0;
    engine.completeLevel(pct);
  }

  function stopLevel() {
    running = false;
    clearTimeout(stimulusTimeout);
    clearTimeout(feedbackTimeout);
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
      gameId        : 'continuous-performance',
      totalLevels   : 30,
      passThreshold : 80,
      onGameStart   : function (level) {
        stopLevel();
        startLevel(level);
      }
    });
  });
}());
