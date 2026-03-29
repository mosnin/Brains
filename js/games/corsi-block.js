(function () {
  'use strict';

  /* ─── Styles ────────────────────────────────────────────────────────────── */
  (function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.cb-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; }',
      '.cb-phase-label { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); min-height: 22px; }',
      '.cb-phase-label.encoding { color: var(--accent-500); }',
      '.cb-phase-label.recall { color: var(--primary-500); }',
      '.cb-phase-label.feedback { color: var(--text-secondary); }',
      '.cb-container { position: relative; width: 100%; min-height: 360px; }',
      '.cb-block { position: absolute; width: 52px; height: 52px; border-radius: 8px; background: var(--bg-elevated); border: 2px solid #475569; cursor: default; transition: background 0.12s, border-color 0.12s, transform 0.08s; user-select: none; -webkit-user-select: none; }',
      '.cb-block.active { background: var(--accent-500); border-color: var(--accent-500); box-shadow: 0 0 18px rgba(20,184,166,0.6); }',
      '.cb-block.correct { background: var(--success); border-color: var(--success); box-shadow: 0 0 14px rgba(34,197,94,0.5); }',
      '.cb-block.wrong { background: var(--error); border-color: var(--error); box-shadow: 0 0 14px rgba(239,68,68,0.5); }',
      '.cb-block.clickable { cursor: pointer; }',
      '.cb-block.clickable:hover { border-color: var(--primary-500); transform: scale(1.05); }',
      '.cb-block.numbered::after { content: attr(data-order); position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: #fff; pointer-events: none; }',
      '.cb-progress { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 0.85rem; }',
      '.cb-progress-dots { display: flex; gap: 6px; }',
      '.cb-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--bg-elevated); border: 1.5px solid #475569; transition: background 0.2s, border-color 0.2s; }',
      '.cb-dot.done-ok { background: var(--success); border-color: var(--success); }',
      '.cb-dot.done-fail { background: var(--error); border-color: var(--error); }',
      '.cb-dot.active { background: var(--primary-500); border-color: var(--primary-500); }',
    ].join('\n');
    document.head.appendChild(style);
  })();

  /* ─── Block positions (Milner-style irregular layout) ───────────────────── */
  var BLOCK_POSITIONS = [
    {x: 15, y: 20}, {x: 55, y: 15}, {x: 80, y: 30},
    {x: 25, y: 50}, {x: 65, y: 45}, {x: 40, y: 70},
    {x: 10, y: 75}, {x: 75, y: 72}, {x: 50, y: 35}
  ];

  /* ─── Level config ──────────────────────────────────────────────────────── */
  var LEVELS = (function () {
    var raw = [
      // [seqLen, highlightMs, gapMs, seqPerLevel]
      [2, 1000, 500, 3],  // L1
      [2, 1000, 500, 3],  // L2
      [3,  900, 450, 3],  // L3
      [3,  900, 450, 3],  // L4
      [4,  850, 400, 4],  // L5
      [4,  850, 400, 4],  // L6
      [4,  800, 400, 4],  // L7
      [4,  800, 400, 4],  // L8
      [5,  750, 350, 4],  // L9
      [5,  750, 350, 4],  // L10
      [5,  700, 350, 5],  // L11
      [5,  700, 350, 5],  // L12
      [6,  700, 300, 5],  // L13
      [6,  700, 300, 5],  // L14
      [6,  650, 300, 5],  // L15
      [6,  650, 300, 5],  // L16
      [7,  600, 250, 5],  // L17
      [7,  600, 250, 5],  // L18
      [7,  550, 250, 6],  // L19
      [7,  550, 250, 6],  // L20
      [8,  500, 200, 6],  // L21
      [8,  500, 200, 6],  // L22
      [8,  450, 200, 6],  // L23
      [8,  450, 200, 6],  // L24
      [9,  400, 150, 7],  // L25
      [9,  400, 150, 7],  // L26
      [9,  350, 150, 7],  // L27
      [9,  350, 150, 7],  // L28
      [9,  300, 100, 8],  // L29
      [9,  300, 100, 8],  // L30
    ];
    return raw.map(function (c, i) {
      return {
        level: i + 1,
        seqLen: c[0],
        highlightMs: c[1],
        gapMs: c[2],
        seqPerLevel: c[3]
      };
    });
  })();

  /* ─── State ─────────────────────────────────────────────────────────────── */
  var engine;
  var state = {
    levelCfg: null,
    sequence: [],
    encodingIndex: 0,
    recallIndex: 0,
    recallInput: [],
    seqsDone: 0,
    seqsCorrect: 0,
    phase: 'idle',   // idle | encoding | recall | feedback
    encodingTimer: null
  };

  /* ─── DOM helpers ───────────────────────────────────────────────────────── */
  function qs(sel) { return document.querySelector(sel); }

  /* ─── Build game UI ─────────────────────────────────────────────────────── */
  function buildUI() {
    var area = qs('#game-area');
    area.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'cb-wrapper';

    // Phase label
    var phaseLabel = document.createElement('div');
    phaseLabel.id = 'cb-phase-label';
    phaseLabel.className = 'cb-phase-label';
    phaseLabel.textContent = '';

    // Block container
    var container = document.createElement('div');
    container.id = 'cb-container';
    container.className = 'cb-container';

    // Create 9 blocks
    for (var i = 0; i < 9; i++) {
      var block = document.createElement('div');
      block.className = 'cb-block';
      block.id = 'cb-block-' + i;
      block.dataset.idx = i;
      positionBlock(block, i, container);
      container.appendChild(block);
    }

    // Progress row
    var progressRow = document.createElement('div');
    progressRow.className = 'cb-progress';
    var progressLabel = document.createElement('span');
    progressLabel.id = 'cb-progress-label';
    progressLabel.textContent = '';
    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'cb-progress-dots';
    dotsWrap.id = 'cb-dots';
    progressRow.appendChild(progressLabel);
    progressRow.appendChild(dotsWrap);

    wrapper.appendChild(phaseLabel);
    wrapper.appendChild(container);
    wrapper.appendChild(progressRow);
    area.appendChild(wrapper);
  }

  function positionBlock(block, idx, container) {
    var pos = BLOCK_POSITIONS[idx];
    // Use percentage positioning; offset by half block size
    block.style.left = 'calc(' + pos.x + '% - 26px)';
    block.style.top = 'calc(' + pos.y + '% - 26px)';
  }

  function buildDots(total) {
    var dotsWrap = qs('#cb-dots');
    var label = qs('#cb-progress-label');
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var dot = document.createElement('div');
      dot.className = 'cb-dot';
      dot.id = 'cb-dot-' + i;
      dotsWrap.appendChild(dot);
    }
    if (label) label.textContent = 'Sequence ';
  }

  function updateDot(seqIdx, status) {
    var dot = qs('#cb-dot-' + seqIdx);
    if (!dot) return;
    dot.classList.remove('active', 'done-ok', 'done-fail');
    if (status) dot.classList.add(status);
  }

  function setPhaseLabel(text, cls) {
    var el = qs('#cb-phase-label');
    if (!el) return;
    el.textContent = text;
    el.className = 'cb-phase-label' + (cls ? ' ' + cls : '');
  }

  function setBlocksClickable(clickable) {
    for (var i = 0; i < 9; i++) {
      var b = qs('#cb-block-' + i);
      if (!b) continue;
      if (clickable) {
        b.classList.add('clickable');
        (function (idx) {
          b.onclick = function () { onBlockClick(idx); };
        })(i);
      } else {
        b.classList.remove('clickable');
        b.onclick = null;
      }
    }
  }

  function clearBlockHighlights() {
    for (var i = 0; i < 9; i++) {
      var b = qs('#cb-block-' + i);
      if (b) b.classList.remove('active', 'correct', 'wrong', 'numbered');
    }
  }

  /* ─── Sequence generation ───────────────────────────────────────────────── */
  function generateSequence(len) {
    var seq = [];
    var prev = -1;
    for (var i = 0; i < len; i++) {
      var idx;
      do {
        idx = Math.floor(Math.random() * 9);
      } while (idx === prev);
      prev = idx;
      seq.push(idx);
    }
    return seq;
  }

  /* ─── Encoding phase ────────────────────────────────────────────────────── */
  function startEncoding() {
    state.phase = 'encoding';
    state.encodingIndex = 0;
    setBlocksClickable(false);
    clearBlockHighlights();
    setPhaseLabel('Watch the sequence…', 'encoding');
    updateDot(state.seqsDone, 'active');
    encodeNextBlock();
  }

  function encodeNextBlock() {
    var cfg = state.levelCfg;
    var idx = state.encodingIndex;

    if (idx >= state.sequence.length) {
      // Done encoding — short pause then recall
      state.encodingTimer = setTimeout(function () {
        clearBlockHighlights();
        startRecall();
      }, cfg.gapMs);
      return;
    }

    // Light up block
    var blockIdx = state.sequence[idx];
    var block = qs('#cb-block-' + blockIdx);
    if (block) block.classList.add('active');

    state.encodingTimer = setTimeout(function () {
      if (block) block.classList.remove('active');
      state.encodingIndex++;
      state.encodingTimer = setTimeout(encodeNextBlock, cfg.gapMs);
    }, cfg.highlightMs);
  }

  /* ─── Recall phase ──────────────────────────────────────────────────────── */
  function startRecall() {
    state.phase = 'recall';
    state.recallIndex = 0;
    state.recallInput = [];
    setBlocksClickable(true);
    setPhaseLabel('Tap the blocks in order (' + state.sequence.length + ' blocks)', 'recall');
  }

  function onBlockClick(blockIdx) {
    if (state.phase !== 'recall') return;

    var expected = state.sequence[state.recallIndex];
    var block = qs('#cb-block-' + blockIdx);

    if (blockIdx === expected) {
      BrainForge.Audio.correct();
      if (block) {
        block.classList.add('correct');
        setTimeout(function () {
          if (block) block.classList.remove('correct');
        }, 300);
      }
      state.recallInput.push(blockIdx);
      state.recallIndex++;

      if (state.recallIndex >= state.sequence.length) {
        // Full sequence correct
        setBlocksClickable(false);
        state.seqsCorrect++;
        evaluateSequence(true);
      }
    } else {
      // Wrong block
      BrainForge.Audio.wrong();
      setBlocksClickable(false);
      if (block) block.classList.add('wrong');
      evaluateSequence(false);
    }
  }

  /* ─── Evaluation / feedback ─────────────────────────────────────────────── */
  function evaluateSequence(correct) {
    state.phase = 'feedback';
    updateDot(state.seqsDone, correct ? 'done-ok' : 'done-fail');
    state.seqsDone++;

    if (!correct) {
      // Show correct sequence briefly with numbers
      showCorrectSequence();
    } else {
      afterFeedback();
    }
  }

  function showCorrectSequence() {
    setPhaseLabel('Correct order was…', 'feedback');
    clearBlockHighlights();

    var seq = state.sequence;
    for (var i = 0; i < seq.length; i++) {
      (function (order, blockIdx) {
        setTimeout(function () {
          var b = qs('#cb-block-' + blockIdx);
          if (b) {
            b.classList.add('active', 'numbered');
            b.dataset.order = order + 1;
          }
        }, order * 220);
      })(i, seq[i]);
    }

    setTimeout(function () {
      clearBlockHighlights();
      afterFeedback();
    }, seq.length * 220 + 800);
  }

  function afterFeedback() {
    var cfg = state.levelCfg;
    if (state.seqsDone >= cfg.seqPerLevel) {
      finishLevel();
    } else {
      // Next sequence
      clearBlockHighlights();
      state.sequence = generateSequence(cfg.seqLen);
      setTimeout(startEncoding, 600);
    }
  }

  function finishLevel() {
    var scorePercent = Math.round((state.seqsCorrect / state.levelCfg.seqPerLevel) * 100);
    setPhaseLabel('', '');
    engine.completeLevel(scorePercent);
  }

  /* ─── Engine start ──────────────────────────────────────────────────────── */
  function startLevel(level) {
    var cfg = LEVELS[level - 1];
    state.levelCfg = cfg;
    state.seqsDone = 0;
    state.seqsCorrect = 0;
    state.phase = 'idle';
    if (state.encodingTimer) { clearTimeout(state.encodingTimer); state.encodingTimer = null; }

    buildUI();
    buildDots(cfg.seqPerLevel);
    state.sequence = generateSequence(cfg.seqLen);

    setTimeout(startEncoding, 500);
  }

  /* ─── Init ──────────────────────────────────────────────────────────────── */
  engine = new BrainForge.GameEngine({
    gameId: 'corsi-block',
    totalLevels: 30,
    passThreshold: 80,
    onGameStart: function (level) {
      startLevel(level);
    }
  });

})();
