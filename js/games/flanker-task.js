(function () {
  "use strict";

  /* ─── Level Config ─────────────────────────────────────────────── */
  var LEVELS = [
    /* 1 */ { trials: 40, isi: 2000, congruentPct: 70, rtLimit: 0 },
    /* 2 */ { trials: 40, isi: 2000, congruentPct: 70, rtLimit: 0 },
    /* 3 */ { trials: 40, isi: 2000, congruentPct: 70, rtLimit: 0 },
    /* 4 */ { trials: 40, isi: 1800, congruentPct: 60, rtLimit: 0 },
    /* 5 */ { trials: 40, isi: 1800, congruentPct: 60, rtLimit: 0 },
    /* 6 */ { trials: 40, isi: 1800, congruentPct: 60, rtLimit: 0 },
    /* 7 */ { trials: 40, isi: 1600, congruentPct: 50, rtLimit: 0 },
    /* 8 */ { trials: 40, isi: 1600, congruentPct: 50, rtLimit: 0 },
    /* 9 */ { trials: 40, isi: 1600, congruentPct: 50, rtLimit: 0 },
    /*10 */ { trials: 50, isi: 1400, congruentPct: 50, rtLimit: 0 },
    /*11 */ { trials: 50, isi: 1400, congruentPct: 50, rtLimit: 0 },
    /*12 */ { trials: 50, isi: 1400, congruentPct: 50, rtLimit: 0 },
    /*13 */ { trials: 50, isi: 1200, congruentPct: 45, rtLimit: 0 },
    /*14 */ { trials: 50, isi: 1200, congruentPct: 45, rtLimit: 0 },
    /*15 */ { trials: 50, isi: 1200, congruentPct: 45, rtLimit: 0 },
    /*16 */ { trials: 50, isi: 1000, congruentPct: 40, rtLimit: 0 },
    /*17 */ { trials: 50, isi: 1000, congruentPct: 40, rtLimit: 0 },
    /*18 */ { trials: 50, isi: 1000, congruentPct: 40, rtLimit: 0 },
    /*19 */ { trials: 60, isi:  900, congruentPct: 40, rtLimit: 0 },
    /*20 */ { trials: 60, isi:  900, congruentPct: 40, rtLimit: 0 },
    /*21 */ { trials: 60, isi:  900, congruentPct: 40, rtLimit: 0 },
    /*22 */ { trials: 60, isi:  800, congruentPct: 35, rtLimit: 0 },
    /*23 */ { trials: 60, isi:  800, congruentPct: 35, rtLimit: 0 },
    /*24 */ { trials: 60, isi:  800, congruentPct: 35, rtLimit: 0 },
    /*25 */ { trials: 60, isi:  700, congruentPct: 35, rtLimit: 800 },
    /*26 */ { trials: 60, isi:  700, congruentPct: 35, rtLimit: 800 },
    /*27 */ { trials: 60, isi:  700, congruentPct: 35, rtLimit: 800 },
    /*28 */ { trials: 70, isi:  600, congruentPct: 30, rtLimit: 700 },
    /*29 */ { trials: 70, isi:  600, congruentPct: 30, rtLimit: 700 },
    /*30 */ { trials: 70, isi:  600, congruentPct: 30, rtLimit: 700 }
  ];

  /* ─── Injected Styles ───────────────────────────────────────────── */
  var STYLE = [
    ".flanker-wrap{display:flex;flex-direction:column;align-items:center;padding:16px 8px;}",
    ".flanker-progress{font-size:.85rem;color:var(--text-secondary);margin-bottom:12px;}",
    ".flanker-fixation{font-size:3rem;font-weight:700;color:var(--text-secondary);",
    "  min-height:80px;display:flex;align-items:center;justify-content:center;letter-spacing:2px;}",
    ".flanker-display{font-size:3.6rem;letter-spacing:8px;min-height:80px;",
    "  display:flex;align-items:center;justify-content:center;",
    "  color:var(--text-primary);font-weight:700;user-select:none;}",
    ".flanker-display.show{animation:flanker-pop .12s ease;}",
    "@keyframes flanker-pop{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}",
    ".flanker-buttons{display:flex;gap:24px;margin-top:28px;}",
    ".flanker-btn{width:90px;height:90px;border-radius:16px;font-size:2.2rem;",
    "  font-weight:700;border:2px solid var(--bg-elevated);background:var(--bg-elevated);",
    "  color:var(--text-primary);cursor:pointer;transition:background .15s,border-color .15s,transform .1s;}",
    ".flanker-btn:hover{background:var(--bg-surface);border-color:var(--primary-500);}",
    ".flanker-btn.pressed-correct{background:rgba(34,197,94,.2);border-color:var(--success);}",
    ".flanker-btn.pressed-wrong{background:rgba(239,68,68,.2);border-color:var(--error);}",
    ".flanker-feedback{min-height:1.6em;font-size:1rem;font-weight:600;margin-top:14px;text-align:center;}",
    ".flanker-feedback.correct{color:var(--success);}",
    ".flanker-feedback.wrong{color:var(--error);}",
    ".flanker-feedback.timeout{color:var(--error);}",
    ".flanker-rt-hint{font-size:.8rem;color:var(--text-secondary);margin-top:4px;}",
    ".flanker-result{text-align:center;padding:24px 16px;}",
    ".flanker-result h3{font-size:1.4rem;margin-bottom:8px;}",
    ".flanker-result .f-stat{font-size:1rem;color:var(--text-secondary);margin-bottom:6px;}",
    ".flanker-result .f-stat strong{color:var(--text-primary);}",
    "@media(max-width:480px){",
    "  .flanker-display{font-size:2.4rem;letter-spacing:4px;}",
    "  .flanker-btn{width:72px;height:72px;font-size:1.8rem;}",
    "}"
  ].join("");

  /* ─── State ─────────────────────────────────────────────────────── */
  var engine, currentLevel, cfg;
  var trialIndex, correctCount, totalTrials;
  var responseTimes = [];
  var trialActive = false;
  var trialStartTime;
  var rtLimitTimerId;
  var currentCorrectDir; // "left" | "right"
  var phaseTimerId;

  /* ─── Helpers ───────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById("flanker-styles")) return;
    var s = document.createElement("style");
    s.id = "flanker-styles";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function buildStimulus(isCongruent) {
    var centerDir = Math.random() < 0.5 ? "left" : "right";
    var centerArrow = centerDir === "left" ? "←" : "→";
    var flankerArrow;
    if (isCongruent) {
      flankerArrow = centerArrow;
    } else {
      flankerArrow = centerDir === "left" ? "→" : "←";
    }
    return {
      direction: centerDir,
      html: flankerArrow + flankerArrow + '<span style="color:var(--accent-500)">' + centerArrow + "</span>" + flankerArrow + flankerArrow
    };
  }

  /* ─── UI Refs ────────────────────────────────────────────────────── */
  function getArea() { return document.getElementById("game-area"); }
  function getDisplay() { return document.getElementById("flanker-arrows"); }
  function getFeedback() { return document.getElementById("flanker-feedback"); }

  /* ─── Trial Flow ─────────────────────────────────────────────────── */
  function renderShell() {
    var area = getArea();
    if (!area) return;
    area.innerHTML =
      '<div class="flanker-wrap">' +
        '<p class="flanker-progress" id="flanker-progress">Trial 0 / ' + totalTrials + "</p>" +
        '<div class="flanker-display" id="flanker-arrows" aria-live="polite" aria-atomic="true">&nbsp;</div>' +
        '<div class="flanker-feedback" id="flanker-feedback" aria-live="polite">&nbsp;</div>' +
        '<p class="flanker-rt-hint" id="flanker-rt-hint"></p>' +
        '<div class="flanker-buttons">' +
          '<button class="flanker-btn" id="btn-left" aria-label="Left arrow">←</button>' +
          '<button class="flanker-btn" id="btn-right" aria-label="Right arrow">→</button>' +
        "</div>" +
      "</div>";

    document.getElementById("btn-left").addEventListener("click", function () { handleResponse("left"); });
    document.getElementById("btn-right").addEventListener("click", function () { handleResponse("right"); });
    document.addEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowLeft")  handleResponse("left");
    if (e.key === "ArrowRight") handleResponse("right");
  }

  function updateProgress() {
    var el = document.getElementById("flanker-progress");
    if (el) el.textContent = "Trial " + trialIndex + " / " + totalTrials;
  }

  function runTrial() {
    if (trialIndex >= totalTrials) { finishLevel(); return; }
    trialActive = false;
    currentCorrectDir = null;
    updateProgress();

    var display = getDisplay();
    var fb = getFeedback();
    if (display) { display.innerHTML = "<span>+</span>"; display.className = "flanker-display"; }
    if (fb) { fb.textContent = "\u00a0"; fb.className = "flanker-feedback"; }

    // Fixation for 500ms, then show arrows
    phaseTimerId = setTimeout(function () {
      var isCongruent = Math.random() * 100 < cfg.congruentPct;
      var stimulus = buildStimulus(isCongruent);
      currentCorrectDir = stimulus.direction;
      trialStartTime = Date.now();
      trialActive = true;

      if (display) {
        display.innerHTML = stimulus.html;
        display.classList.add("show");
      }
      engine.updateScore(Math.round((correctCount / Math.max(trialIndex, 1)) * 100));

      // RT limit
      if (cfg.rtLimit > 0) {
        rtLimitTimerId = setTimeout(function () {
          if (trialActive) handleTimeout();
        }, cfg.rtLimit);
      }
    }, 500);
  }

  function handleTimeout() {
    if (!trialActive) return;
    trialActive = false;
    clearTimeout(rtLimitTimerId);
    var fb = getFeedback();
    if (fb) { fb.textContent = "Too slow!"; fb.className = "flanker-feedback timeout"; }
    BrainForge.Audio.wrong();
    scheduleNextTrial();
  }

  function handleResponse(dir) {
    if (!trialActive) return;
    trialActive = false;
    clearTimeout(rtLimitTimerId);
    var rt = Date.now() - trialStartTime;
    responseTimes.push(rt);

    var isCorrect = dir === currentCorrectDir;
    var fb = getFeedback();
    var btnId = dir === "left" ? "btn-left" : "btn-right";
    var btn = document.getElementById(btnId);

    if (isCorrect) {
      correctCount++;
      if (fb) { fb.textContent = "Correct!"; fb.className = "flanker-feedback correct"; }
      if (btn) { btn.classList.add("pressed-correct"); }
      BrainForge.Audio.correct();
    } else {
      if (fb) { fb.textContent = "Wrong direction"; fb.className = "flanker-feedback wrong"; }
      if (btn) { btn.classList.add("pressed-wrong"); }
      BrainForge.Audio.wrong();
    }

    var hint = document.getElementById("flanker-rt-hint");
    if (hint) hint.textContent = "RT: " + rt + "ms";

    trialIndex++;
    setTimeout(function () {
      if (btn) { btn.classList.remove("pressed-correct", "pressed-wrong"); }
    }, 200);

    scheduleNextTrial();
  }

  function scheduleNextTrial() {
    phaseTimerId = setTimeout(function () {
      runTrial();
    }, cfg.isi);
  }

  /* ─── Level Flow ─────────────────────────────────────────────────── */
  function startLevel(levelNum) {
    currentLevel = levelNum;
    cfg = LEVELS[levelNum - 1];
    trialIndex = 0;
    correctCount = 0;
    responseTimes = [];
    renderShell();
    // Short delay so DOM settles
    setTimeout(runTrial, 400);
  }

  function finishLevel() {
    clearTimeout(phaseTimerId);
    clearTimeout(rtLimitTimerId);
    document.removeEventListener("keydown", onKeyDown);

    var pct = Math.round((correctCount / totalTrials) * 100);
    var avgRt = responseTimes.length
      ? Math.round(responseTimes.reduce(function (a, b) { return a + b; }, 0) / responseTimes.length)
      : 0;

    var area = getArea();
    if (area) {
      area.innerHTML =
        '<div class="flanker-result">' +
          "<h3>Level " + currentLevel + " Complete</h3>" +
          '<p class="f-stat">Correct: <strong>' + correctCount + " / " + totalTrials + "</strong></p>" +
          '<p class="f-stat">Accuracy: <strong>' + pct + "%</strong></p>" +
          (avgRt > 0 ? '<p class="f-stat">Avg Response Time: <strong>' + avgRt + "ms</strong></p>" : "") +
          (pct >= 80
            ? '<p style="color:var(--success);font-weight:600">Great inhibitory control!</p>'
            : '<p style="color:var(--error)">Keep practising — aim for 80%+ accuracy</p>') +
        "</div>";
    }
    BrainForge.Audio.levelUp();
    engine.completeLevel(pct);
  }

  /* ─── Boot ───────────────────────────────────────────────────────── */
  function init() {
    injectStyles();

    engine = new BrainForge.GameEngine({
      gameId: "flanker-task",
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (levelNum) {
        totalTrials = LEVELS[levelNum - 1].trials;
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
