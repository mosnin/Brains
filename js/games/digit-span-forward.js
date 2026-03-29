(function () {
  'use strict';

  var LEVELS = [
    { span: 3,  ms: 800 }, // L1
    { span: 3,  ms: 700 }, // L2
    { span: 4,  ms: 800 }, // L3
    { span: 4,  ms: 700 }, // L4
    { span: 5,  ms: 800 }, // L5
    { span: 5,  ms: 700 }, // L6
    { span: 6,  ms: 700 }, // L7
    { span: 6,  ms: 600 }, // L8
    { span: 7,  ms: 700 }, // L9
    { span: 7,  ms: 600 }, // L10
    { span: 8,  ms: 600 }, // L11
    { span: 8,  ms: 500 }, // L12
    { span: 9,  ms: 600 }, // L13
    { span: 9,  ms: 500 }, // L14
    { span: 10, ms: 600 }, // L15
    { span: 10, ms: 500 }, // L16
    { span: 11, ms: 500 }, // L17
    { span: 11, ms: 450 }, // L18
    { span: 12, ms: 500 }, // L19
    { span: 12, ms: 450 }, // L20
    { span: 13, ms: 450 }, // L21
    { span: 13, ms: 400 }, // L22
    { span: 14, ms: 450 }, // L23
    { span: 14, ms: 400 }, // L24
    { span: 15, ms: 400 }, // L25
    { span: 15, ms: 350 }, // L26
    { span: 16, ms: 400 }, // L27
    { span: 16, ms: 350 }, // L28
    { span: 17, ms: 350 }, // L29
    { span: 18, ms: 300 }, // L30
  ];

  var TRIALS_PER_LEVEL = 5;
  var PASS_THRESHOLD   = 0.80;
  var BLANK_GAP_MS     = 200;

  var engine;
  var currentLevel     = 1;
  var currentSequence  = [];
  var trialIndex       = 0;
  var correctCount     = 0;
  var displayTimeout   = null;

  /* ── helpers ─────────────────────────────────────────── */

  function randDigit() {
    return Math.floor(Math.random() * 10);
  }

  function generateSequence(span) {
    var seq = [];
    for (var i = 0; i < span; i++) {
      seq.push(randDigit());
    }
    return seq;
  }

  function getGameArea() {
    return document.getElementById('game-area');
  }

  /* ── display phase ────────────────────────────────────── */

  function startTrial() {
    currentSequence = generateSequence(LEVELS[currentLevel - 1].span);
    showDisplayPhase();
  }

  function showDisplayPhase() {
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsf-display-wrap">' +
        '<div class="dsf-trial-info">Trial ' + (trialIndex + 1) + ' of ' + TRIALS_PER_LEVEL + '</div>' +
        '<div class="dsf-digit-box" id="dsf-digit-box">&nbsp;</div>' +
        '<div class="dsf-hint">Watch the digits carefully</div>' +
      '</div>';

    flashSequence(currentSequence, LEVELS[currentLevel - 1].ms, function () {
      showInputPhase();
    });
  }

  function flashSequence(seq, msPerDigit, done) {
    var box   = document.getElementById('dsf-digit-box');
    var index = 0;

    function showNext() {
      if (index >= seq.length) {
        box.textContent = '';
        box.classList.remove('dsf-digit-box--active');
        done();
        return;
      }
      box.textContent = seq[index];
      box.classList.add('dsf-digit-box--active');
      index++;
      displayTimeout = setTimeout(function () {
        box.textContent = '';
        box.classList.remove('dsf-digit-box--active');
        displayTimeout = setTimeout(showNext, BLANK_GAP_MS);
      }, msPerDigit);
    }

    showNext();
  }

  /* ── input phase ──────────────────────────────────────── */

  function showInputPhase() {
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsf-input-wrap">' +
        '<div class="dsf-trial-info">Trial ' + (trialIndex + 1) + ' of ' + TRIALS_PER_LEVEL + '</div>' +
        '<div class="dsf-prompt">Type the digits in the <strong>same order</strong></div>' +
        '<div class="dsf-typed-display" id="dsf-typed-display">&nbsp;</div>' +
        '<div class="input-area">' +
          '<input type="text" id="dsf-input" class="dsf-input" maxlength="30" autocomplete="off" inputmode="numeric" placeholder="Type here…" />' +
          '<button class="btn btn--primary" id="dsf-submit-btn">Submit</button>' +
        '</div>' +
        '<div class="dsf-numpad" id="dsf-numpad"></div>' +
      '</div>';

    buildNumpad();

    var input     = document.getElementById('dsf-input');
    var submitBtn = document.getElementById('dsf-submit-btn');

    input.addEventListener('input', function () {
      var val = input.value.replace(/\D/g, '');
      input.value = val;
      updateTypedDisplay(val);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitAnswer();
    });

    submitBtn.addEventListener('click', submitAnswer);
    input.focus();
  }

  function updateTypedDisplay(val) {
    var el = document.getElementById('dsf-typed-display');
    if (!el) return;
    if (!val) { el.innerHTML = '&nbsp;'; return; }
    el.textContent = val.split('').join(' ');
  }

  function buildNumpad() {
    var pad = document.getElementById('dsf-numpad');
    var keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
    keys.forEach(function (k) {
      var btn = document.createElement('button');
      btn.className = 'dsf-numpad-btn' + (k === '✓' ? ' dsf-numpad-btn--submit' : '') + (k === '⌫' ? ' dsf-numpad-btn--back' : '');
      btn.textContent = k;
      btn.type = 'button';
      btn.addEventListener('click', function () {
        BrainForge.Audio.click();
        var input = document.getElementById('dsf-input');
        if (!input) return;
        if (k === '⌫') {
          input.value = input.value.slice(0, -1);
        } else if (k === '✓') {
          submitAnswer();
          return;
        } else {
          input.value += k;
        }
        updateTypedDisplay(input.value);
        input.focus();
      });
      pad.appendChild(btn);
    });
  }

  /* ── evaluation ───────────────────────────────────────── */

  function submitAnswer() {
    var input = document.getElementById('dsf-input');
    if (!input) return;
    var answer = input.value.trim();
    if (answer.length === 0) return;

    var expected = currentSequence.join('');
    var correct  = (answer === expected);

    if (correct) {
      BrainForge.Audio.correct();
      correctCount++;
    } else {
      BrainForge.Audio.wrong();
    }

    showFeedback(correct, expected, answer);
  }

  function showFeedback(correct, expected, given) {
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsf-feedback-wrap">' +
        '<div class="dsf-feedback-icon ' + (correct ? 'dsf-feedback-icon--correct' : 'dsf-feedback-icon--wrong') + '">' +
          (correct ? '✓' : '✗') +
        '</div>' +
        '<div class="dsf-feedback-label">' + (correct ? 'Correct!' : 'Incorrect') + '</div>' +
        (!correct
          ? '<div class="dsf-feedback-detail">Expected: <span class="dsf-seq">' + expected + '</span><br>You typed: <span class="dsf-seq">' + given + '</span></div>'
          : '') +
        '<div class="dsf-feedback-score">' + correctCount + ' / ' + (trialIndex + 1) + ' correct</div>' +
      '</div>';

    trialIndex++;

    displayTimeout = setTimeout(function () {
      if (trialIndex < TRIALS_PER_LEVEL) {
        startTrial();
      } else {
        finishLevel();
      }
    }, 1400);
  }

  /* ── level completion ─────────────────────────────────── */

  function finishLevel() {
    var scorePercent = (correctCount / TRIALS_PER_LEVEL) * 100;
    engine.completeLevel(scorePercent);
  }

  /* ── engine bootstrap ─────────────────────────────────── */

  function initGame() {
    engine = new BrainForge.GameEngine({
      gameId:        'digit-span-forward',
      totalLevels:   30,
      passThreshold: PASS_THRESHOLD * 100,
      onGameStart: function (levelNum) {
        currentLevel  = levelNum;
        trialIndex    = 0;
        correctCount  = 0;
        if (displayTimeout) { clearTimeout(displayTimeout); displayTimeout = null; }
        showInstructions(levelNum);
      }
    });
  }

  function showInstructions(levelNum) {
    var cfg  = LEVELS[levelNum - 1];
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsf-instructions">' +
        '<h2 class="dsf-instructions__title">Level ' + levelNum + '</h2>' +
        '<p>You will see <strong>' + cfg.span + ' digit' + (cfg.span > 1 ? 's' : '') + '</strong> shown one at a time.</p>' +
        '<p>After all digits are shown, type them in <strong>the same order</strong> they appeared.</p>' +
        '<p class="dsf-instructions__meta">Each digit appears for ' + cfg.ms + ' ms &nbsp;|&nbsp; ' + TRIALS_PER_LEVEL + ' trials</p>' +
        '<button class="btn btn--primary dsf-start-btn" id="dsf-start-btn">Start Level</button>' +
      '</div>';

    document.getElementById('dsf-start-btn').addEventListener('click', function () {
      BrainForge.Audio.click();
      startTrial();
    });
  }

  /* ── styles ───────────────────────────────────────────── */

  var css = [
    /* layout wrappers */
    '.dsf-display-wrap,.dsf-input-wrap,.dsf-feedback-wrap,.dsf-instructions{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.5rem 1rem;min-height:340px;}',
    '.dsf-trial-info{font-size:.85rem;color:var(--text-secondary);letter-spacing:.05em;text-transform:uppercase;}',
    /* big digit */
    '.dsf-digit-box{width:140px;height:140px;border-radius:var(--radius-lg);border:3px solid var(--bg-elevated);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:700;color:var(--text-primary);transition:border-color .1s,box-shadow .1s;}',
    '.dsf-digit-box--active{border-color:var(--primary-500);box-shadow:0 0 24px rgba(79,107,245,.45);color:var(--primary-500);}',
    '.dsf-hint{font-size:.9rem;color:var(--text-secondary);}',
    /* typed display */
    '.dsf-prompt{font-size:1rem;color:var(--text-secondary);text-align:center;}',
    '.dsf-typed-display{min-width:240px;min-height:48px;background:var(--bg-elevated);border-radius:var(--radius-lg);padding:.6rem 1.2rem;font-size:1.6rem;font-weight:600;letter-spacing:.2em;color:var(--text-primary);text-align:center;}',
    /* text input */
    '.dsf-input{flex:1;padding:.6rem 1rem;border-radius:var(--radius-lg);border:2px solid var(--bg-elevated);background:var(--bg-surface);color:var(--text-primary);font-size:1.2rem;outline:none;min-width:0;}',
    '.dsf-input:focus{border-color:var(--primary-500);}',
    /* numpad */
    '.dsf-numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;max-width:240px;width:100%;}',
    '.dsf-numpad-btn{padding:.75rem;border-radius:var(--radius-lg);border:2px solid var(--bg-elevated);background:var(--bg-surface);color:var(--text-primary);font-size:1.1rem;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;}',
    '.dsf-numpad-btn:hover{background:var(--bg-elevated);border-color:var(--primary-500);}',
    '.dsf-numpad-btn--submit{background:var(--primary-500);border-color:var(--primary-500);color:#fff;}',
    '.dsf-numpad-btn--submit:hover{filter:brightness(1.1);}',
    '.dsf-numpad-btn--back{color:var(--accent-500);}',
    /* feedback */
    '.dsf-feedback-icon{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:700;}',
    '.dsf-feedback-icon--correct{background:rgba(34,197,94,.15);color:var(--success);}',
    '.dsf-feedback-icon--wrong{background:rgba(239,68,68,.15);color:var(--error);}',
    '.dsf-feedback-label{font-size:1.4rem;font-weight:700;color:var(--text-primary);}',
    '.dsf-feedback-detail{font-size:.95rem;color:var(--text-secondary);text-align:center;line-height:1.7;}',
    '.dsf-seq{font-family:monospace;font-size:1.1rem;color:var(--text-primary);letter-spacing:.12em;}',
    '.dsf-feedback-score{font-size:.9rem;color:var(--text-secondary);}',
    /* instructions */
    '.dsf-instructions{text-align:center;gap:1.2rem;}',
    '.dsf-instructions__title{font-size:1.8rem;font-weight:700;color:var(--text-primary);}',
    '.dsf-instructions p{color:var(--text-secondary);max-width:380px;}',
    '.dsf-instructions strong{color:var(--text-primary);}',
    '.dsf-instructions__meta{font-size:.85rem;color:var(--text-secondary);font-style:italic;}',
    '.dsf-start-btn{margin-top:.5rem;min-width:160px;}',
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── init ─────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }

}());
