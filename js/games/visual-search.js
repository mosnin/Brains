(function () {
  "use strict";

  /* ─── Level Config ─────────────────────────────────────────────── */
  var LEVELS = [
    /* 1 */ { cols: 3, rows: 2, difficulty: "easy",      timeLimit: 0  },
    /* 2 */ { cols: 3, rows: 2, difficulty: "easy",      timeLimit: 0  },
    /* 3 */ { cols: 3, rows: 3, difficulty: "easy",      timeLimit: 0  },
    /* 4 */ { cols: 3, rows: 3, difficulty: "easy",      timeLimit: 0  },
    /* 5 */ { cols: 4, rows: 3, difficulty: "easy",      timeLimit: 0  },
    /* 6 */ { cols: 4, rows: 3, difficulty: "easy",      timeLimit: 0  },
    /* 7 */ { cols: 4, rows: 4, difficulty: "easy",      timeLimit: 0  },
    /* 8 */ { cols: 4, rows: 4, difficulty: "easy",      timeLimit: 0  },
    /* 9 */ { cols: 4, rows: 4, difficulty: "medium",    timeLimit: 0  },
    /*10 */ { cols: 4, rows: 4, difficulty: "medium",    timeLimit: 0  },
    /*11 */ { cols: 5, rows: 4, difficulty: "medium",    timeLimit: 0  },
    /*12 */ { cols: 5, rows: 4, difficulty: "medium",    timeLimit: 0  },
    /*13 */ { cols: 5, rows: 4, difficulty: "medium",    timeLimit: 10 },
    /*14 */ { cols: 5, rows: 4, difficulty: "medium",    timeLimit: 10 },
    /*15 */ { cols: 5, rows: 5, difficulty: "medium",    timeLimit: 8  },
    /*16 */ { cols: 5, rows: 5, difficulty: "medium",    timeLimit: 8  },
    /*17 */ { cols: 5, rows: 5, difficulty: "hard",      timeLimit: 0  },
    /*18 */ { cols: 5, rows: 5, difficulty: "hard",      timeLimit: 0  },
    /*19 */ { cols: 6, rows: 5, difficulty: "hard",      timeLimit: 8  },
    /*20 */ { cols: 6, rows: 5, difficulty: "hard",      timeLimit: 8  },
    /*21 */ { cols: 6, rows: 5, difficulty: "hard",      timeLimit: 7  },
    /*22 */ { cols: 6, rows: 5, difficulty: "hard",      timeLimit: 7  },
    /*23 */ { cols: 6, rows: 6, difficulty: "hard",      timeLimit: 7  },
    /*24 */ { cols: 6, rows: 6, difficulty: "hard",      timeLimit: 7  },
    /*25 */ { cols: 7, rows: 6, difficulty: "very-hard", timeLimit: 6  },
    /*26 */ { cols: 7, rows: 6, difficulty: "very-hard", timeLimit: 6  },
    /*27 */ { cols: 7, rows: 6, difficulty: "very-hard", timeLimit: 5  },
    /*28 */ { cols: 7, rows: 6, difficulty: "very-hard", timeLimit: 5  },
    /*29 */ { cols: 8, rows: 7, difficulty: "expert",    timeLimit: 5  },
    /*30 */ { cols: 8, rows: 7, difficulty: "expert",    timeLimit: 5  }
  ];

  /* ─── Symbol Sets ───────────────────────────────────────────────── */
  var SYMBOL_POOLS = {
    easy: {
      targets:      ["★", "▲", "◆", "♠"],
      distractors:  ["○", "□", "◇", "●", "■", "△", "♣", "♥"]
    },
    medium: {
      targets:      ["★", "✦", "▲", "◆"],
      distractors:  ["✧", "△", "◇", "✦", "○", "◇", "♦", "♣"]
    },
    hard: {
      targets:      ["★", "✦", "▲", "◆"],
      distractors:  ["✦", "★", "✧", "◇", "▲", "△", "◆", "♦"]
    },
    "very-hard": {
      targets:      ["★", "✦", "▲"],
      distractors:  ["✦", "✧", "★", "◇", "▲", "△", "◆", "◇"]
    },
    expert: {
      targets:      ["★", "✦", "▲"],
      distractors:  ["✦", "✧", "★", "◇", "▲", "△", "◆", "◇", "♦", "♠"]
    }
  };

  /* ─── Injected Styles ───────────────────────────────────────────── */
  var STYLE = [
    ".vs-target-display{display:flex;align-items:center;justify-content:center;gap:12px;",
    "  background:var(--bg-elevated);border-radius:12px;padding:14px 24px;margin:0 auto 20px;",
    "  max-width:360px;font-size:1rem;color:var(--text-secondary);}",
    ".vs-target-display .vs-target-symbol{font-size:2.4rem;color:var(--primary-500);line-height:1;}",
    ".vs-trial-info{text-align:center;font-size:.85rem;color:var(--text-secondary);margin-bottom:14px;}",
    ".vs-grid{display:grid;gap:8px;margin:0 auto;width:fit-content;}",
    ".vs-cell{display:flex;align-items:center;justify-content:center;",
    "  width:56px;height:56px;border-radius:10px;background:var(--bg-elevated);",
    "  font-size:1.8rem;cursor:pointer;border:2px solid transparent;",
    "  transition:background .15s,border-color .15s,transform .1s;user-select:none;}",
    ".vs-cell:hover{background:var(--bg-surface);border-color:var(--primary-500);}",
    ".vs-cell.vs-correct{background:rgba(34,197,94,.18);border-color:var(--success);}",
    ".vs-cell.vs-wrong{background:rgba(239,68,68,.18);border-color:var(--error);}",
    ".vs-cell.disabled{pointer-events:none;}",
    ".vs-timer-bar-wrap{width:100%;max-width:480px;height:6px;",
    "  background:var(--bg-elevated);border-radius:4px;margin:0 auto 14px;overflow:hidden;}",
    ".vs-timer-bar{height:100%;background:var(--accent-500);border-radius:4px;",
    "  transition:width .1s linear,background .3s;}",
    ".vs-timer-bar.warning{background:var(--error);}",
    ".vs-feedback{text-align:center;font-size:1.1rem;font-weight:600;",
    "  min-height:1.6em;margin-top:10px;}",
    ".vs-feedback.correct{color:var(--success);}",
    ".vs-feedback.wrong{color:var(--error);}",
    ".vs-level-result{text-align:center;padding:24px 16px;}",
    ".vs-level-result h3{font-size:1.4rem;margin-bottom:8px;}",
    ".vs-level-result .vs-stat{font-size:1rem;color:var(--text-secondary);margin-bottom:6px;}",
    ".vs-level-result .vs-stat strong{color:var(--text-primary);}",
    "@media(max-width:480px){.vs-cell{width:44px;height:44px;font-size:1.4rem;}}"
  ].join("");

  /* ─── State ─────────────────────────────────────────────────────── */
  var engine, currentLevel, cfg;
  var trialIndex, correctCount, totalTrials = 10;
  var trialStartTime, trialTimerId;
  var pendingNextTrial = false;

  /* ─── Helpers ───────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById("vs-styles")) return;
    var s = document.createElement("style");
    s.id = "vs-styles";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function buildSymbols(cfg, total) {
    var pool = SYMBOL_POOLS[cfg.difficulty];
    var target = pickRandom(pool.targets);
    var cells = [target];
    var distractors = pool.distractors.filter(function (s) { return s !== target; });
    // For hard+ shuffle in similar-looking symbols
    if (cfg.difficulty === "hard" || cfg.difficulty === "very-hard" || cfg.difficulty === "expert") {
      // Add lookalike distractors including the target's lookalike
      distractors = shuffle(distractors);
    }
    while (cells.length < total) {
      var d = pickRandom(distractors);
      cells.push(d);
    }
    return { target: target, cells: shuffle(cells) };
  }

  /* ─── Trial Timer ───────────────────────────────────────────────── */
  function startTrialTimer(seconds) {
    var bar = document.getElementById("vs-timer-bar");
    if (!bar) return;
    var startTs = Date.now();
    var endTs = startTs + seconds * 1000;

    function tick() {
      var now = Date.now();
      var remaining = Math.max(0, endTs - now);
      var pct = (remaining / (seconds * 1000)) * 100;
      bar.style.width = pct + "%";
      if (pct < 25) bar.classList.add("warning");
      else bar.classList.remove("warning");
      if (remaining <= 0) {
        handleTrialTimeout();
        return;
      }
      trialTimerId = requestAnimationFrame(tick);
    }
    trialTimerId = requestAnimationFrame(tick);
  }

  function stopTrialTimer() {
    if (trialTimerId) {
      cancelAnimationFrame(trialTimerId);
      trialTimerId = null;
    }
  }

  function handleTrialTimeout() {
    stopTrialTimer();
    if (pendingNextTrial) return;
    showFeedback("Time's up!", "wrong");
    BrainForge.Audio.wrong();
    disableGrid();
    pendingNextTrial = true;
    setTimeout(function () {
      pendingNextTrial = false;
      trialIndex++;
      if (trialIndex >= totalTrials) {
        finishLevel();
      } else {
        renderTrial();
      }
    }, 900);
  }

  /* ─── Render ─────────────────────────────────────────────────────── */
  function renderTrial() {
    var area = document.getElementById("game-area");
    if (!area) return;
    var total = cfg.cols * cfg.rows;
    var data = buildSymbols(cfg, total);
    trialStartTime = Date.now();

    // Timer bar
    var timerHtml = cfg.timeLimit > 0
      ? '<div class="vs-timer-bar-wrap"><div class="vs-timer-bar" id="vs-timer-bar" style="width:100%"></div></div>'
      : "";

    // Grid cells
    var cellsHtml = data.cells.map(function (sym, idx) {
      return '<button class="vs-cell" data-idx="' + idx + '" data-sym="' + sym + '" aria-label="' + sym + '">' + sym + "</button>";
    }).join("");

    area.innerHTML =
      '<div class="vs-target-display">' +
        '<span>Find this:</span>' +
        '<span class="vs-target-symbol" aria-label="Target symbol">' + data.target + "</span>" +
      "</div>" +
      '<p class="vs-trial-info">Trial ' + (trialIndex + 1) + " of " + totalTrials + "</p>" +
      timerHtml +
      '<div class="vs-grid" style="grid-template-columns:repeat(' + cfg.cols + ',56px)">' +
        cellsHtml +
      "</div>" +
      '<div class="vs-feedback" id="vs-feedback" aria-live="polite"></div>";';

    // Bind clicks
    var grid = area.querySelector(".vs-grid");
    grid.addEventListener("click", function (e) {
      var cell = e.target.closest(".vs-cell");
      if (!cell || cell.classList.contains("disabled") || pendingNextTrial) return;
      handleCellClick(cell, data.target, area);
    });

    if (cfg.timeLimit > 0) startTrialTimer(cfg.timeLimit);
    engine.updateScore(Math.round((correctCount / Math.max(trialIndex, 1)) * 100));
  }

  function showFeedback(text, type) {
    var fb = document.getElementById("vs-feedback");
    if (!fb) return;
    fb.textContent = text;
    fb.className = "vs-feedback " + (type || "");
  }

  function disableGrid() {
    var cells = document.querySelectorAll(".vs-cell");
    cells.forEach(function (c) { c.classList.add("disabled"); });
  }

  function handleCellClick(cell, target, area) {
    stopTrialTimer();
    var elapsed = Date.now() - trialStartTime;
    var isCorrect = cell.dataset.sym === target;
    pendingNextTrial = true;

    if (isCorrect) {
      correctCount++;
      cell.classList.add("vs-correct");
      showFeedback("Correct! +" + (elapsed < 1500 ? " Fast!" : ""), "correct");
      BrainForge.Audio.correct();
    } else {
      cell.classList.add("vs-wrong");
      // Highlight the correct cell
      var cells = document.querySelectorAll(".vs-cell");
      cells.forEach(function (c) {
        if (c.dataset.sym === target) c.classList.add("vs-correct");
      });
      showFeedback("Wrong — keep looking next time", "wrong");
      BrainForge.Audio.wrong();
    }
    disableGrid();

    setTimeout(function () {
      pendingNextTrial = false;
      trialIndex++;
      if (trialIndex >= totalTrials) {
        finishLevel();
      } else {
        renderTrial();
      }
    }, 950);
  }

  /* ─── Level Flow ─────────────────────────────────────────────────── */
  function startLevel(levelNum) {
    currentLevel = levelNum;
    cfg = LEVELS[levelNum - 1];
    trialIndex = 0;
    correctCount = 0;
    pendingNextTrial = false;
    renderTrial();
  }

  function finishLevel() {
    stopTrialTimer();
    var pct = Math.round((correctCount / totalTrials) * 100);
    var area = document.getElementById("game-area");
    if (area) {
      area.innerHTML =
        '<div class="vs-level-result">' +
          "<h3>Level " + currentLevel + " Complete</h3>" +
          '<p class="vs-stat">Correct: <strong>' + correctCount + " / " + totalTrials + "</strong></p>" +
          '<p class="vs-stat">Score: <strong>' + pct + "%</strong></p>" +
          (pct >= 80
            ? '<p style="color:var(--success);font-weight:600">Excellent focus!</p>'
            : '<p style="color:var(--error)">Keep practising — aim for 80%+</p>') +
        "</div>";
    }
    BrainForge.Audio.levelUp();
    engine.completeLevel(pct);
  }

  /* ─── Boot ───────────────────────────────────────────────────────── */
  function init() {
    injectStyles();

    engine = new BrainForge.GameEngine({
      gameId: "visual-search",
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (levelNum) {
        startLevel(levelNum);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
