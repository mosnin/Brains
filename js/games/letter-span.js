(function () {
  'use strict';

  var CONSONANTS = 'BCDFGHJKLMNPQRSTVWXZ'.split('');

  var LEVELS = (function () {
    var cfg = [
      [1,  2,  3, 800],
      [3,  4,  4, 700],
      [5,  6,  5, 700],
      [7,  8,  5, 600],
      [9,  10, 6, 600],
      [11, 12, 7, 600],
      [13, 14, 7, 500],
      [15, 16, 8, 500],
      [17, 18, 9, 500],
      [19, 20, 9, 450],
      [21, 22, 10, 450],
      [23, 24, 11, 450],
      [25, 26, 12, 400],
      [27, 28, 13, 400],
      [29, 30, 14, 350]
    ];
    var levels = {};
    cfg.forEach(function (row) {
      var from = row[0], to = row[1], count = row[2], ms = row[3];
      for (var i = from; i <= to; i++) {
        levels[i] = { count: count, displayMs: ms };
      }
    });
    return levels;
  }());

  var QWERTY_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];

  var engine = new BrainForge.GameEngine({
    gameId: 'letter-span',
    totalLevels: 30,
    passThreshold: 80,
    onGameStart: function (level) {
      startLevel(level);
    }
  });

  var state = {
    level: 1,
    trial: 0,
    correctTrials: 0,
    sequence: [],
    inputValue: '',
    phase: 'idle'
  };

  function pickSequence(count) {
    var pool = CONSONANTS.slice();
    var seq = [];
    for (var i = 0; i < count; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      seq.push(pool[idx]);
      // Remove to avoid immediate repeats; refill if needed
      pool.splice(idx, 1);
      if (pool.length === 0) pool = CONSONANTS.slice();
    }
    return seq;
  }

  function startLevel(level) {
    state.level = level;
    state.trial = 0;
    state.correctTrials = 0;
    state.phase = 'idle';
    renderGameArea();
    startTrial();
  }

  function startTrial() {
    var cfg = LEVELS[state.level];
    state.sequence = pickSequence(cfg.count);
    state.inputValue = '';
    state.phase = 'showing';
    renderShowPhase('');
    showLettersSequentially(state.sequence, cfg.displayMs, function () {
      state.phase = 'input';
      renderInputPhase();
    });
  }

  function showLettersSequentially(seq, displayMs, done) {
    var gameArea = document.getElementById('game-area');
    var i = 0;
    var BLANK_MS = 200;

    function showNext() {
      if (i >= seq.length) {
        gameArea.innerHTML = '<div class="ls-letter-display ls-letter-blank"></div>';
        setTimeout(done, BLANK_MS);
        return;
      }
      var letter = seq[i];
      i++;
      gameArea.innerHTML = '<div class="ls-letter-display">' + letter + '</div>';
      setTimeout(function () {
        gameArea.innerHTML = '<div class="ls-letter-display ls-letter-blank"></div>';
        setTimeout(showNext, BLANK_MS);
      }, displayMs);
    }

    showNext();
  }

  function renderGameArea() {
    var gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';
  }

  function renderShowPhase(msg) {
    var gameArea = document.getElementById('game-area');
    gameArea.innerHTML =
      '<div class="ls-phase-label">' +
        'Trial ' + (state.trial + 1) + ' of 5 &mdash; Watch the letters' +
      '</div>' +
      '<div class="ls-letter-display ls-letter-blank"></div>' +
      (msg ? '<div class="ls-msg">' + msg + '</div>' : '');
  }

  function renderInputPhase() {
    var cfg = LEVELS[state.level];
    var gameArea = document.getElementById('game-area');
    gameArea.innerHTML =
      '<div class="ls-phase-label">Type the letters in order</div>' +
      '<div class="ls-input-row">' +
        '<div class="ls-typed-display" id="ls-typed-display">&nbsp;</div>' +
        '<button class="btn btn--ghost ls-clear-btn" id="ls-clear-btn">Clear</button>' +
      '</div>' +
      '<div class="ls-instructions">Use the keyboard below or your physical keyboard</div>' +
      renderKeyboardHTML() +
      '<div class="ls-submit-row">' +
        '<button class="btn btn--primary ls-submit-btn" id="ls-submit-btn">Submit</button>' +
      '</div>';

    document.getElementById('ls-clear-btn').addEventListener('click', function () {
      state.inputValue = '';
      updateTypedDisplay();
      BrainForge.Audio.click();
    });

    document.getElementById('ls-submit-btn').addEventListener('click', submitAnswer);

    // On-screen keyboard
    gameArea.querySelectorAll('.ls-key').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var letter = btn.getAttribute('data-key');
        if (state.inputValue.length < cfg.count) {
          state.inputValue += letter;
          updateTypedDisplay();
          BrainForge.Audio.click();
        }
      });
    });
  }

  function renderKeyboardHTML() {
    var html = '<div class="ls-keyboard">';
    QWERTY_ROWS.forEach(function (row) {
      html += '<div class="ls-keyboard-row">';
      row.forEach(function (key) {
        var isConsonant = CONSONANTS.indexOf(key) !== -1;
        html +=
          '<button class="ls-key' + (isConsonant ? '' : ' ls-key--vowel') + '" data-key="' + key + '">' +
            key +
          '</button>';
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function updateTypedDisplay() {
    var el = document.getElementById('ls-typed-display');
    if (!el) return;
    if (state.inputValue.length === 0) {
      el.innerHTML = '&nbsp;';
    } else {
      el.textContent = state.inputValue;
    }
  }

  // Physical keyboard support
  document.addEventListener('keydown', function (e) {
    if (state.phase !== 'input') return;
    var key = e.key.toUpperCase();
    if (key === 'BACKSPACE') {
      state.inputValue = state.inputValue.slice(0, -1);
      updateTypedDisplay();
      return;
    }
    if (key === 'ENTER') {
      submitAnswer();
      return;
    }
    if (key.length === 1 && /[A-Z]/.test(key)) {
      var cfg = LEVELS[state.level];
      if (state.inputValue.length < cfg.count) {
        state.inputValue += key;
        updateTypedDisplay();
      }
    }
  });

  function submitAnswer() {
    if (state.phase !== 'input') return;
    state.phase = 'feedback';

    var answer = state.inputValue.toUpperCase();
    var correct = state.sequence.join('');
    var isCorrect = answer === correct;

    if (isCorrect) {
      state.correctTrials++;
      BrainForge.Audio.correct();
    } else {
      BrainForge.Audio.wrong();
    }

    showTrialFeedback(isCorrect, correct, answer);
  }

  function showTrialFeedback(isCorrect, correct, answer) {
    var gameArea = document.getElementById('game-area');
    var feedbackClass = isCorrect ? 'ls-feedback--correct' : 'ls-feedback--wrong';
    var icon = isCorrect ? '&#10003;' : '&#10007;';
    var msg = isCorrect
      ? '<span class="ls-feedback-icon ls-icon--correct">' + icon + '</span> Correct!'
      : '<span class="ls-feedback-icon ls-icon--wrong">' + icon + '</span> The sequence was: <strong>' + correct + '</strong>';

    gameArea.innerHTML =
      '<div class="ls-feedback ' + feedbackClass + '">' + msg + '</div>' +
      '<div class="ls-trial-progress">Trial ' + (state.trial + 1) + ' of 5 complete</div>';

    state.trial++;

    setTimeout(function () {
      if (state.trial < 5) {
        state.phase = 'showing';
        renderShowPhase('');
        startTrial();
      } else {
        finishLevel();
      }
    }, 1200);
  }

  function finishLevel() {
    var pct = Math.round((state.correctTrials / 5) * 100);
    engine.updateScore(pct);
    engine.completeLevel(pct);
  }

}());
