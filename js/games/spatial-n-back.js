(function () {
  'use strict';

  /* ─── Level Configuration ──────────────────────────────────────────────── */
  var LEVELS = (function () {
    var cfg = [
      // [n, trials, stimMs, isiMs, gridSize]
      [1, 20, 600, 2500, 4], // L1
      [1, 20, 600, 2500, 4], // L2
      [1, 20, 600, 2500, 4], // L3
      [1, 25, 500, 2200, 4], // L4
      [1, 25, 500, 2200, 4], // L5
      [1, 25, 500, 2200, 4], // L6
      [2, 20, 500, 2500, 4], // L7
      [2, 20, 500, 2500, 4], // L8
      [2, 20, 500, 2500, 4], // L9
      [2, 25, 450, 2200, 4], // L10
      [2, 25, 450, 2200, 4], // L11
      [2, 25, 450, 2200, 4], // L12
      [3, 25, 450, 2000, 4], // L13
      [3, 25, 450, 2000, 4], // L14
      [3, 25, 450, 2000, 4], // L15
      [3, 30, 400, 1800, 4], // L16
      [3, 30, 400, 1800, 4], // L17
      [3, 30, 400, 1800, 4], // L18
      [4, 30, 400, 1600, 5], // L19
      [4, 30, 400, 1600, 5], // L20
      [4, 30, 400, 1600, 5], // L21
      [5, 30, 350, 1500, 5], // L22
      [5, 30, 350, 1500, 5], // L23
      [5, 30, 350, 1500, 5], // L24
      [6, 35, 350, 1400, 5], // L25
      [6, 35, 350, 1400, 5], // L26
      [6, 35, 350, 1400, 5], // L27
      [7, 35, 300, 1200, 5], // L28
      [7, 35, 300, 1200, 5], // L29
      [7, 35, 300, 1200, 5], // L30
    ];
    return cfg.map(function (c, i) {
      return { level: i + 1, n: c[0], trials: c[1], stimMs: c[2], isiMs: c[3], gridSize: c[4] };
    });
  })();

  /* ─── State ────────────────────────────────────────────────────────────── */
  var engine;
  var state = {
    levelCfg: null,
    sequence: [],        // array of cell indices for each trial
    trialIndex: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    responded: false,
    isMatch: false,
    phase: 'idle',       // idle | stimulus | isi | done
    stimTimer: null,
    isiTimer: null,
  };

  /* ─── DOM helpers ──────────────────────────────────────────────────────── */
  function qs(sel) { return document.querySelector(sel); }

  function buildGrid(size) {
    var area = qs('#game-area');
    area.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'snb-wrapper';

    var grid = document.createElement('div');
    grid.id = 'snb-grid';
    grid.className = 'game-grid game-grid--' + size + 'x' + size;

    var total = size * size;
    for (var i = 0; i < total; i++) {
      var cell = document.createElement('div');
      cell.className = 'game-cell';
      cell.dataset.idx = i;
      grid.appendChild(cell);
    }

    var controls = document.createElement('div');
    controls.className = 'snb-controls';

    var matchBtn = document.createElement('button');
    matchBtn.id = 'snb-match-btn';
    matchBtn.className = 'btn btn--primary snb-match-btn';
    matchBtn.textContent = 'Position Match';
    matchBtn.setAttribute('aria-label', 'Respond: position matches N trials ago (Space or A)');
    matchBtn.addEventListener('click', onMatchPress);

    var hint = document.createElement('p');
    hint.className = 'snb-hint';
    hint.textContent = 'Press if current position matches ' + state.levelCfg.n + ' trial(s) ago  ·  Space / A';

    var progress = document.createElement('div');
    progress.className = 'snb-progress';

    var progressLabel = document.createElement('span');
    progressLabel.id = 'snb-progress-label';
    progressLabel.textContent = 'Trial 0 / ' + state.levelCfg.trials;

    var progressBar = document.createElement('div');
    progressBar.className = 'snb-progress-bar-bg';
    var progressFill = document.createElement('div');
    progressFill.className = 'snb-progress-fill';
    progressFill.id = 'snb-progress-fill';
    progressBar.appendChild(progressFill);

    progress.appendChild(progressLabel);
    progress.appendChild(progressBar);

    controls.appendChild(matchBtn);
    controls.appendChild(hint);

    wrapper.appendChild(progress);
    wrapper.appendChild(grid);
    wrapper.appendChild(controls);
    area.appendChild(wrapper);
  }

  function updateProgress(trialIdx) {
    var total = state.levelCfg.trials;
    var label = qs('#snb-progress-label');
    var fill = qs('#snb-progress-fill');
    if (label) label.textContent = 'Trial ' + trialIdx + ' / ' + total;
    if (fill) fill.style.width = ((trialIdx / total) * 100) + '%';
  }

  function highlightCell(idx, cssClass) {
    var cells = document.querySelectorAll('#snb-grid .game-cell');
    cells.forEach(function (c) {
      c.classList.remove('game-cell--active', 'game-cell--correct', 'game-cell--wrong');
    });
    if (idx !== null && idx !== undefined && cssClass) {
      var target = cells[idx];
      if (target) target.classList.add(cssClass);
    }
  }

  function flashFeedback(correct) {
    var btn = qs('#snb-match-btn');
    if (!btn) return;
    var cls = correct ? 'snb-match-btn--correct' : 'snb-match-btn--wrong';
    btn.classList.add(cls);
    setTimeout(function () { btn.classList.remove(cls); }, 300);
  }

  /* ─── Sequence generation ──────────────────────────────────────────────── */
  function generateSequence(cfg) {
    var totalCells = cfg.gridSize * cfg.gridSize;
    var seq = [];
    var targetCount = 0;
    var maxTargets = Math.floor(cfg.trials * 0.30);
    var minTargets = Math.floor(cfg.trials * 0.20);

    for (var i = 0; i < cfg.trials; i++) {
      if (i < cfg.n) {
        // First N trials cannot be matches
        seq.push(Math.floor(Math.random() * totalCells));
      } else {
        var remaining = cfg.trials - i;
        var remainingTargetsNeeded = minTargets - targetCount;
        var forceMatch = remainingTargetsNeeded >= remaining;
        var preventMatch = targetCount >= maxTargets;

        var makeMatch = false;
        if (forceMatch) {
          makeMatch = true;
        } else if (!preventMatch) {
          makeMatch = Math.random() < 0.25;
        }

        if (makeMatch) {
          seq.push(seq[i - cfg.n]);
          targetCount++;
        } else {
          // Ensure it's NOT equal to n-back position
          var nBackPos = seq[i - cfg.n];
          var cell;
          var attempts = 0;
          do {
            cell = Math.floor(Math.random() * totalCells);
            attempts++;
          } while (cell === nBackPos && attempts < 20);
          seq.push(cell);
        }
      }
    }
    return seq;
  }

  /* ─── Trial Logic ──────────────────────────────────────────────────────── */
  function runTrial() {
    var cfg = state.levelCfg;
    var i = state.trialIndex;

    if (i >= cfg.trials) {
      finishLevel();
      return;
    }

    state.responded = false;
    state.isMatch = (i >= cfg.n) && (state.sequence[i] === state.sequence[i - cfg.n]);
    state.phase = 'stimulus';

    updateProgress(i + 1);
    highlightCell(state.sequence[i], 'game-cell--active');

    var matchBtn = qs('#snb-match-btn');
    if (matchBtn) matchBtn.disabled = false;

    // Stimulus phase
    state.stimTimer = setTimeout(function () {
      highlightCell(null);
      state.phase = 'isi';

      // ISI phase – response still accepted
      state.isiTimer = setTimeout(function () {
        // Time's up for this trial
        if (!state.responded) {
          if (state.isMatch) {
            state.misses++;
          } else {
            state.correctRejections++;
          }
        }
        state.trialIndex++;
        runTrial();
      }, cfg.isiMs);

    }, cfg.stimMs);
  }

  function onMatchPress() {
    if (state.phase !== 'stimulus' && state.phase !== 'isi') return;
    if (state.responded) return;

    state.responded = true;

    if (state.isMatch) {
      state.hits++;
      BrainForge.Audio.correct();
      flashFeedback(true);
    } else {
      state.falseAlarms++;
      BrainForge.Audio.wrong();
      flashFeedback(false);
    }

    var score = calcScore();
    engine.updateScore(score);
  }

  function calcScore() {
    var total = state.hits + state.misses + state.falseAlarms + state.correctRejections;
    if (total === 0) return 0;
    return Math.round(((state.hits + state.correctRejections) / total) * 100);
  }

  function finishLevel() {
    state.phase = 'done';
    clearTimeout(state.stimTimer);
    clearTimeout(state.isiTimer);

    var score = calcScore();
    engine.completeLevel(score);
  }

  /* ─── Keyboard ─────────────────────────────────────────────────────────── */
  function onKeyDown(e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      onMatchPress();
    }
  }

  /* ─── Instructions Screen ──────────────────────────────────────────────── */
  function showInstructions(cfg, startCallback) {
    var overlay = qs('#game-overlay');
    overlay.innerHTML = '';
    overlay.style.display = 'flex';

    var box = document.createElement('div');
    box.className = 'snb-instructions';

    var title = document.createElement('h2');
    title.textContent = 'Level ' + cfg.level + ' – ' + cfg.n + '-Back';

    var details = document.createElement('ul');
    details.className = 'snb-instructions__details';

    var items = [
      'Grid: ' + cfg.gridSize + '×' + cfg.gridSize,
      'Trials: ' + cfg.trials,
      'Match N: ' + cfg.n + ' trial' + (cfg.n > 1 ? 's' : '') + ' back',
      'Stimulus: ' + cfg.stimMs + ' ms',
      'Gap: ' + cfg.isiMs + ' ms',
    ];
    items.forEach(function (txt) {
      var li = document.createElement('li');
      li.textContent = txt;
      details.appendChild(li);
    });

    var desc = document.createElement('p');
    desc.className = 'snb-instructions__desc';
    desc.textContent =
      'A cell will light up each trial. Press "Position Match" (or Space/A) if the highlighted cell is in the same position as the cell from ' +
      cfg.n + ' trial' + (cfg.n > 1 ? 's' : '') + ' ago.';

    var startBtn = document.createElement('button');
    startBtn.className = 'btn btn--primary';
    startBtn.textContent = 'Start Level';
    startBtn.addEventListener('click', function () {
      BrainForge.Audio.click();
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      startCallback();
    });

    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(details);
    box.appendChild(startBtn);
    overlay.appendChild(box);
  }

  /* ─── Engine Lifecycle ─────────────────────────────────────────────────── */
  function initGame(levelNumber) {
    var cfg = LEVELS[levelNumber - 1];
    state.levelCfg = cfg;
    state.sequence = generateSequence(cfg);
    state.trialIndex = 0;
    state.hits = 0;
    state.misses = 0;
    state.falseAlarms = 0;
    state.correctRejections = 0;
    state.responded = false;
    state.isMatch = false;
    state.phase = 'idle';

    buildGrid(cfg.gridSize);

    showInstructions(cfg, function () {
      state.phase = 'stimulus';
      document.addEventListener('keydown', onKeyDown);
      runTrial();
    });
  }

  /* ─── Boot ─────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    engine = new BrainForge.GameEngine({
      gameId: 'spatial-n-back',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (levelNumber) {
        document.removeEventListener('keydown', onKeyDown);
        initGame(levelNumber);
      },
    });
  });

})();
