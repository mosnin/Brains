(function () {
  'use strict';

  const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
  const POSITIONS = 9; // 3x3 grid

  const LEVEL_CONFIG = [
    // Levels 1-3: Visual only, N=1, 20 trials, 500ms stimulus, 2500ms ISI
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: false },
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: false },
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: false },
    // Levels 4-6: Dual, N=1, 20 trials, 500ms, 2500ms
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    { n: 1, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    // Levels 7-9: N=2, dual, 20 trials, 500ms, 2500ms
    { n: 2, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    { n: 2, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    { n: 2, trials: 20, stimulus: 500, isi: 2500, dualMode: true },
    // Levels 10-12: N=2, 25 trials, 450ms, 2200ms
    { n: 2, trials: 25, stimulus: 450, isi: 2200, dualMode: true },
    { n: 2, trials: 25, stimulus: 450, isi: 2200, dualMode: true },
    { n: 2, trials: 25, stimulus: 450, isi: 2200, dualMode: true },
    // Levels 13-15: N=3, 25 trials, 450ms, 2000ms
    { n: 3, trials: 25, stimulus: 450, isi: 2000, dualMode: true },
    { n: 3, trials: 25, stimulus: 450, isi: 2000, dualMode: true },
    { n: 3, trials: 25, stimulus: 450, isi: 2000, dualMode: true },
    // Levels 16-18: N=3, 30 trials, 400ms, 1800ms
    { n: 3, trials: 30, stimulus: 400, isi: 1800, dualMode: true },
    { n: 3, trials: 30, stimulus: 400, isi: 1800, dualMode: true },
    { n: 3, trials: 30, stimulus: 400, isi: 1800, dualMode: true },
    // Levels 19-21: N=4, 30 trials, 400ms, 1600ms
    { n: 4, trials: 30, stimulus: 400, isi: 1600, dualMode: true },
    { n: 4, trials: 30, stimulus: 400, isi: 1600, dualMode: true },
    { n: 4, trials: 30, stimulus: 400, isi: 1600, dualMode: true },
    // Levels 22-24: N=5, 30 trials, 350ms, 1500ms
    { n: 5, trials: 30, stimulus: 350, isi: 1500, dualMode: true },
    { n: 5, trials: 30, stimulus: 350, isi: 1500, dualMode: true },
    { n: 5, trials: 30, stimulus: 350, isi: 1500, dualMode: true },
    // Levels 25-27: N=6, 35 trials, 350ms, 1400ms
    { n: 6, trials: 35, stimulus: 350, isi: 1400, dualMode: true },
    { n: 6, trials: 35, stimulus: 350, isi: 1400, dualMode: true },
    { n: 6, trials: 35, stimulus: 350, isi: 1400, dualMode: true },
    // Levels 28-30: N=7, 35 trials, 300ms, 1200ms
    { n: 7, trials: 35, stimulus: 300, isi: 1200, dualMode: true },
    { n: 7, trials: 35, stimulus: 300, isi: 1200, dualMode: true },
    { n: 7, trials: 35, stimulus: 300, isi: 1200, dualMode: true },
  ];

  var engine = null;
  var config = null;
  var currentLevel = 1;
  var trialIndex = 0;
  var sequence = [];
  var positionPressed = false;
  var soundPressed = false;
  var results = [];
  var trialTimer = null;
  var stimulusTimer = null;
  var running = false;
  var cells = [];
  var posBtn = null;
  var soundBtn = null;
  var nBackLabel = null;
  var trialLabel = null;

  function getLevelConfig(level) {
    return LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
  }

  function generateSequence(cfg) {
    var seq = [];
    var matchProbability = 0.22; // ~20-25%

    for (var i = 0; i < cfg.trials; i++) {
      var pos, letter;

      if (i >= cfg.n && Math.random() < matchProbability) {
        pos = seq[i - cfg.n].position;
      } else {
        pos = Math.floor(Math.random() * POSITIONS);
      }

      if (cfg.dualMode) {
        if (i >= cfg.n && Math.random() < matchProbability) {
          letter = seq[i - cfg.n].letter;
        } else {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        }
      } else {
        letter = null;
      }

      seq.push({ position: pos, letter: letter });
    }

    return seq;
  }

  function buildGameArea() {
    var gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';

    // N-back and trial info
    var infoBar = document.createElement('div');
    infoBar.className = 'dnb-info-bar';

    nBackLabel = document.createElement('span');
    nBackLabel.className = 'dnb-info-label';
    nBackLabel.textContent = 'N = 1';
    infoBar.appendChild(nBackLabel);

    trialLabel = document.createElement('span');
    trialLabel.className = 'dnb-info-label';
    trialLabel.textContent = 'Trial: 0 / 20';
    infoBar.appendChild(trialLabel);

    gameArea.appendChild(infoBar);

    // Grid
    var grid = document.createElement('div');
    grid.className = 'game-grid game-grid--3x3';
    cells = [];

    for (var i = 0; i < 9; i++) {
      var cell = document.createElement('div');
      cell.className = 'game-cell';
      cell.dataset.index = i;
      grid.appendChild(cell);
      cells.push(cell);
    }

    gameArea.appendChild(grid);

    // Response buttons
    var btnWrap = document.createElement('div');
    btnWrap.className = 'dnb-buttons';

    posBtn = document.createElement('button');
    posBtn.className = 'dnb-btn dnb-btn--position';
    posBtn.innerHTML = '<span class="dnb-btn__key">A</span> Position Match';
    posBtn.addEventListener('click', function () { handlePositionMatch(); });

    soundBtn = document.createElement('button');
    soundBtn.className = 'dnb-btn dnb-btn--sound';
    soundBtn.innerHTML = 'Sound Match <span class="dnb-btn__key">L</span>';
    soundBtn.addEventListener('click', function () { handleSoundMatch(); });

    btnWrap.appendChild(posBtn);
    btnWrap.appendChild(soundBtn);
    gameArea.appendChild(btnWrap);

    // Style injection
    if (!document.getElementById('dnb-styles')) {
      var style = document.createElement('style');
      style.id = 'dnb-styles';
      style.textContent =
        '.dnb-info-bar { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600; color: var(--text-secondary, #b0b0b0); }' +
        '.dnb-info-label { background: var(--surface-alt, rgba(255,255,255,0.05)); padding: 0.4rem 1rem; border-radius: 0.5rem; }' +
        '.dnb-buttons { display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center; }' +
        '.dnb-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.8rem; border: 2px solid var(--primary, #7c4dff); background: transparent; color: var(--text-primary, #fff); font-size: 1rem; font-weight: 600; border-radius: 0.75rem; cursor: pointer; transition: background 0.15s, transform 0.1s; user-select: none; }' +
        '.dnb-btn:hover { background: rgba(124,77,255,0.15); }' +
        '.dnb-btn:active, .dnb-btn--pressed { background: var(--primary, #7c4dff); transform: scale(0.96); }' +
        '.dnb-btn--correct { background: var(--success, #00c853) !important; border-color: var(--success, #00c853) !important; }' +
        '.dnb-btn--wrong { background: var(--error, #ff1744) !important; border-color: var(--error, #ff1744) !important; }' +
        '.dnb-btn--hidden { visibility: hidden; }' +
        '.dnb-btn__key { display: inline-flex; align-items: center; justify-content: center; width: 1.6rem; height: 1.6rem; background: rgba(255,255,255,0.12); border-radius: 0.3rem; font-size: 0.8rem; font-family: monospace; }' +
        '.dnb-instructions { text-align: center; padding: 2rem; max-width: 500px; margin: 0 auto; }' +
        '.dnb-instructions h3 { margin-bottom: 1rem; font-size: 1.3rem; }' +
        '.dnb-instructions p { color: var(--text-secondary, #b0b0b0); margin-bottom: 0.8rem; line-height: 1.6; }' +
        '.dnb-instructions .dnb-start-btn { margin-top: 1.5rem; padding: 0.8rem 2.5rem; background: var(--primary, #7c4dff); color: #fff; border: none; border-radius: 0.75rem; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }' +
        '.dnb-instructions .dnb-start-btn:hover { opacity: 0.85; }';
      document.head.appendChild(style);
    }
  }

  function showInstructions() {
    var gameArea = document.getElementById('game-area');
    var cfg = getLevelConfig(currentLevel);
    var modeText = cfg.dualMode ? 'a position highlight and a spoken letter' : 'a position highlight';
    var matchText = cfg.dualMode
      ? 'Press <strong>A</strong> if the position matches ' + cfg.n + ' trial(s) ago. Press <strong>L</strong> if the sound matches ' + cfg.n + ' trial(s) ago.'
      : 'Press <strong>A</strong> if the position matches ' + cfg.n + ' trial(s) ago.';

    gameArea.innerHTML =
      '<div class="dnb-instructions">' +
        '<h3>Level ' + currentLevel + ' &mdash; ' + cfg.n + '-Back' + (cfg.dualMode ? ' (Dual)' : ' (Visual Only)') + '</h3>' +
        '<p>Each trial shows ' + modeText + '. ' + matchText + '</p>' +
        '<p>' + cfg.trials + ' trials &bull; ' + (cfg.isi / 1000).toFixed(1) + 's between trials</p>' +
        '<button class="dnb-start-btn" id="dnb-start">Start</button>' +
      '</div>';

    document.getElementById('dnb-start').addEventListener('click', function () {
      BrainForge.Audio.click();
      beginTrials();
    });
  }

  function beginTrials() {
    config = getLevelConfig(currentLevel);
    sequence = generateSequence(config);
    trialIndex = 0;
    results = [];
    running = true;

    buildGameArea();

    if (!config.dualMode) {
      soundBtn.classList.add('dnb-btn--hidden');
    }

    updateInfoBar();
    // Short delay before first trial
    trialTimer = setTimeout(function () { runTrial(); }, 800);
  }

  function updateInfoBar() {
    if (nBackLabel) {
      nBackLabel.textContent = 'N = ' + config.n;
    }
    if (trialLabel) {
      trialLabel.textContent = 'Trial: ' + (trialIndex) + ' / ' + config.trials;
    }
  }

  function runTrial() {
    if (!running || trialIndex >= config.trials) {
      endRound();
      return;
    }

    positionPressed = false;
    soundPressed = false;

    posBtn.classList.remove('dnb-btn--correct', 'dnb-btn--wrong', 'dnb-btn--pressed');
    soundBtn.classList.remove('dnb-btn--correct', 'dnb-btn--wrong', 'dnb-btn--pressed');

    var trial = sequence[trialIndex];

    // Highlight cell
    cells[trial.position].classList.add('game-cell--active');

    // Speak letter
    if (config.dualMode && trial.letter) {
      BrainForge.Audio.speakLetter(trial.letter);
    }

    updateInfoBar();

    // Remove highlight after stimulus duration
    stimulusTimer = setTimeout(function () {
      cells[trial.position].classList.remove('game-cell--active');
    }, config.stimulus);

    // End of trial window: score and move on
    trialTimer = setTimeout(function () {
      scoreTrial();
      trialIndex++;
      updateInfoBar();
      runTrial();
    }, config.isi);
  }

  function handlePositionMatch() {
    if (!running || positionPressed) return;
    positionPressed = true;
    posBtn.classList.add('dnb-btn--pressed');
    BrainForge.Audio.click();
  }

  function handleSoundMatch() {
    if (!running || soundPressed || !config.dualMode) return;
    soundPressed = true;
    soundBtn.classList.add('dnb-btn--pressed');
    BrainForge.Audio.click();
  }

  function scoreTrial() {
    var trial = sequence[trialIndex];
    var n = config.n;

    // Position scoring
    var posIsMatch = trialIndex >= n && trial.position === sequence[trialIndex - n].position;
    var posCorrect = (posIsMatch && positionPressed) || (!posIsMatch && !positionPressed);

    // Sound scoring (only in dual mode)
    var soundCorrect = true;
    var soundIsMatch = false;
    if (config.dualMode) {
      soundIsMatch = trialIndex >= n && trial.letter === sequence[trialIndex - n].letter;
      soundCorrect = (soundIsMatch && soundPressed) || (!soundIsMatch && !soundPressed);
    }

    // Visual feedback on buttons
    if (trialIndex >= n) {
      if (positionPressed) {
        posBtn.classList.remove('dnb-btn--pressed');
        posBtn.classList.add(posIsMatch ? 'dnb-btn--correct' : 'dnb-btn--wrong');
      }
      if (config.dualMode && soundPressed) {
        soundBtn.classList.remove('dnb-btn--pressed');
        soundBtn.classList.add(soundIsMatch ? 'dnb-btn--correct' : 'dnb-btn--wrong');
      }
    }

    results.push({
      posCorrect: posCorrect,
      soundCorrect: soundCorrect
    });
  }

  function endRound() {
    running = false;
    clearTimeout(trialTimer);
    clearTimeout(stimulusTimer);

    // Calculate score
    var totalChecks = 0;
    var correctChecks = 0;

    for (var i = 0; i < results.length; i++) {
      totalChecks++;
      if (results[i].posCorrect) correctChecks++;
      if (config.dualMode) {
        totalChecks++;
        if (results[i].soundCorrect) correctChecks++;
      }
    }

    var scorePercent = totalChecks > 0 ? Math.round((correctChecks / totalChecks) * 100) : 0;

    engine.updateScore(scorePercent);

    if (scorePercent >= 80) {
      BrainForge.Audio.levelUp();
    } else {
      BrainForge.Audio.wrong();
    }

    engine.completeLevel(scorePercent);
  }

  function handleKeyDown(e) {
    if (!running) return;

    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      handlePositionMatch();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      handleSoundMatch();
    }
  }

  function init() {
    engine = new BrainForge.GameEngine({
      gameId: 'dual-n-back',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (level) {
        currentLevel = level;
        running = false;
        clearTimeout(trialTimer);
        clearTimeout(stimulusTimer);
        showInstructions();
      }
    });

    document.addEventListener('keydown', handleKeyDown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
