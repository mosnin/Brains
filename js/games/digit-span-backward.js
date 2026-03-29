(function () {
  'use strict';

  var LEVELS = [
    { span: 3,  ms: 800 }, // L1
    { span: 3,  ms: 700 }, // L2
    { span: 4,  ms: 800 }, // L3
    { span: 4,  ms: 700 }, // L4
    { span: 4,  ms: 600 }, // L5
    { span: 5,  ms: 700 }, // L6
    { span: 5,  ms: 600 }, // L7
    { span: 6,  ms: 700 }, // L8
    { span: 6,  ms: 600 }, // L9
    { span: 6,  ms: 500 }, // L10
    { span: 7,  ms: 600 }, // L11
    { span: 7,  ms: 500 }, // L12
    { span: 8,  ms: 600 }, // L13
    { span: 8,  ms: 500 }, // L14
    { span: 8,  ms: 450 }, // L15
    { span: 9,  ms: 500 }, // L16
    { span: 9,  ms: 450 }, // L17
    { span: 10, ms: 500 }, // L18
    { span: 10, ms: 450 }, // L19
    { span: 10, ms: 400 }, // L20
    { span: 11, ms: 450 }, // L21
    { span: 11, ms: 400 }, // L22
    { span: 12, ms: 450 }, // L23
    { span: 12, ms: 400 }, // L24
    { span: 13, ms: 400 }, // L25
    { span: 13, ms: 350 }, // L26
    { span: 14, ms: 400 }, // L27
    { span: 14, ms: 350 }, // L28
    { span: 15, ms: 350 }, // L29
    { span: 15, ms: 300 }, // L30
  ];

  var TRIALS_PER_LEVEL = 5;
  var PASS_THRESHOLD   = 0.80;
  var BLANK_GAP_MS     = 200;

  var engine;
  var currentLevel    = 1;
  var currentSequence = [];
  var trialIndex      = 0;
  var correctCount    = 0;
  var displayTimeout  = null;

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
      '<div class="dsb-display-wrap">' +
        '<div class="dsb-trial-info">Trial ' + (trialIndex + 1) + ' of ' + TRIALS_PER_LEVEL + '</div>' +
        '<div class="dsb-reverse-badge">REVERSE ORDER</div>' +
        '<div class="dsb-digit-box" id="dsb-digit-box">&nbsp;</div>' +
        '<div class="dsb-hint">Remember to type them backwards</div>' +
      '</div>';

    flashSequence(currentSequence, LEVELS[currentLevel - 1].ms, function () {
      showInputPhase();
    });
  }

  function flashSequence(seq, msPerDigit, done) {
    var box   = document.getElementById('dsb-digit-box');
    var index = 0;

    function showNext() {
      if (index >= seq.length) {
        box.textContent = '';
        box.classList.remove('dsb-digit-box--active');
        done();
        return;
      }
      box.textContent = seq[index];
      box.classList.add('dsb-digit-box--active');
      index++;
      displayTimeout = setTimeout(function () {
        box.textContent = '';
        box.classList.remove('dsb-digit-box--active');
        displayTimeout = setTimeout(showNext, BLANK_GAP_MS);
      }, msPerDigit);
    }

    showNext();
  }

  /* ── input phase ──────────────────────────────────────── */

  function showInputPhase() {
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsb-input-wrap">' +
        '<div class="dsb-trial-info">Trial ' + (trialIndex + 1) + ' of ' + TRIALS_PER_LEVEL + '</div>' +
        '<div class="dsb-reverse-badge dsb-reverse-badge--large">↩ TYPE IN REVERSE ORDER</div>' +
        '<div class="dsb-prompt">Type the <strong>last digit first</strong></div>' +
        '<div class="dsb-typed-display" id="dsb-typed-display">&nbsp;</div>' +
        '<div class="input-area">' +
          '<input type="text" id="dsb-input" class="dsb-input" maxlength="30" autocomplete="off" inputmode="numeric" placeholder="Type here…" />' +
          '<button class="btn btn--primary" id="dsb-submit-btn">Submit</button>' +
        '</div>' +
        '<div class="dsb-numpad" id="dsb-numpad"></div>' +
      '</div>';

    buildNumpad();

    var input     = document.getElementById('dsb-input');
    var submitBtn = document.getElementById('dsb-submit-btn');

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
    var el = document.getElementById('dsb-typed-display');
    if (!el) return;
    if (!val) { el.innerHTML = '&nbsp;'; return; }
    el.textContent = val.split('').join(' ');
  }

  function buildNumpad() {
    var pad  = document.getElementById('dsb-numpad');
    var keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
    keys.forEach(function (k) {
      var btn = document.createElement('button');
      btn.className = 'dsb-numpad-btn' + (k === '✓' ? ' dsb-numpad-btn--submit' : '') + (k === '⌫' ? ' dsb-numpad-btn--back' : '');
      btn.textContent = k;
      btn.type = 'button';
      btn.addEventListener('click', function () {
        BrainForge.Audio.click();
        var input = document.getElementById('dsb-input');
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
    var input = document.getElementById('dsb-input');
    if (!input) return;
    var answer = input.value.trim();
    if (answer.length === 0) return;

    var reversed = currentSequence.slice().reverse().join('');
    var correct  = (answer === reversed);

    if (correct) {
      BrainForge.Audio.correct();
      correctCount++;
    } else {
      BrainForge.Audio.wrong();
    }

    showFeedback(correct, reversed, currentSequence.join(''), answer);
  }

  function showFeedback(correct, reversed, original, given) {
    var area = getGameArea();
    area.innerHTML =
      '<div class="dsb-feedback-wrap">' +
        '<div class="dsb-feedback-icon ' + (correct ? 'dsb-feedback-icon--correct' : 'dsb-feedback-icon--wrong') + '">' +
          (correct ? '✓' : '✗') +
        '</div>' +
        '<div class="dsb-feedback-label">' + (correct ? 'Correct!' : 'Incorrect') + '</div>' +
        (!correct
          ? '<div class="dsb-feedback-detail">' +
              'Shown: <span class="dsb-seq">' + original + '</span><br>' +
              'Expected (reversed): <span class="dsb-seq">' + reversed + '</span><br>' +
              'You typed: <span class="dsb-seq">' + given + '</span>' +
            '</div>'
          : '') +
        '<div class="dsb-feedback-score">' + correctCount + ' / ' + (trialIndex + 1) + ' correct</div>' +
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
      gameId:        'digit-span-backward',
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
      '<div class="dsb-instructions">' +
        '<h2 class="dsb-instructions__title">Level ' + levelNum + '</h2>' +
        '<div class="dsb-instructions__badge">↩ BACKWARD</div>' +
        '<p>You will see <strong>' + cfg.span + ' digit' + (cfg.span > 1 ? 's' : '') + '</strong> shown one at a time.</p>' +
        '<p>After all digits are shown, type them in <strong>reverse order</strong> — last digit first.</p>' +
        '<p class="dsb-instructions__meta">Each digit appears for ' + cfg.ms + ' ms &nbsp;|&nbsp; ' + TRIALS_PER_LEVEL + ' trials</p>' +
        '<button class="btn btn--primary dsb-start-btn" id="dsb-start-btn">Start Level</button>' +
      '</div>';

    document.getElementById('dsb-start-btn').addEventListener('click', function () {
      BrainForge.Audio.click();
      startTrial();
    });
  }

  /* ── styles ───────────────────────────────────────────── */

  var css = [
    /* layout wrappers */
    '.dsb-display-wrap,.dsb-input-wrap,.dsb-feedback-wrap,.dsb-instructions{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.5rem 1rem;min-height:340px;}',
    '.dsb-trial-info{font-size:.85rem;color:var(--text-secondary);letter-spacing:.05em;text-transform:uppercase;}',
    /* reverse badge */
    '.dsb-reverse-badge{background:rgba(20,184,166,.15);color:var(--accent-500);border:1px solid rgba(20,184,166,.35);border-radius:999px;padding:.25rem 1rem;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}',
    '.dsb-reverse-badge--large{font-size:.95rem;padding:.4rem 1.4rem;}',
    /* big digit */
    '.dsb-digit-box{width:140px;height:140px;border-radius:var(--radius-lg);border:3px solid var(--bg-elevated);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:700;color:var(--text-primary);transition:border-color .1s,box-shadow .1s;}',
    '.dsb-digit-box--active{border-color:var(--accent-500);box-shadow:0 0 24px rgba(20,184,166,.45);color:var(--accent-500);}',
    '.dsb-hint{font-size:.9rem;color:var(--text-secondary);}',
    /* typed display */
    '.dsb-prompt{font-size:1rem;color:var(--text-secondary);text-align:center;}',
    '.dsb-typed-display{min-width:240px;min-height:48px;background:var(--bg-elevated);border-radius:var(--radius-lg);padding:.6rem 1.2rem;font-size:1.6rem;font-weight:600;letter-spacing:.2em;color:var(--text-primary);text-align:center;}',
    /* text input */
    '.dsb-input{flex:1;padding:.6rem 1rem;border-radius:var(--radius-lg);border:2px solid var(--bg-elevated);background:var(--bg-surface);color:var(--text-primary);font-size:1.2rem;outline:none;min-width:0;}',
    '.dsb-input:focus{border-color:var(--accent-500);}',
    /* numpad */
    '.dsb-numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;max-width:240px;width:100%;}',
    '.dsb-numpad-btn{padding:.75rem;border-radius:var(--radius-lg);border:2px solid var(--bg-elevated);background:var(--bg-surface);color:var(--text-primary);font-size:1.1rem;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;}',
    '.dsb-numpad-btn:hover{background:var(--bg-elevated);border-color:var(--accent-500);}',
    '.dsb-numpad-btn--submit{background:var(--accent-500);border-color:var(--accent-500);color:#fff;}',
    '.dsb-numpad-btn--submit:hover{filter:brightness(1.1);}',
    '.dsb-numpad-btn--back{color:var(--primary-500);}',
    /* feedback */
    '.dsb-feedback-icon{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:700;}',
    '.dsb-feedback-icon--correct{background:rgba(34,197,94,.15);color:var(--success);}',
    '.dsb-feedback-icon--wrong{background:rgba(239,68,68,.15);color:var(--error);}',
    '.dsb-feedback-label{font-size:1.4rem;font-weight:700;color:var(--text-primary);}',
    '.dsb-feedback-detail{font-size:.95rem;color:var(--text-secondary);text-align:center;line-height:1.8;}',
    '.dsb-seq{font-family:monospace;font-size:1.1rem;color:var(--text-primary);letter-spacing:.12em;}',
    '.dsb-feedback-score{font-size:.9rem;color:var(--text-secondary);}',
    /* instructions */
    '.dsb-instructions{text-align:center;gap:1.2rem;}',
    '.dsb-instructions__title{font-size:1.8rem;font-weight:700;color:var(--text-primary);}',
    '.dsb-instructions__badge{background:rgba(20,184,166,.15);color:var(--accent-500);border:1px solid rgba(20,184,166,.35);border-radius:999px;padding:.3rem 1.2rem;font-size:.9rem;font-weight:700;letter-spacing:.08em;display:inline-block;}',
    '.dsb-instructions p{color:var(--text-secondary);max-width:380px;}',
    '.dsb-instructions strong{color:var(--text-primary);}',
    '.dsb-instructions__meta{font-size:.85rem;color:var(--text-secondary);font-style:italic;}',
    '.dsb-start-btn{margin-top:.5rem;min-width:160px;}',
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
