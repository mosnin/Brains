(function () {
  'use strict';

  var LEVELS = (function () {
    // [fromLevel, toLevel, slots, updates, ops, valueRange, updateMs]
    // ops: 1=+/-, 2=+/-/x2, 3=all(+/-/x2/÷2)
    var cfg = [
      [1,  2,  2, 3, 1, false, 2000],
      [3,  4,  2, 4, 1, false, 2000],
      [5,  6,  3, 4, 1, false, 2000],
      [7,  8,  3, 5, 1, false, 2000],
      [9,  10, 3, 6, 1, true,  2000],
      [11, 12, 4, 5, 1, true,  2000],
      [13, 14, 4, 6, 2, true,  2000],
      [15, 16, 4, 7, 2, true,  2000],
      [17, 18, 5, 6, 2, true,  2000],
      [19, 20, 5, 7, 3, true,  2000],
      [21, 22, 5, 8, 3, true,  2000],
      [23, 24, 6, 7, 3, true,  2000],
      [25, 26, 6, 8, 3, true,  1500],
      [27, 28, 6, 9, 3, true,  1500],
      [29, 30, 7, 9, 3, true,  1500]
    ];
    var levels = {};
    cfg.forEach(function (row) {
      var from = row[0], to = row[1];
      for (var i = from; i <= to; i++) {
        levels[i] = {
          slots: row[2],
          updates: row[3],
          opLevel: row[4],
          allowNeg: row[5],
          updateMs: row[6]
        };
      }
    });
    return levels;
  }());

  function getOps(opLevel) {
    if (opLevel === 1) return ['+', '-'];
    if (opLevel === 2) return ['+', '-', 'x2'];
    return ['+', '-', 'x2', '÷2'];
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function applyOp(value, op, operand) {
    if (op === '+') return value + operand;
    if (op === '-') return value - operand;
    if (op === 'x2') return value * 2;
    if (op === '÷2') return Math.round(value / 2);
    return value;
  }

  function generateRound(cfg) {
    var slots = [];
    var i;
    for (i = 0; i < cfg.slots; i++) {
      slots.push(randInt(1, 9));
    }

    var ops = getOps(cfg.opLevel);
    var values = slots.slice();
    var operations = [];

    for (i = 0; i < cfg.updates; i++) {
      var slotIdx = randInt(0, cfg.slots - 1);
      var op = ops[randInt(0, ops.length - 1)];
      var operand = 0;

      if (op === '+' || op === '-') {
        operand = randInt(1, 5);
      }

      var newVal = applyOp(values[slotIdx], op, operand);

      // For non-negative levels, clamp to avoid going below 1
      if (!cfg.allowNeg && newVal < 1) {
        op = '+';
        operand = randInt(1, 3);
        newVal = values[slotIdx] + operand;
      }

      values[slotIdx] = newVal;
      operations.push({ slotIdx: slotIdx, op: op, operand: operand });
    }

    return { initial: slots, operations: operations, final: values };
  }

  function formatOp(op, slotIdx, operand) {
    var slotLabel = 'Slot ' + (slotIdx + 1);
    if (op === '+') return slotLabel + ' <strong>+' + operand + '</strong>';
    if (op === '-') return slotLabel + ' <strong>&minus;' + operand + '</strong>';
    if (op === 'x2') return slotLabel + ' <strong>&times;2</strong>';
    if (op === '÷2') return slotLabel + ' <strong>&divide;2</strong>';
    return slotLabel;
  }

  var engine = new BrainForge.GameEngine({
    gameId: 'memory-updating',
    totalLevels: 30,
    passThreshold: 80,
    onGameStart: function (level) {
      startLevel(level);
    }
  });

  var state = {
    level: 1,
    round: 0,
    roundScores: [],
    roundData: null,
    phase: 'idle',
    updateTimer: null
  };

  function startLevel(level) {
    state.level = level;
    state.round = 0;
    state.roundScores = [];
    state.phase = 'idle';
    startRound();
  }

  function startRound() {
    var cfg = LEVELS[state.level];
    state.roundData = generateRound(cfg);
    state.phase = 'showing-slots';

    renderSlots(state.roundData.initial, false);
    setTimeout(function () {
      showUpdates();
    }, 1500);
  }

  function renderSlots(values, showInputs, results) {
    var gameArea = document.getElementById('game-area');
    var cfg = LEVELS[state.level];
    var html = '<div class="mu-round-label">Round ' + (state.round + 1) + ' of 5</div>';
    html += '<div class="mu-slots" id="mu-slots">';

    for (var i = 0; i < values.length; i++) {
      var slotClass = 'mu-slot';
      var content = '';

      if (showInputs) {
        var resultClass = '';
        var badge = '';
        if (results) {
          if (results[i] === true) {
            slotClass += ' mu-slot--correct';
            badge = '<span class="mu-badge mu-badge--correct">&#10003;</span>';
          } else {
            slotClass += ' mu-slot--wrong';
            badge = '<span class="mu-badge mu-badge--wrong">&#10007;</span>';
          }
        }
        content =
          '<div class="mu-slot__label">Slot ' + (i + 1) + '</div>' +
          '<input class="mu-slot__input" type="number" id="mu-input-' + i + '" ' +
            'placeholder="?" autocomplete="off">' +
          badge;
      } else {
        content =
          '<div class="mu-slot__label">Slot ' + (i + 1) + '</div>' +
          '<div class="mu-slot__value">' + values[i] + '</div>';
      }

      html += '<div class="' + slotClass + '">' + content + '</div>';
    }

    html += '</div>';

    if (showInputs && !results) {
      html +=
        '<div class="mu-submit-row">' +
          '<button class="btn btn--primary" id="mu-submit-btn">Submit Answers</button>' +
        '</div>';
    }

    gameArea.innerHTML = html;

    if (showInputs && !results) {
      document.getElementById('mu-submit-btn').addEventListener('click', submitAnswers);
      // Focus first input
      var first = document.getElementById('mu-input-0');
      if (first) first.focus();

      // Enter key moves to next input or submits
      gameArea.querySelectorAll('.mu-slot__input').forEach(function (inp, idx) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            var next = document.getElementById('mu-input-' + (idx + 1));
            if (next) {
              next.focus();
            } else {
              submitAnswers();
            }
          }
        });
      });
    }
  }

  function showUpdates() {
    var cfg = LEVELS[state.level];
    var ops = state.roundData.operations;
    var idx = 0;
    state.phase = 'updating';

    var gameArea = document.getElementById('game-area');

    // Keep slots visible but blank the values
    var slotEls = gameArea.querySelectorAll('.mu-slot__value');
    slotEls.forEach(function (el) { el.textContent = '?'; });

    function showNextUpdate() {
      if (idx >= ops.length) {
        clearUpdateDisplay();
        state.phase = 'input';
        renderSlots(state.roundData.final, true);
        return;
      }

      var op = ops[idx];
      idx++;

      var updateEl = document.getElementById('mu-update-display');
      if (!updateEl) {
        // Re-render with update display area
        var inner = gameArea.querySelector('.mu-slots');
        var updateDiv = document.createElement('div');
        updateDiv.className = 'mu-update-display';
        updateDiv.id = 'mu-update-display';
        gameArea.insertBefore(updateDiv, inner.nextSibling);
        updateEl = updateDiv;
      }

      updateEl.innerHTML =
        '<div class="mu-update-op">' + formatOp(op.op, op.slotIdx, op.operand) + '</div>' +
        '<div class="mu-update-progress">' + idx + ' / ' + ops.length + '</div>';

      // Highlight the relevant slot
      var slotContainers = gameArea.querySelectorAll('.mu-slot');
      slotContainers.forEach(function (el, i) {
        el.classList.toggle('mu-slot--active', i === op.slotIdx);
      });

      BrainForge.Audio.click();

      state.updateTimer = setTimeout(showNextUpdate, cfg.updateMs);
    }

    showNextUpdate();
  }

  function clearUpdateDisplay() {
    var el = document.getElementById('mu-update-display');
    if (el) el.remove();
  }

  function submitAnswers() {
    if (state.phase !== 'input') return;
    state.phase = 'feedback';

    var finalValues = state.roundData.final;
    var results = [];
    var correct = 0;

    for (var i = 0; i < finalValues.length; i++) {
      var inp = document.getElementById('mu-input-' + i);
      var userVal = inp ? parseInt(inp.value, 10) : NaN;
      var isCorrect = !isNaN(userVal) && userVal === finalValues[i];
      results.push(isCorrect);
      if (isCorrect) correct++;
    }

    var pct = Math.round((correct / finalValues.length) * 100);
    state.roundScores.push(pct);

    var allCorrect = correct === finalValues.length;
    if (allCorrect) {
      BrainForge.Audio.correct();
    } else {
      BrainForge.Audio.wrong();
    }

    renderSlots(finalValues, true, results);

    // Add correct answers for wrong slots
    var gameArea = document.getElementById('game-area');
    var slotEls = gameArea.querySelectorAll('.mu-slot');
    slotEls.forEach(function (el, i) {
      if (!results[i]) {
        var badge = el.querySelector('.mu-badge');
        if (badge) {
          badge.insertAdjacentHTML('afterend',
            '<div class="mu-slot__correct-val">Answer: ' + finalValues[i] + '</div>');
        }
      }
    });

    // Remove submit button
    var submitBtn = document.getElementById('mu-submit-btn');
    if (submitBtn) submitBtn.remove();

    // Add next button
    var nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn--primary mu-next-btn';
    nextBtn.textContent = state.round + 1 < 5 ? 'Next Round' : 'See Results';
    nextBtn.addEventListener('click', function () {
      state.round++;
      if (state.round < 5) {
        startRound();
      } else {
        finishLevel();
      }
    });

    var submitRow = document.createElement('div');
    submitRow.className = 'mu-submit-row';
    submitRow.appendChild(nextBtn);
    gameArea.appendChild(submitRow);
  }

  function finishLevel() {
    var total = state.roundScores.reduce(function (a, b) { return a + b; }, 0);
    var avg = Math.round(total / state.roundScores.length);
    engine.updateScore(avg);
    engine.completeLevel(avg);
  }

}());
