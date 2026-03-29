(function () {
  'use strict';

  /* ─── Styles ────────────────────────────────────────────────────────────── */
  (function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.vpr-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; }',
      '.vpr-phase-label { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); min-height: 22px; }',
      '.vpr-phase-label.display { color: var(--accent-500); }',
      '.vpr-phase-label.recall { color: var(--primary-500); }',
      '.vpr-phase-label.feedback { color: var(--text-secondary); }',
      '.vpr-grid { display: grid; gap: 6px; }',
      '.vpr-cell { width: 48px; height: 48px; border-radius: 6px; background: var(--bg-elevated); border: 2px solid #475569; cursor: default; transition: background 0.12s, border-color 0.12s, transform 0.08s; user-select: none; -webkit-user-select: none; }',
      '.vpr-cell.active { background: var(--accent-500); border-color: var(--accent-500); box-shadow: 0 0 12px rgba(20,184,166,0.55); }',
      '.vpr-cell.selected { background: var(--primary-500); border-color: var(--primary-500); box-shadow: 0 0 10px rgba(79,107,245,0.45); }',
      '.vpr-cell.clickable { cursor: pointer; }',
      '.vpr-cell.clickable:not(.selected):hover { border-color: var(--primary-500); transform: scale(1.06); }',
      '.vpr-cell.fb-correct { background: var(--success) !important; border-color: var(--success) !important; box-shadow: 0 0 10px rgba(34,197,94,0.5); }',
      '.vpr-cell.fb-wrong { background: var(--error) !important; border-color: var(--error) !important; box-shadow: 0 0 10px rgba(239,68,68,0.5); }',
      '.vpr-cell.fb-missed { background: rgba(20,184,166,0.35) !important; border-color: var(--accent-500) !important; border-style: dashed !important; }',
      '.vpr-submit-row { min-height: 44px; display: flex; align-items: center; }',
      '.vpr-submit-btn { display: none; }',
      '.vpr-submit-btn.visible { display: inline-flex; }',
      '.vpr-count { font-size: 0.9rem; color: var(--text-secondary); }',
      '.vpr-count span { color: var(--text-primary); font-weight: 600; }',
      '.vpr-progress { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 0.85rem; }',
      '.vpr-progress-dots { display: flex; gap: 6px; }',
      '.vpr-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--bg-elevated); border: 1.5px solid #475569; transition: background 0.2s, border-color 0.2s; }',
      '.vpr-dot.done-ok { background: var(--success); border-color: var(--success); }',
      '.vpr-dot.done-fail { background: var(--error); border-color: var(--error); }',
      '.vpr-dot.active { background: var(--primary-500); border-color: var(--primary-500); }',
      /* Responsive cell sizing */
      '@media (max-width: 480px) { .vpr-cell { width: 38px; height: 38px; } }',
    ].join('\n');
    document.head.appendChild(style);
  })();

  /* ─── Level config ──────────────────────────────────────────────────────── */
  var LEVELS = (function () {
    var raw = [
      // [gridSize, patternCells, displayMs, trialsPerLevel]
      [3,  3, 2000, 3],  // L1
      [3,  3, 2000, 3],  // L2
      [3,  4, 1800, 3],  // L3
      [3,  4, 1800, 3],  // L4
      [4,  4, 1600, 3],  // L5
      [4,  4, 1600, 3],  // L6
      [4,  5, 1400, 4],  // L7
      [4,  5, 1400, 4],  // L8
      [4,  6, 1200, 4],  // L9
      [4,  6, 1200, 4],  // L10
      [5,  6, 1100, 4],  // L11
      [5,  6, 1100, 4],  // L12
      [5,  7, 1000, 4],  // L13
      [5,  7, 1000, 4],  // L14
      [5,  8,  900, 4],  // L15
      [5,  8,  900, 4],  // L16
      [5,  9,  800, 5],  // L17
      [5,  9,  800, 5],  // L18
      [6,  9,  750, 5],  // L19
      [6,  9,  750, 5],  // L20
      [6, 11,  700, 5],  // L21
      [6, 11,  700, 5],  // L22
      [6, 12,  650, 5],  // L23
      [6, 12,  650, 5],  // L24
      [7, 13,  600, 6],  // L25
      [7, 13,  600, 6],  // L26
      [7, 14,  550, 6],  // L27
      [7, 14,  550, 6],  // L28
      [8, 16,  500, 6],  // L29
      [8, 16,  500, 6],  // L30
    ];
    return raw.map(function (c, i) {
      return {
        level: i + 1,
        gridSize: c[0],
        patternCells: c[1],
        displayMs: c[2],
        trialsPerLevel: c[3]
      };
    });
  })();

  /* ─── State ─────────────────────────────────────────────────────────────── */
  var engine;
  var state = {
    levelCfg: null,
    pattern: [],          // array of cell indices that are highlighted
    selectedCells: [],    // player's selections
    trialsDone: 0,
    trialScores: [],      // score 0-1 per trial
    phase: 'idle',        // idle | display | blank | recall | feedback
    displayTimer: null,
    feedbackTimer: null
  };

  /* ─── DOM helpers ───────────────────────────────────────────────────────── */
  function qs(sel) { return document.querySelector(sel); }

  /* ─── Build UI ──────────────────────────────────────────────────────────── */
  function buildUI() {
    var area = qs('#game-area');
    area.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'vpr-wrapper';

    // Phase label
    var phaseLabel = document.createElement('div');
    phaseLabel.id = 'vpr-phase-label';
    phaseLabel.className = 'vpr-phase-label';
    phaseLabel.textContent = '';

    // Grid
    var grid = document.createElement('div');
    grid.id = 'vpr-grid';
    grid.className = 'vpr-grid';
    var gs = state.levelCfg.gridSize;
    grid.style.gridTemplateColumns = 'repeat(' + gs + ', auto)';

    var totalCells = gs * gs;
    for (var i = 0; i < totalCells; i++) {
      var cell = document.createElement('div');
      cell.className = 'vpr-cell';
      cell.dataset.idx = i;
      grid.appendChild(cell);
    }

    // Cell count indicator
    var countRow = document.createElement('div');
    countRow.className = 'vpr-count';
    countRow.id = 'vpr-count';
    countRow.innerHTML = 'Selected: <span id="vpr-count-val">0</span> / <span id="vpr-count-target">0</span>';

    // Submit button row
    var submitRow = document.createElement('div');
    submitRow.className = 'vpr-submit-row';
    var submitBtn = document.createElement('button');
    submitBtn.id = 'vpr-submit-btn';
    submitBtn.className = 'btn btn--primary vpr-submit-btn';
    submitBtn.textContent = 'Submit Answer';
    submitBtn.addEventListener('click', evaluateTrial);
    submitRow.appendChild(submitBtn);

    // Progress dots
    var progressRow = document.createElement('div');
    progressRow.className = 'vpr-progress';
    var progressLabel = document.createElement('span');
    progressLabel.id = 'vpr-progress-label';
    progressLabel.textContent = 'Trial ';
    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'vpr-progress-dots';
    dotsWrap.id = 'vpr-dots';
    progressRow.appendChild(progressLabel);
    progressRow.appendChild(dotsWrap);

    wrapper.appendChild(phaseLabel);
    wrapper.appendChild(grid);
    wrapper.appendChild(countRow);
    wrapper.appendChild(submitRow);
    wrapper.appendChild(progressRow);
    area.appendChild(wrapper);
  }

  function buildDots(total) {
    var dotsWrap = qs('#vpr-dots');
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('div');
      dot.className = 'vpr-dot';
      dot.id = 'vpr-dot-' + i;
      dotsWrap.appendChild(dot);
    }
  }

  function updateDot(trialIdx, status) {
    var dot = qs('#vpr-dot-' + trialIdx);
    if (!dot) return;
    dot.classList.remove('active', 'done-ok', 'done-fail');
    if (status) dot.classList.add(status);
  }

  function setPhaseLabel(text, cls) {
    var el = qs('#vpr-phase-label');
    if (!el) return;
    el.textContent = text;
    el.className = 'vpr-phase-label' + (cls ? ' ' + cls : '');
  }

  function updateCountDisplay() {
    var countVal = qs('#vpr-count-val');
    var countTarget = qs('#vpr-count-target');
    if (countVal) countVal.textContent = state.selectedCells.length;
    if (countTarget) countTarget.textContent = state.levelCfg.patternCells;
  }

  /* ─── Pattern generation ─────────────────────────────────────────────────── */
  function generatePattern(gridSize, patternCells) {
    var total = gridSize * gridSize;
    var indices = [];
    for (var i = 0; i < total; i++) indices.push(i);
    // Fisher-Yates shuffle, take first patternCells
    for (var j = indices.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
    }
    return indices.slice(0, patternCells);
  }

  /* ─── Display phase ─────────────────────────────────────────────────────── */
  function startDisplayPhase() {
    var cfg = state.levelCfg;
    state.phase = 'display';
    state.pattern = generatePattern(cfg.gridSize, cfg.patternCells);
    state.selectedCells = [];
    setCellsClickable(false);
    clearFeedbackClasses();
    clearSelections();
    setPhaseLabel('Memorize the pattern!', 'display');
    updateDot(state.trialsDone, 'active');
    updateCountDisplay();

    // Show pattern
    state.pattern.forEach(function (idx) {
      var cell = getCellEl(idx);
      if (cell) cell.classList.add('active');
    });

    // Hide after displayMs, then brief blank, then recall
    state.displayTimer = setTimeout(function () {
      state.pattern.forEach(function (idx) {
        var cell = getCellEl(idx);
        if (cell) cell.classList.remove('active');
      });
      state.phase = 'blank';
      setPhaseLabel('', '');
      state.displayTimer = setTimeout(function () {
        startRecallPhase();
      }, 500);
    }, cfg.displayMs);
  }

  /* ─── Recall phase ──────────────────────────────────────────────────────── */
  function startRecallPhase() {
    state.phase = 'recall';
    setCellsClickable(true);
    setPhaseLabel('Recreate the pattern (' + state.levelCfg.patternCells + ' cells)', 'recall');
    updateCountDisplay();
  }

  function setCellsClickable(clickable) {
    var cells = document.querySelectorAll('#vpr-grid .vpr-cell');
    cells.forEach(function (cell) {
      if (clickable) {
        cell.classList.add('clickable');
        cell.onclick = function () { onCellClick(parseInt(cell.dataset.idx, 10)); };
      } else {
        cell.classList.remove('clickable');
        cell.onclick = null;
      }
    });
  }

  function getCellEl(idx) {
    return document.querySelector('#vpr-grid .vpr-cell[data-idx="' + idx + '"]');
  }

  function clearFeedbackClasses() {
    var cells = document.querySelectorAll('#vpr-grid .vpr-cell');
    cells.forEach(function (c) {
      c.classList.remove('active', 'fb-correct', 'fb-wrong', 'fb-missed');
    });
  }

  function clearSelections() {
    var cells = document.querySelectorAll('#vpr-grid .vpr-cell');
    cells.forEach(function (c) { c.classList.remove('selected'); });
  }

  function onCellClick(idx) {
    if (state.phase !== 'recall') return;
    var cfg = state.levelCfg;
    var cell = getCellEl(idx);
    if (!cell) return;

    var selIdx = state.selectedCells.indexOf(idx);
    if (selIdx === -1) {
      // Select
      if (state.selectedCells.length >= cfg.patternCells) {
        // Already at max — deselect oldest to allow swap
        // Simply don't allow more — user must deselect first
        return;
      }
      state.selectedCells.push(idx);
      cell.classList.add('selected');
      BrainForge.Audio.click();
    } else {
      // Deselect
      state.selectedCells.splice(selIdx, 1);
      cell.classList.remove('selected');
    }

    updateCountDisplay();
    updateSubmitButton();

    // Auto-evaluate when exactly K cells selected
    if (state.selectedCells.length === cfg.patternCells) {
      setCellsClickable(false);
      setTimeout(evaluateTrial, 200);
    }
  }

  function updateSubmitButton() {
    var btn = qs('#vpr-submit-btn');
    if (!btn) return;
    var cfg = state.levelCfg;
    if (state.selectedCells.length === cfg.patternCells) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  /* ─── Evaluation ────────────────────────────────────────────────────────── */
  function evaluateTrial() {
    if (state.phase !== 'recall') return;
    state.phase = 'feedback';
    setCellsClickable(false);

    var cfg = state.levelCfg;
    var patternSet = {};
    state.pattern.forEach(function (i) { patternSet[i] = true; });
    var selectedSet = {};
    state.selectedCells.forEach(function (i) { selectedSet[i] = true; });

    var correct = 0;
    var total = state.pattern.length;

    // Show feedback on cells
    clearSelections();

    // Correctly selected (green)
    state.selectedCells.forEach(function (idx) {
      var cell = getCellEl(idx);
      if (!cell) return;
      if (patternSet[idx]) {
        cell.classList.add('fb-correct');
        correct++;
      } else {
        cell.classList.add('fb-wrong');
      }
    });

    // Missed cells (orange/dashed)
    state.pattern.forEach(function (idx) {
      if (!selectedSet[idx]) {
        var cell = getCellEl(idx);
        if (cell) cell.classList.add('fb-missed');
      }
    });

    var trialScore = correct / total;
    state.trialScores.push(trialScore);

    if (trialScore === 1) {
      BrainForge.Audio.correct();
      updateDot(state.trialsDone, 'done-ok');
    } else {
      BrainForge.Audio.wrong();
      updateDot(state.trialsDone, 'done-fail');
    }

    setPhaseLabel('', '');
    state.trialsDone++;

    state.feedbackTimer = setTimeout(function () {
      clearFeedbackClasses();
      afterTrial();
    }, 1200);
  }

  function afterTrial() {
    var cfg = state.levelCfg;
    if (state.trialsDone >= cfg.trialsPerLevel) {
      finishLevel();
    } else {
      setTimeout(startDisplayPhase, 400);
    }
  }

  function finishLevel() {
    var total = state.trialScores.length;
    var sum = state.trialScores.reduce(function (acc, s) { return acc + s; }, 0);
    var scorePercent = Math.round((sum / total) * 100);
    setPhaseLabel('', '');
    engine.completeLevel(scorePercent);
  }

  /* ─── Engine start ──────────────────────────────────────────────────────── */
  function startLevel(level) {
    var cfg = LEVELS[level - 1];
    state.levelCfg = cfg;
    state.trialsDone = 0;
    state.trialScores = [];
    state.pattern = [];
    state.selectedCells = [];
    state.phase = 'idle';
    if (state.displayTimer) { clearTimeout(state.displayTimer); state.displayTimer = null; }
    if (state.feedbackTimer) { clearTimeout(state.feedbackTimer); state.feedbackTimer = null; }

    buildUI();
    buildDots(cfg.trialsPerLevel);
    updateCountDisplay();

    setTimeout(startDisplayPhase, 500);
  }

  /* ─── Init ──────────────────────────────────────────────────────────────── */
  engine = new BrainForge.GameEngine({
    gameId: 'visual-pattern-recall',
    totalLevels: 30,
    passThreshold: 80,
    onGameStart: function (level) {
      startLevel(level);
    }
  });

})();
