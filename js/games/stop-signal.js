(function () {
  "use strict";

  /* ─── Level config ──────────────────────────────────────────────────────────
     Each entry: [nTrials, stopPct, arrowMs, fixMs]
     Levels 1-3:   [20, 15, 1200, 800]
     Levels 4-6:   [20, 15, 1100, 700]
     Levels 7-9:   [25, 20, 1000, 600]
     Levels 10-12: [25, 20,  900, 500]
     Levels 13-15: [30, 20,  800, 500]
     Levels 16-18: [30, 25,  750, 400]
     Levels 19-21: [40, 25,  700, 400]
     Levels 22-24: [40, 25,  650, 350]
     Levels 25-27: [60, 30,  600, 300]
     Levels 28-30: [80, 30,  550, 250]
  ─────────────────────────────────────────────────────────────────────────── */
  var LEVELS = (function () {
    var rows = [
      [20, 15, 1200, 800],
      [20, 15, 1200, 800],
      [20, 15, 1200, 800],
      [20, 15, 1100, 700],
      [20, 15, 1100, 700],
      [20, 15, 1100, 700],
      [25, 20, 1000, 600],
      [25, 20, 1000, 600],
      [25, 20, 1000, 600],
      [25, 20,  900, 500],
      [25, 20,  900, 500],
      [25, 20,  900, 500],
      [30, 20,  800, 500],
      [30, 20,  800, 500],
      [30, 20,  800, 500],
      [30, 25,  750, 400],
      [30, 25,  750, 400],
      [30, 25,  750, 400],
      [40, 25,  700, 400],
      [40, 25,  700, 400],
      [40, 25,  700, 400],
      [40, 25,  650, 350],
      [40, 25,  650, 350],
      [40, 25,  650, 350],
      [60, 30,  600, 300],
      [60, 30,  600, 300],
      [60, 30,  600, 300],
      [80, 30,  550, 250],
      [80, 30,  550, 250],
      [80, 30,  550, 250],
    ];
    return rows.map(function (r, i) {
      return {
        level:    i + 1,
        nTrials:  r[0],
        stopPct:  r[1],
        arrowMs:  r[2],
        fixMs:    r[3],
      };
    });
  }());

  /* ─── Injected styles ───────────────────────────────────────────────────── */
  var STYLE = [
    ".ss-wrap{",
    "  display:flex;flex-direction:column;align-items:center;",
    "  gap:16px;padding:20px 12px;",
    "}",
    ".ss-progress{font-size:.85rem;color:var(--text-secondary);}",
    ".ss-progress strong{color:var(--text-primary);}",
    ".ss-stats{",
    "  display:flex;gap:24px;flex-wrap:wrap;justify-content:center;",
    "  font-size:.8rem;color:var(--text-secondary);",
    "}",
    ".ss-stat{display:flex;flex-direction:column;align-items:center;gap:2px;}",
    ".ss-stat__val{font-size:1.15rem;font-weight:700;color:var(--text-primary);}",
    ".ss-ssd-wrap{",
    "  display:flex;flex-direction:column;align-items:center;gap:4px;",
    "  font-size:.78rem;color:var(--text-secondary);",
    "}",
    ".ss-ssd-bar-bg{",
    "  width:110px;height:6px;background:var(--bg-elevated);",
    "  border-radius:99px;overflow:hidden;",
    "}",
    ".ss-ssd-bar{",
    "  height:100%;background:var(--accent-500);",
    "  border-radius:99px;transition:width .3s ease;",
    "}",
    ".ss-stimulus-wrap{",
    "  position:relative;width:160px;height:160px;",
    "  display:flex;align-items:center;justify-content:center;",
    "}",
    ".ss-fixation{",
    "  font-size:3rem;color:var(--text-secondary);",
    "  opacity:.5;line-height:1;",
    "}",
    ".ss-arrow{",
    "  position:absolute;font-size:6rem;line-height:1;",
    "  font-weight:700;user-select:none;display:none;",
    "}",
    ".ss-arrow.left{color:#3B82F6;}",
    ".ss-arrow.right{color:#34D399;}",
    ".ss-stop{",
    "  position:absolute;",
    "  top:0;left:0;right:0;bottom:0;",
    "  display:none;",
    "  align-items:center;justify-content:center;",
    "  background:rgba(239,68,68,.18);",
    "  border-radius:12px;",
    "  font-size:1.4rem;font-weight:900;color:#EF4444;",
    "  letter-spacing:.06em;",
    "  animation:ss-pop .1s ease-out;",
    "}",
    "@keyframes ss-pop{",
    "  from{transform:scale(.75);opacity:0}",
    "  to{transform:scale(1);opacity:1}",
    "}",
    ".ss-feedback{",
    "  min-height:1.5em;font-size:.95rem;font-weight:600;",
    "  text-align:center;",
    "}",
    ".ss-feedback.go-correct{color:var(--success);}",
    ".ss-feedback.go-wrong{color:var(--error);}",
    ".ss-feedback.go-miss{color:#F59E0B;}",
    ".ss-feedback.stop-ok{color:var(--accent-500);}",
    ".ss-feedback.stop-fail{color:var(--error);}",
    ".ss-buttons{display:flex;gap:20px;margin-top:4px;}",
    ".ss-btn{",
    "  min-width:88px;padding:14px 18px;",
    "  border-radius:12px;font-size:1.8rem;font-weight:700;",
    "  border:2px solid var(--bg-elevated);",
    "  background:var(--bg-surface);color:var(--text-primary);",
    "  cursor:pointer;transition:background .12s,border-color .12s,transform .08s;",
    "  user-select:none;",
    "}",
    ".ss-btn:hover{background:var(--bg-elevated);border-color:var(--primary-500);}",
    ".ss-btn:active{transform:scale(.92);}",
    ".ss-btn[data-dir=left]{border-left:4px solid #3B82F6;}",
    ".ss-btn[data-dir=right]{border-right:4px solid #34D399;}",
    ".ss-hint{",
    "  font-size:.78rem;color:var(--text-secondary);",
    "  text-align:center;max-width:320px;",
    "}",
    ".ss-summary{",
    "  display:flex;flex-direction:column;align-items:center;",
    "  gap:14px;padding:20px 16px;text-align:center;",
    "}",
    ".ss-summary h3{font-size:1.3rem;margin:0;}",
    ".ss-summary-stats{",
    "  display:flex;gap:14px;flex-wrap:wrap;justify-content:center;",
    "}",
    ".ss-summary-stat{",
    "  background:var(--bg-elevated);border-radius:10px;",
    "  padding:10px 16px;min-width:80px;",
    "}",
    ".ss-summary-stat__val{",
    "  font-size:1.4rem;font-weight:800;color:var(--accent-500);display:block;",
    "}",
    ".ss-summary-stat__lbl{",
    "  font-size:.7rem;color:var(--text-secondary);",
    "  text-transform:uppercase;letter-spacing:.05em;",
    "}",
    "@media(max-width:480px){",
    "  .ss-arrow{font-size:4.5rem;}",
    "  .ss-stimulus-wrap{width:130px;height:130px;}",
    "  .ss-btn{min-width:72px;padding:12px 14px;font-size:1.5rem;}",
    "}",
  ].join("");

  function injectStyles() {
    if (document.getElementById("ss-styles")) return;
    var s = document.createElement("style");
    s.id = "ss-styles";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ─── State ─────────────────────────────────────────────────────────────── */
  var engine;
  var state = {
    level: 1,
    cfg: null,
    trialIndex: 0,
    trials: [],
    ssd: 250,           // current stop-signal delay (ms)
    isStopTrial: false,
    stimDir: null,      // "left" | "right"
    stimTime: null,
    awaitingGo: false,
    fpTimer: null,
    stopTimer: null,
    deadlineTimer: null,
  };

  /* ─── Helpers ───────────────────────────────────────────────────────────── */
  function clearTimers() {
    clearTimeout(state.fpTimer);
    clearTimeout(state.stopTimer);
    clearTimeout(state.deadlineTimer);
    state.fpTimer = null;
    state.stopTimer = null;
    state.deadlineTimer = null;
  }

  function getEl(id) { return document.getElementById(id); }

  /* ─── DOM build ─────────────────────────────────────────────────────────── */
  function buildScreen() {
    var area = getEl("game-area");
    if (!area) return;

    var n = state.cfg.nTrials;
    area.innerHTML =
      '<div class="ss-wrap">' +
        '<div class="ss-progress">Trial <strong id="ss-trial-num">0</strong> / <strong>' + n + '</strong></div>' +

        '<div class="ss-stats">' +
          '<div class="ss-stat"><span class="ss-stat__val" id="ss-go-correct">0</span>Go Correct</div>' +
          '<div class="ss-stat"><span class="ss-stat__val" id="ss-stop-ok">0</span>Stops OK</div>' +
          '<div class="ss-ssd-wrap">' +
            '<div class="ss-ssd-bar-bg"><div class="ss-ssd-bar" id="ss-ssd-bar" style="width:31%"></div></div>' +
            '<span>SSD: <strong id="ss-ssd-val">' + state.ssd + '</strong> ms</span>' +
          '</div>' +
        '</div>' +

        '<div class="ss-stimulus-wrap">' +
          '<div class="ss-fixation" id="ss-fix">+</div>' +
          '<div class="ss-arrow left"  id="ss-arrow-left">&#8592;</div>' +
          '<div class="ss-arrow right" id="ss-arrow-right">&#8594;</div>' +
          '<div class="ss-stop" id="ss-stop">STOP</div>' +
        '</div>' +

        '<div class="ss-feedback" id="ss-feedback"></div>' +

        '<div class="ss-buttons">' +
          '<button class="ss-btn" data-dir="left"  aria-label="Left arrow">&#8592;</button>' +
          '<button class="ss-btn" data-dir="right" aria-label="Right arrow">&#8594;</button>' +
        '</div>' +

        '<p class="ss-hint">Press Left &#8592; or Right &#8594; — if STOP appears, freeze!</p>' +
      '</div>';

    area.querySelector(".ss-buttons").addEventListener("click", function (e) {
      var btn = e.target.closest(".ss-btn");
      if (btn) handleGoResponse(btn.getAttribute("data-dir"));
    });
  }

  /* ─── Trial flow ────────────────────────────────────────────────────────── */
  function startLevel(levelNum) {
    state.level = levelNum;
    state.cfg = LEVELS[levelNum - 1];
    state.trialIndex = 0;
    state.trials = [];
    state.ssd = 250;
    state.awaitingGo = false;
    clearTimers();
    buildScreen();
    state.fpTimer = setTimeout(nextTrial, 500);
  }

  function nextTrial() {
    if (state.trialIndex >= state.cfg.nTrials) {
      endLevel();
      return;
    }

    state.awaitingGo = false;
    state.stimDir = null;
    state.stimTime = null;
    state.isStopTrial = (Math.random() * 100) < state.cfg.stopPct;

    // Reset display
    var fixEl    = getEl("ss-fix");
    var arrowL   = getEl("ss-arrow-left");
    var arrowR   = getEl("ss-arrow-right");
    var stopEl   = getEl("ss-stop");
    var fbEl     = getEl("ss-feedback");

    if (fixEl)  { fixEl.style.display = "block"; }
    if (arrowL) { arrowL.style.display = "none"; }
    if (arrowR) { arrowR.style.display = "none"; }
    if (stopEl) { stopEl.style.display = "none"; }
    if (fbEl)   { fbEl.textContent = ""; fbEl.className = "ss-feedback"; }

    // Fixation for fixMs, then show arrow
    state.fpTimer = setTimeout(showArrow, state.cfg.fixMs);
  }

  function showArrow() {
    var dir = Math.random() < 0.5 ? "left" : "right";
    state.stimDir = dir;
    state.stimTime = performance.now();
    state.awaitingGo = true;

    var fixEl  = getEl("ss-fix");
    var arrowEl = getEl(dir === "left" ? "ss-arrow-left" : "ss-arrow-right");

    if (fixEl)  fixEl.style.display = "none";
    if (arrowEl) arrowEl.style.display = "block";

    if (state.isStopTrial) {
      // Schedule STOP signal after SSD ms
      state.stopTimer = setTimeout(showStopSignal, state.ssd);
    }

    // Deadline: if no response by arrowMs, evaluate
    state.deadlineTimer = setTimeout(function () {
      if (!state.awaitingGo) return;
      state.awaitingGo = false;
      if (state.isStopTrial) {
        // Timed out without responding on stop trial = successful inhibition
        resolveStop(true);
      } else {
        // Timed out on go trial = miss
        recordTrial("go", false, null);
        showFeedback("go-miss", "Too slow!");
        BrainForge.Audio.wrong();
        scheduleNext();
      }
    }, state.cfg.arrowMs);
  }

  function showStopSignal() {
    var stopEl = getEl("ss-stop");
    if (stopEl) {
      // Re-trigger animation by toggling display
      stopEl.style.display = "none";
      // Force reflow
      void stopEl.offsetWidth;
      stopEl.style.display = "flex";
    }
    BrainForge.Audio.wrong();
  }

  function handleGoResponse(dir) {
    if (!state.awaitingGo) return;
    state.awaitingGo = false;
    clearTimers();

    var rt = Math.round(performance.now() - state.stimTime);

    // Hide arrow
    var arrowEl = getEl(state.stimDir === "left" ? "ss-arrow-left" : "ss-arrow-right");
    if (arrowEl) arrowEl.style.display = "none";

    if (state.isStopTrial) {
      // Responded on stop trial — inhibition failure
      resolveStop(false);
    } else {
      // Go trial — check direction
      var correct = (dir === state.stimDir);
      if (correct) {
        BrainForge.Audio.correct();
        recordTrial("go", true, rt);
        showFeedback("go-correct", rt + " ms");
      } else {
        BrainForge.Audio.wrong();
        recordTrial("go", false, rt);
        showFeedback("go-wrong", "Wrong direction!");
      }
      scheduleNext();
    }
  }

  function resolveStop(inhibited) {
    clearTimers();

    var arrowL = getEl("ss-arrow-left");
    var arrowR = getEl("ss-arrow-right");
    var stopEl = getEl("ss-stop");
    if (arrowL) arrowL.style.display = "none";
    if (arrowR) arrowR.style.display = "none";

    if (inhibited) {
      // Successful stop — increase SSD (make next stop harder)
      state.ssd = Math.min(state.ssd + 50, 800);
      BrainForge.Audio.correct();
      recordTrial("stop", true, null);
      showFeedback("stop-ok", "Stopped! ✓");
    } else {
      // Failed stop — decrease SSD (make next stop easier)
      state.ssd = Math.max(state.ssd - 50, 50);
      BrainForge.Audio.wrong();
      recordTrial("stop", false, null);
      showFeedback("stop-fail", "Failed to stop!");
    }

    updateSSDBar();

    // Briefly show stop overlay after the fact for context
    if (!inhibited && stopEl) {
      stopEl.style.display = "none";
    }

    scheduleNext();
  }

  /* ─── Record and update ─────────────────────────────────────────────────── */
  function recordTrial(type, correct, rt) {
    state.trials.push({ type: type, correct: correct, rt: rt });
    state.trialIndex++;
    updateStats();
  }

  function updateStats() {
    var trialNumEl  = getEl("ss-trial-num");
    var goCorrectEl = getEl("ss-go-correct");
    var stopOkEl    = getEl("ss-stop-ok");

    if (trialNumEl)  trialNumEl.textContent = state.trialIndex;

    var goCorrect = 0, stopOk = 0;
    for (var i = 0; i < state.trials.length; i++) {
      var t = state.trials[i];
      if (t.type === "go"   && t.correct) goCorrect++;
      if (t.type === "stop" && t.correct) stopOk++;
    }

    if (goCorrectEl) goCorrectEl.textContent = goCorrect;
    if (stopOkEl)    stopOkEl.textContent    = stopOk;

    // Live score update
    var total = state.trials.length;
    if (total > 0) {
      var pct = Math.round(((goCorrect + stopOk) / total) * 100);
      engine.updateScore(pct);
    }
  }

  function updateSSDBar() {
    var bar = getEl("ss-ssd-bar");
    var val = getEl("ss-ssd-val");
    var pct = Math.min(100, Math.max(0, (state.ssd / 800) * 100));
    if (bar) bar.style.width = pct + "%";
    if (val) val.textContent = state.ssd;
  }

  function showFeedback(cls, msg) {
    var fbEl = getEl("ss-feedback");
    if (!fbEl) return;
    fbEl.className = "ss-feedback " + cls;
    fbEl.textContent = msg;
  }

  function scheduleNext() {
    var fixEl = getEl("ss-fix");
    state.fpTimer = setTimeout(function () {
      if (fixEl) fixEl.style.display = "block";
      state.fpTimer = setTimeout(nextTrial, 200);
    }, 300);
  }

  /* ─── Level end ─────────────────────────────────────────────────────────── */
  function endLevel() {
    clearTimers();
    document.removeEventListener("keydown", onKeyDown);

    var trials    = state.trials;
    var goTrials  = trials.filter(function (t) { return t.type === "go"; });
    var stopTrials = trials.filter(function (t) { return t.type === "stop"; });

    var goCorrect  = goTrials.filter(function (t) { return t.correct; }).length;
    var stopOk     = stopTrials.filter(function (t) { return t.correct; }).length;
    var total      = trials.length;

    var score     = total > 0 ? Math.round(((goCorrect + stopOk) / total) * 100) : 0;
    var goPct     = goTrials.length   > 0 ? Math.round((goCorrect  / goTrials.length)   * 100) : 0;
    var stopPct   = stopTrials.length > 0 ? Math.round((stopOk     / stopTrials.length) * 100) : 0;

    // Mean correct-go RT
    var goRTs = goTrials
      .filter(function (t) { return t.correct && t.rt !== null; })
      .map(function (t) { return t.rt; });

    var meanGoRT = goRTs.length
      ? Math.round(goRTs.reduce(function (a, b) { return a + b; }, 0) / goRTs.length)
      : null;

    // SSRT estimate (integration method approximation: mean GoRT - converged SSD)
    var ssrt = meanGoRT !== null ? Math.max(0, meanGoRT - state.ssd) : null;

    var area = getEl("game-area");
    if (!area) return;

    var ssrtHTML = ssrt !== null
      ? '<div class="ss-summary-stat"><span class="ss-summary-stat__val">' + ssrt + ' ms</span><span class="ss-summary-stat__lbl">Est. SSRT</span></div>'
      : "";
    var goRTHTML = meanGoRT !== null
      ? '<div class="ss-summary-stat"><span class="ss-summary-stat__val">' + meanGoRT + ' ms</span><span class="ss-summary-stat__lbl">Mean Go RT</span></div>'
      : "";

    area.innerHTML =
      '<div class="ss-summary">' +
        '<h3>Level ' + state.level + ' Complete</h3>' +
        '<div class="ss-summary-stats">' +
          '<div class="ss-summary-stat"><span class="ss-summary-stat__val">' + score + '%</span><span class="ss-summary-stat__lbl">Score</span></div>' +
          '<div class="ss-summary-stat"><span class="ss-summary-stat__val">' + goPct + '%</span><span class="ss-summary-stat__lbl">Go Accuracy</span></div>' +
          '<div class="ss-summary-stat"><span class="ss-summary-stat__val">' + stopPct + '%</span><span class="ss-summary-stat__lbl">Inhibition Rate</span></div>' +
          goRTHTML +
          ssrtHTML +
        '</div>' +
        '<p style="font-size:.8rem;color:var(--text-secondary);margin:0;">' +
          'Final SSD: ' + state.ssd + ' ms &nbsp;|&nbsp; ' +
          'Go trials: ' + goTrials.length + ' &nbsp;|&nbsp; ' +
          'Stop trials: ' + stopTrials.length +
        '</p>' +
      '</div>';

    BrainForge.Audio.levelUp();
    engine.completeLevel(score);
  }

  /* ─── Keyboard ──────────────────────────────────────────────────────────── */
  function onKeyDown(e) {
    if (!state.awaitingGo) return;
    if (e.key === "ArrowLeft")  { e.preventDefault(); handleGoResponse("left"); }
    if (e.key === "ArrowRight") { e.preventDefault(); handleGoResponse("right"); }
  }

  /* ─── Boot ───────────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    document.addEventListener("keydown", onKeyDown);

    engine = new BrainForge.GameEngine({
      gameId: "stop-signal",
      totalLevels: 30,
      passThreshold: 75,
      onGameStart: function (levelNum) {
        startLevel(levelNum);
      },
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
