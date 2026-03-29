(function () {
  "use strict";

  /* ── Palette ── */
  const COLORS = [
    { name: "RED",    hex: "#EF4444" },
    { name: "BLUE",   hex: "#4F6BF5" },
    { name: "GREEN",  hex: "#22C55E" },
    { name: "YELLOW", hex: "#FBBF24" },
    { name: "PURPLE", hex: "#8B5CF6" },
    { name: "ORANGE", hex: "#F97316" },
  ];

  /* ── Level configuration ── */
  const LEVELS = (function () {
    const cfg = [];
    function push(from, to, trials, congruentPct, timePer) {
      for (let i = from; i <= to; i++) {
        cfg.push({ level: i, trials, congruentPct, timePer });
      }
    }
    push(1,  3,  20, 1.00, 3000);
    push(4,  6,  20, 0.70, 3000);
    push(7,  9,  20, 0.50, 2500);
    push(10, 12, 20, 0.40, 2500);
    push(13, 15, 20, 0.30, 2000);
    push(16, 18, 25, 0.20, 2000);
    push(19, 21, 25, 0.10, 1800);
    push(22, 24, 25, 0.05, 1500);
    push(25, 27, 30, 0.00, 1500);
    push(28, 30, 30, 0.00, 1200);
    return cfg;
  })();

  /* ── Inject game-specific CSS ── */
  (function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
      .stroop-word {
        font-size: 72px;
        font-weight: 800;
        letter-spacing: 4px;
        text-align: center;
        margin: 0 auto 32px;
        line-height: 1;
        text-transform: uppercase;
        text-shadow: 0 2px 12px rgba(0,0,0,0.4);
        transition: opacity 0.12s ease;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stroop-instruction {
        font-size: 15px;
        color: var(--text-secondary);
        text-align: center;
        margin-bottom: 28px;
        font-style: italic;
      }
      .stroop-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        max-width: 480px;
        margin: 0 auto;
      }
      .stroop-color-btn {
        padding: 14px 8px;
        border: 3px solid transparent;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 1.5px;
        cursor: pointer;
        transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
        color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        text-transform: uppercase;
      }
      .stroop-color-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      }
      .stroop-color-btn:active {
        transform: translateY(0);
      }
      .stroop-color-btn.correct-flash {
        box-shadow: 0 0 0 4px var(--success);
      }
      .stroop-color-btn.wrong-flash {
        box-shadow: 0 0 0 4px var(--error);
      }
      .stroop-progress-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 24px;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .stroop-progress-bar-bg {
        flex: 1;
        max-width: 260px;
        height: 6px;
        background: var(--bg-elevated);
        border-radius: 3px;
        overflow: hidden;
      }
      .stroop-progress-bar {
        height: 100%;
        background: var(--primary-500);
        border-radius: 3px;
        transition: width 0.2s ease;
      }
      .stroop-result-flash {
        font-size: 20px;
        font-weight: 700;
        text-align: center;
        height: 28px;
        margin-bottom: 8px;
        transition: opacity 0.3s;
      }
    `;
    document.head.appendChild(style);
  })();

  /* ── State ── */
  let engine;
  let currentLevel = 1;
  let trials = [];
  let trialIndex = 0;
  let correct = 0;
  let totalTrials = 0;
  let trialTimer = null;
  let awaitingResponse = false;
  let trialTimerStart = 0;

  /* ── GameEngine init ── */
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: "stroop-color-word",
      totalLevels: 30,
      passThreshold: 0.80,
      onGameStart: startLevel,
    });
  }

  /* ── Build trial list ── */
  function buildTrials(cfg) {
    const list = [];
    const n = cfg.trials;
    const nCongruent = Math.round(n * cfg.congruentPct);
    const nIncongruent = n - nCongruent;

    for (let i = 0; i < nCongruent; i++) {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      list.push({ word: c.name, inkColor: c.hex, inkName: c.name });
    }
    for (let i = 0; i < nIncongruent; i++) {
      const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      let inkColor;
      do {
        inkColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (inkColor.name === wordColor.name);
      list.push({ word: wordColor.name, inkColor: inkColor.hex, inkName: inkColor.name });
    }
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  /* ── Start level ── */
  function startLevel(levelNum) {
    currentLevel = levelNum;
    const cfg = LEVELS[levelNum - 1];
    trials = buildTrials(cfg);
    trialIndex = 0;
    correct = 0;
    totalTrials = cfg.trials;

    renderGameArea();
    nextTrial();
  }

  /* ── Render game area HTML ── */
  function renderGameArea() {
    const area = document.getElementById("game-area");
    area.innerHTML = `
      <div class="stroop-progress-wrap">
        <span id="stroop-trial-count">0 / ${totalTrials}</span>
        <div class="stroop-progress-bar-bg">
          <div class="stroop-progress-bar" id="stroop-progress-bar" style="width:0%"></div>
        </div>
        <span id="stroop-correct-count">✓ 0</span>
      </div>
      <div class="stroop-result-flash" id="stroop-result-flash"></div>
      <div class="stroop-instruction">Click the INK COLOR of the word</div>
      <div class="stroop-word" id="stroop-word"></div>
      <div class="stroop-buttons" id="stroop-buttons"></div>
    `;
    renderColorButtons();
  }

  function renderColorButtons() {
    const container = document.getElementById("stroop-buttons");
    container.innerHTML = "";
    COLORS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "stroop-color-btn";
      btn.dataset.colorName = c.name;
      btn.textContent = c.name;
      btn.style.backgroundColor = c.hex;
      btn.style.borderColor = c.hex;
      btn.addEventListener("click", () => handleAnswer(c.name));
      container.appendChild(btn);
    });
  }

  /* ── Trial logic ── */
  function nextTrial() {
    if (trialIndex >= totalTrials) {
      finishLevel();
      return;
    }

    const cfg = LEVELS[currentLevel - 1];
    const trial = trials[trialIndex];
    awaitingResponse = true;
    trialTimerStart = Date.now();

    // Update word display
    const wordEl = document.getElementById("stroop-word");
    if (wordEl) {
      wordEl.style.opacity = "0";
      setTimeout(() => {
        wordEl.textContent = trial.word;
        wordEl.style.color = trial.inkColor;
        wordEl.style.opacity = "1";
      }, 80);
    }

    // Update progress
    updateProgress();

    // Enable buttons
    setButtonsDisabled(false);

    // Start trial timer (if timed)
    clearTrialTimer();
    trialTimer = setTimeout(() => {
      if (awaitingResponse) {
        awaitingResponse = false;
        setButtonsDisabled(true);
        showResultFlash("⏱ Too slow!", "var(--text-secondary)");
        BrainForge.Audio.wrong();
        trialIndex++;
        scheduleNextTrial(400);
      }
    }, cfg.timePer);
  }

  function handleAnswer(chosenName) {
    if (!awaitingResponse) return;
    awaitingResponse = false;
    clearTrialTimer();
    setButtonsDisabled(true);

    const trial = trials[trialIndex];
    const isCorrect = chosenName === trial.inkName;

    if (isCorrect) {
      correct++;
      BrainForge.Audio.correct();
      showResultFlash("✓ Correct!", "var(--success)");
      flashButton(chosenName, "correct-flash");
    } else {
      BrainForge.Audio.wrong();
      showResultFlash("✗ Wrong ink color!", "var(--error)");
      flashButton(chosenName, "wrong-flash");
    }

    const pct = (correct / totalTrials) * 100;
    engine.updateScore(pct);
    trialIndex++;
    scheduleNextTrial(450);
  }

  function scheduleNextTrial(delay) {
    setTimeout(() => {
      if (trialIndex < totalTrials) {
        nextTrial();
      } else {
        finishLevel();
      }
    }, delay);
  }

  function finishLevel() {
    clearTrialTimer();
    const pct = (correct / totalTrials) * 100;
    engine.completeLevel(pct);
    BrainForge.Audio.levelUp();
  }

  /* ── Helpers ── */
  function clearTrialTimer() {
    if (trialTimer) {
      clearTimeout(trialTimer);
      trialTimer = null;
    }
  }

  function setButtonsDisabled(disabled) {
    const btns = document.querySelectorAll(".stroop-color-btn");
    btns.forEach((b) => {
      b.disabled = disabled;
      b.style.opacity = disabled ? "0.6" : "1";
      b.style.cursor = disabled ? "not-allowed" : "pointer";
    });
  }

  function flashButton(colorName, cls) {
    const btn = document.querySelector(`.stroop-color-btn[data-color-name="${colorName}"]`);
    if (!btn) return;
    btn.classList.add(cls);
    setTimeout(() => btn.classList.remove(cls), 400);
  }

  function showResultFlash(msg, color) {
    const el = document.getElementById("stroop-result-flash");
    if (!el) return;
    el.textContent = msg;
    el.style.color = color;
    el.style.opacity = "1";
    setTimeout(() => {
      el.style.opacity = "0";
    }, 350);
  }

  function updateProgress() {
    const countEl = document.getElementById("stroop-trial-count");
    const barEl = document.getElementById("stroop-progress-bar");
    const correctEl = document.getElementById("stroop-correct-count");
    if (countEl) countEl.textContent = `${trialIndex + 1} / ${totalTrials}`;
    if (barEl) barEl.style.width = `${((trialIndex) / totalTrials) * 100}%`;
    if (correctEl) correctEl.textContent = `✓ ${correct}`;
  }

  /* ── Boot ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
