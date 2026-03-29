(function () {
  "use strict";

  var LEVELS = (function () {
    var cfg = [
      [40, 80, 1500, 500], [40, 80, 1500, 500], [40, 80, 1500, 500],
      [40, 75, 1300, 400], [40, 75, 1300, 400], [40, 75, 1300, 400],
      [50, 75, 1100, 400], [50, 75, 1100, 400], [50, 75, 1100, 400],
      [50, 70, 1000, 350], [50, 70, 1000, 350], [50, 70, 1000, 350],
      [50, 70,  900, 300], [50, 70,  900, 300], [50, 70,  900, 300],
      [60, 70,  800, 300], [60, 70,  800, 300], [60, 70,  800, 300],
      [60, 65,  700, 250], [60, 65,  700, 250], [60, 65,  700, 250],
      [70, 65,  650, 250], [70, 65,  650, 250], [70, 65,  650, 250],
      [70, 80,  600, 200], [70, 80,  600, 200], [70, 80,  600, 200],
      [80, 80,  550, 200], [80, 80,  550, 200], [80, 80,  550, 200],
    ];
    return cfg.map(function (c, i) {
      return {
        level: i + 1,
        nTrials: c[0],
        goPct: c[1],
        isiMs: c[2],
        stimMs: c[3],
      };
    });
  }());

  var engine;
  var currentLevel = 1;
  var cfg;

  // Trial state
  var trials = [];
  var trialIdx = 0;
  var levelActive = false;
  var awaitingResponse = false;
  var currentIsGo = false;
  var responded = false;
  var trialTimer = null;
  var isiTimer = null;

  // Stats
  var hits = 0;           // GO pressed correctly
  var misses = 0;         // GO not pressed
  var correctInhib = 0;  // NO-GO not pressed correctly
  var commErrors = 0;    // NO-GO pressed (commission)
  var totalTrials = 0;

  // DOM refs
  var shapeDisplay, respondBtn, statsBar, trialCountEl;

  function init() {
    engine = new BrainForge.GameEngine({
      gameId: "go-no-go",
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (levelNum) {
        currentLevel = levelNum;
        startLevel(levelNum);
      },
    });
  }

  function injectStyles() {
    if (document.getElementById("gng-styles")) return;
    var style = document.createElement("style");
    style.id = "gng-styles";
    style.textContent = [
      ".gng-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:12px 0;}",
      ".gng-shape-display{",
      "  width:200px;height:200px;",
      "  display:flex;align-items:center;justify-content:center;",
      "  border-radius:12px;",
      "  position:relative;",
      "}",
      ".gng-shape{",
      "  width:120px;height:120px;",
      "  transition:opacity 0.08s;",
      "}",
      ".gng-shape--go{",
      "  border-radius:50%;",
      "  background:var(--success);",
      "  box-shadow:0 0 24px rgba(34,197,94,0.4);",
      "}",
      ".gng-shape--nogo{",
      "  border-radius:0;",
      "  background:var(--error);",
      "  box-shadow:0 0 24px rgba(239,68,68,0.4);",
      "}",
      ".gng-fixation{",
      "  font-size:2rem;color:var(--text-secondary);",
      "  line-height:1;",
      "}",
      ".gng-feedback{",
      "  position:absolute;top:8px;right:8px;",
      "  font-size:1.1rem;font-weight:700;",
      "  min-width:32px;text-align:center;",
      "}",
      ".gng-feedback--correct{color:var(--success);}",
      ".gng-feedback--error{color:var(--error);}",
      ".gng-key-hint{",
      "  font-size:0.78rem;color:var(--text-secondary);",
      "  text-align:center;margin-top:-8px;",
      "}",
      ".gng-respond-btn{",
      "  width:140px;height:56px;",
      "  border-radius:10px;",
      "  background:var(--primary-500);",
      "  color:#fff;font-size:1.1rem;font-weight:700;",
      "  border:none;cursor:pointer;",
      "  box-shadow:0 4px 14px rgba(79,107,245,0.3);",
      "  transition:transform 0.08s,box-shadow 0.08s;",
      "  user-select:none;",
      "}",
      ".gng-respond-btn:active{transform:scale(0.94);box-shadow:none;}",
      ".gng-respond-btn:disabled{opacity:0.4;cursor:not-allowed;}",
      ".gng-stats{",
      "  display:flex;gap:20px;flex-wrap:wrap;justify-content:center;",
      "  font-size:0.8rem;color:var(--text-secondary);",
      "}",
      ".gng-stat{text-align:center;}",
      ".gng-stat__val{display:block;font-size:1.1rem;font-weight:700;color:var(--text-primary);}",
      ".gng-trial-count{",
      "  font-size:0.8rem;color:var(--text-secondary);",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function buildTrials(nTrials, goPct) {
    var goCount = Math.round(nTrials * goPct / 100);
    var nogoCount = nTrials - goCount;
    var arr = [];
    for (var i = 0; i < goCount; i++) arr.push(true);
    for (var j = 0; j < nogoCount; j++) arr.push(false);
    // Fisher-Yates shuffle
    for (var k = arr.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = arr[k]; arr[k] = arr[r]; arr[r] = tmp;
    }
    return arr;
  }

  function setupDOM() {
    var area = document.getElementById("game-area");
    area.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "gng-wrap";

    // Legend
    var legend = document.createElement("div");
    legend.style.cssText =
      "display:flex;gap:24px;font-size:0.8rem;color:var(--text-secondary);";
    legend.innerHTML =
      '<span style="display:flex;align-items:center;gap:6px;">' +
      '<span style="width:16px;height:16px;border-radius:50%;background:var(--success);display:inline-block;"></span>Green circle = GO</span>' +
      '<span style="display:flex;align-items:center;gap:6px;">' +
      '<span style="width:16px;height:16px;background:var(--error);display:inline-block;"></span>Red square = NO-GO</span>';
    wrap.appendChild(legend);

    // Shape display area
    shapeDisplay = document.createElement("div");
    shapeDisplay.className = "gng-shape-display";
    shapeDisplay.innerHTML = '<div class="gng-fixation">+</div>';
    wrap.appendChild(shapeDisplay);

    // Key hint
    var keyHint = document.createElement("div");
    keyHint.className = "gng-key-hint";
    keyHint.textContent = "Press SPACE or tap GO for green circles only";
    wrap.appendChild(keyHint);

    // Respond button
    respondBtn = document.createElement("button");
    respondBtn.className = "gng-respond-btn";
    respondBtn.textContent = "GO";
    respondBtn.disabled = true;
    respondBtn.addEventListener("click", handleResponse);
    wrap.appendChild(respondBtn);

    // Trial count
    trialCountEl = document.createElement("div");
    trialCountEl.className = "gng-trial-count";
    wrap.appendChild(trialCountEl);

    // Stats bar
    statsBar = document.createElement("div");
    statsBar.className = "gng-stats";
    statsBar.innerHTML =
      '<div class="gng-stat"><span class="gng-stat__val" id="gng-hits">0</span>Hits</div>' +
      '<div class="gng-stat"><span class="gng-stat__val" id="gng-misses">0</span>Misses</div>' +
      '<div class="gng-stat"><span class="gng-stat__val" id="gng-inhib">0</span>Inhibited</div>' +
      '<div class="gng-stat"><span class="gng-stat__val" id="gng-comm" style="color:var(--error)">0</span>Comm. Errors</div>';
    wrap.appendChild(statsBar);

    area.appendChild(wrap);
  }

  function startLevel(levelNum) {
    cfg = LEVELS[levelNum - 1];
    hits = 0; misses = 0; correctInhib = 0; commErrors = 0;
    trialIdx = 0;
    levelActive = false;
    responded = false;
    awaitingResponse = false;
    clearTimeout(trialTimer);
    clearTimeout(isiTimer);

    injectStyles();
    setupDOM();

    trials = buildTrials(cfg.nTrials, cfg.goPct);
    totalTrials = trials.length;

    // Show start overlay
    var overlay = document.getElementById("game-overlay");
    var nogoCount = trials.filter(function (t) { return !t; }).length;
    overlay.innerHTML =
      '<div style="text-align:center;padding:24px;">' +
      '<div style="font-size:1rem;color:var(--text-secondary);margin-bottom:8px;">Level ' + levelNum + "</div>" +
      '<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px;">' +
      totalTrials + " trials &bull; " + (100 - cfg.goPct) + "% NO-GO" +
      "</div>" +
      '<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px;">' +
      "Press GO for <span style=\"color:var(--success)\">green circles</span> only" +
      "</div>" +
      '<button class="btn btn--primary" id="gng-start-btn">Start</button>' +
      "</div>";
    overlay.style.display = "flex";

    document.getElementById("gng-start-btn").addEventListener("click", function () {
      overlay.style.display = "none";
      overlay.innerHTML = "";
      levelActive = true;

      // Keyboard listener
      document.addEventListener("keydown", onKeyDown);

      runNextTrial();
    });
  }

  function onKeyDown(e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      handleResponse();
    }
  }

  function runNextTrial() {
    if (!levelActive) return;
    if (trialIdx >= totalTrials) {
      endLevel();
      return;
    }

    updateTrialCount();
    showFixation();
    responded = false;
    awaitingResponse = false;

    // ISI then show stimulus
    isiTimer = setTimeout(function () {
      if (!levelActive) return;
      showStimulus();
    }, cfg.isiMs);
  }

  function showFixation() {
    shapeDisplay.innerHTML = '<div class="gng-fixation">+</div>';
    respondBtn.disabled = true;
  }

  function showStimulus() {
    currentIsGo = trials[trialIdx];
    responded = false;
    awaitingResponse = true;

    var shape = document.createElement("div");
    shape.className = "gng-shape " + (currentIsGo ? "gng-shape--go" : "gng-shape--nogo");

    var feedbackEl = document.createElement("div");
    feedbackEl.className = "gng-feedback";
    feedbackEl.id = "gng-feedback";

    shapeDisplay.innerHTML = "";
    shapeDisplay.appendChild(shape);
    shapeDisplay.appendChild(feedbackEl);

    respondBtn.disabled = false;

    // Auto-evaluate after stimulus duration
    trialTimer = setTimeout(function () {
      if (!levelActive) return;
      evaluateTrial();
    }, cfg.stimMs);
  }

  function handleResponse() {
    if (!awaitingResponse || !levelActive) return;
    if (responded) return;
    responded = true;

    clearTimeout(trialTimer);

    if (currentIsGo) {
      // Correct hit
      hits++;
      BrainForge.Audio.correct();
      showFeedback("correct", "+");
    } else {
      // Commission error: pressed on NO-GO
      commErrors++;
      BrainForge.Audio.wrong();
      showFeedback("error", "✗");
    }

    updateStats();
    awaitingResponse = false;
    respondBtn.disabled = true;

    isiTimer = setTimeout(function () {
      if (!levelActive) return;
      trialIdx++;
      runNextTrial();
    }, 300);
  }

  function evaluateTrial() {
    // Called when stimulus time expires without response
    if (responded) return;
    awaitingResponse = false;
    respondBtn.disabled = true;

    if (currentIsGo) {
      // Miss: GO but no press
      misses++;
      BrainForge.Audio.wrong();
      showFeedback("error", "○");
    } else {
      // Correct inhibition: NO-GO and no press
      correctInhib++;
      showFeedback("correct", "✓");
    }

    updateStats();

    isiTimer = setTimeout(function () {
      if (!levelActive) return;
      trialIdx++;
      runNextTrial();
    }, 300);
  }

  function showFeedback(type, symbol) {
    var fb = document.getElementById("gng-feedback");
    if (!fb) return;
    fb.className = "gng-feedback gng-feedback--" + type;
    fb.textContent = symbol;
  }

  function updateStats() {
    var el;
    el = document.getElementById("gng-hits");
    if (el) el.textContent = hits;
    el = document.getElementById("gng-misses");
    if (el) el.textContent = misses;
    el = document.getElementById("gng-inhib");
    if (el) el.textContent = correctInhib;
    el = document.getElementById("gng-comm");
    if (el) el.textContent = commErrors;
  }

  function updateTrialCount() {
    if (trialCountEl) {
      trialCountEl.textContent = "Trial " + (trialIdx + 1) + " / " + totalTrials;
    }
  }

  function endLevel() {
    levelActive = false;
    clearTimeout(trialTimer);
    clearTimeout(isiTimer);
    document.removeEventListener("keydown", onKeyDown);
    respondBtn.disabled = true;
    showFixation();

    var score = Math.round(((hits + correctInhib) / totalTrials) * 100);
    BrainForge.Audio.levelUp();

    var resultClass = score >= 80 ? "color:var(--success)" : "color:var(--error)";
    var goTrials = hits + misses;
    var nogoTrials = commErrors + correctInhib;

    var overlay = document.getElementById("game-overlay");
    overlay.innerHTML =
      '<div style="text-align:center;padding:24px;">' +
      '<div style="font-size:1.3rem;font-weight:700;margin-bottom:12px;">Level Complete</div>' +
      '<div style="font-size:2rem;font-weight:800;' + resultClass + ";margin-bottom:12px;\">" +
      score + "%" +
      "</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;font-size:0.82rem;color:var(--text-secondary);margin-bottom:20px;text-align:left;">' +
      "<span>Hits (GO correct):</span><span style=\"color:var(--success)\">" + hits + " / " + goTrials + "</span>" +
      "<span>Misses (GO missed):</span><span style=\"color:var(--error)\">" + misses + "</span>" +
      "<span>Inhibitions (NO-GO):</span><span style=\"color:var(--success)\">" + correctInhib + " / " + nogoTrials + "</span>" +
      "<span>Commission errors:</span><span style=\"color:var(--error)\">" + commErrors + "</span>" +
      "</div>" +
      '<button class="btn btn--primary" id="gng-next-btn">Continue</button>' +
      "</div>";
    overlay.style.display = "flex";

    engine.completeLevel(score);

    document.getElementById("gng-next-btn").addEventListener("click", function () {
      overlay.style.display = "none";
      overlay.innerHTML = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
}());
