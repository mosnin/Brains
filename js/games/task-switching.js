(function () {
  "use strict";

  /* ── Task Definitions ── */
  const TASKS = {
    ODD_EVEN: {
      id: "ODD_EVEN",
      label: "ODD or EVEN?",
      color: "#4F6BF5",
      shortLabel: "A=Odd  B=Even",
      answerA: "ODD",
      answerB: "EVEN",
      evaluate: (n) => (n % 2 !== 0 ? "A" : "B"),
    },
    SMALL_LARGE: {
      id: "SMALL_LARGE",
      label: "SMALL or LARGE?",
      color: "#14B8A6",
      shortLabel: "A=Small (1-4)  B=Large (5-9)",
      answerA: "SMALL",
      answerB: "LARGE",
      evaluate: (n) => (n <= 4 ? "A" : "B"),
    },
    GT_FIVE: {
      id: "GT_FIVE",
      label: "GREATER THAN 5?",
      color: "#8B5CF6",
      shortLabel: "A=Yes (>5)  B=No (≤5)",
      answerA: "YES",
      answerB: "NO",
      evaluate: (n) => (n > 5 ? "A" : "B"),
    },
  };

  /* ── Level configuration ── */
  const LEVELS = (function () {
    const cfg = [];
    function push(from, to, trials, switchProb, cueDurationMs, timePer, taskSet) {
      for (let i = from; i <= to; i++) {
        cfg.push({ level: i, trials, switchProb, cueDurationMs, timePer, taskSet });
      }
    }
    // L1-3: single task ODD_EVEN, no switching, unlimited
    push(1, 3,  20, 0.00, 0,   0,    ["ODD_EVEN"]);
    // L4-6: single task SMALL_LARGE, no switching, unlimited
    push(4, 6,  20, 0.00, 0,   0,    ["SMALL_LARGE"]);
    // L7-9: two tasks, 20% switch
    push(7, 9,  30, 0.20, 500, 3000, ["ODD_EVEN", "SMALL_LARGE"]);
    // L10-12
    push(10, 12, 30, 0.30, 400, 2500, ["ODD_EVEN", "SMALL_LARGE"]);
    // L13-15
    push(13, 15, 30, 0.40, 300, 2000, ["ODD_EVEN", "SMALL_LARGE"]);
    // L16-18
    push(16, 18, 40, 0.50, 300, 1800, ["ODD_EVEN", "SMALL_LARGE"]);
    // L19-21: add 3rd task GT_FIVE
    push(19, 21, 40, 0.60, 200, 1600, ["ODD_EVEN", "SMALL_LARGE", "GT_FIVE"]);
    // L22-24
    push(22, 24, 40, 0.70, 200, 1400, ["ODD_EVEN", "SMALL_LARGE", "GT_FIVE"]);
    // L25-27
    push(25, 27, 50, 0.80, 100, 1200, ["ODD_EVEN", "SMALL_LARGE", "GT_FIVE"]);
    // L28-30
    push(28, 30, 50, 0.90, 100, 1000, ["ODD_EVEN", "SMALL_LARGE", "GT_FIVE"]);
    return cfg;
  })();

  /* ── Inject game-specific CSS ── */
  (function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
      .ts-cue-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 20px;
        min-height: 52px;
      }
      .ts-rule-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        border-radius: 24px;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        transition: background 0.2s ease, transform 0.15s ease;
      }
      .ts-rule-indicator.switching {
        animation: ts-rule-pop 0.25s ease;
      }
      @keyframes ts-rule-pop {
        0% { transform: scale(0.88); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
      }
      .ts-sub-label {
        font-size: 13px;
        color: var(--text-secondary);
        text-align: center;
        margin-bottom: 12px;
        min-height: 18px;
      }
      .ts-number-display {
        font-size: 96px;
        font-weight: 900;
        text-align: center;
        color: var(--text-primary);
        margin: 8px auto 28px;
        line-height: 1;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.12s ease;
      }
      .ts-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-bottom: 12px;
      }
      .ts-answer-btn {
        width: 130px;
        padding: 16px 0;
        border-radius: 12px;
        border: 3px solid transparent;
        font-size: 17px;
        font-weight: 800;
        cursor: pointer;
        letter-spacing: 1px;
        transition: transform 0.1s ease, box-shadow 0.1s ease;
        background: var(--bg-elevated);
        color: var(--text-primary);
      }
      .ts-answer-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }
      .ts-answer-btn:active:not(:disabled) {
        transform: translateY(0);
      }
      .ts-answer-btn.btn-a {
        border-color: var(--primary-500);
      }
      .ts-answer-btn.btn-b {
        border-color: var(--accent-500);
      }
      .ts-answer-btn.correct-flash {
        background: var(--success);
        color: #fff;
        border-color: var(--success);
      }
      .ts-answer-btn.wrong-flash {
        background: var(--error);
        color: #fff;
        border-color: var(--error);
      }
      .ts-answer-label {
        display: block;
        font-size: 11px;
        font-weight: 400;
        margin-top: 3px;
        color: var(--text-secondary);
        letter-spacing: 0;
      }
      .ts-progress-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 20px;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .ts-progress-bar-bg {
        flex: 1;
        max-width: 260px;
        height: 6px;
        background: var(--bg-elevated);
        border-radius: 3px;
        overflow: hidden;
      }
      .ts-progress-bar {
        height: 100%;
        background: var(--primary-500);
        border-radius: 3px;
        transition: width 0.2s ease;
      }
      .ts-result-flash {
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        height: 26px;
        margin-bottom: 6px;
        transition: opacity 0.3s;
      }
      .ts-switch-badge {
        display: inline-block;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 8px;
        background: var(--bg-elevated);
        color: var(--text-secondary);
        margin-left: 8px;
        vertical-align: middle;
        letter-spacing: 0.5px;
      }
      .ts-cue-flash {
        animation: ts-cue-blink 0.2s ease;
      }
      @keyframes ts-cue-blink {
        0% { opacity: 0; } 100% { opacity: 1; }
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
  let cueTimer = null;
  let awaitingResponse = false;
  let showingCue = false;

  /* ── GameEngine init ── */
  function init() {
    engine = new BrainForge.GameEngine({
      gameId: "task-switching",
      totalLevels: 30,
      passThreshold: 0.80,
      onGameStart: startLevel,
    });
  }

  /* ── Build trial sequence ── */
  function buildTrials(cfg) {
    const taskSet = cfg.taskSet.map((id) => TASKS[id]);
    const list = [];
    let currentTask = taskSet[Math.floor(Math.random() * taskSet.length)];

    for (let i = 0; i < cfg.trials; i++) {
      const isSwitch = i > 0 && cfg.switchProb > 0 && Math.random() < cfg.switchProb;
      if (isSwitch) {
        const others = taskSet.filter((t) => t.id !== currentTask.id);
        currentTask = others[Math.floor(Math.random() * others.length)];
      }
      const number = Math.floor(Math.random() * 9) + 1; // 1–9
      const correctAns = currentTask.evaluate(number);
      list.push({
        task: currentTask,
        number,
        correctAns,
        isSwitch: i > 0 && isSwitch,
      });
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

  /* ── Render static game area ── */
  function renderGameArea() {
    const area = document.getElementById("game-area");
    area.innerHTML = `
      <div class="ts-progress-wrap">
        <span id="ts-trial-count">0 / ${totalTrials}</span>
        <div class="ts-progress-bar-bg">
          <div class="ts-progress-bar" id="ts-progress-bar" style="width:0%"></div>
        </div>
        <span id="ts-correct-count">✓ 0</span>
      </div>
      <div class="ts-result-flash" id="ts-result-flash"></div>
      <div class="ts-cue-display">
        <div class="ts-rule-indicator" id="ts-rule-indicator">—</div>
      </div>
      <div class="ts-sub-label" id="ts-sub-label"></div>
      <div class="ts-number-display" id="ts-number-display">—</div>
      <div class="ts-buttons">
        <button class="ts-answer-btn btn-a" id="ts-btn-a" disabled>
          A
          <span class="ts-answer-label" id="ts-label-a"></span>
        </button>
        <button class="ts-answer-btn btn-b" id="ts-btn-b" disabled>
          B
          <span class="ts-answer-label" id="ts-label-b"></span>
        </button>
      </div>
    `;

    document.getElementById("ts-btn-a").addEventListener("click", () => handleAnswer("A"));
    document.getElementById("ts-btn-b").addEventListener("click", () => handleAnswer("B"));
  }

  /* ── Trial logic ── */
  function nextTrial() {
    if (trialIndex >= totalTrials) {
      finishLevel();
      return;
    }

    const cfg = LEVELS[currentLevel - 1];
    const trial = trials[trialIndex];

    updateProgress();

    // Show cue phase (if cueDurationMs > 0)
    if (cfg.cueDurationMs > 0) {
      showingCue = true;
      awaitingResponse = false;
      setButtonsDisabled(true);

      displayCue(trial, true);
      hideNumber();

      clearCueTimer();
      cueTimer = setTimeout(() => {
        showingCue = false;
        beginResponsePhase(trial, cfg);
      }, cfg.cueDurationMs);
    } else {
      // Unlimited time: show cue + number together
      displayCue(trial, false);
      showNumber(trial.number);
      beginResponsePhase(trial, cfg);
    }
  }

  function beginResponsePhase(trial, cfg) {
    awaitingResponse = true;
    showNumber(trial.number);
    setButtonsDisabled(false);
    updateButtonLabels(trial.task);

    if (cfg.timePer > 0) {
      clearTrialTimer();
      trialTimer = setTimeout(() => {
        if (!awaitingResponse) return;
        awaitingResponse = false;
        setButtonsDisabled(true);
        showResultFlash("⏱ Too slow!", "var(--text-secondary)");
        BrainForge.Audio.wrong();
        trialIndex++;
        scheduleNextTrial(400);
      }, cfg.timePer);
    }
  }

  function handleAnswer(choice) {
    if (!awaitingResponse) return;
    awaitingResponse = false;
    clearTrialTimer();
    setButtonsDisabled(true);

    const trial = trials[trialIndex];
    const isCorrect = choice === trial.correctAns;

    if (isCorrect) {
      correct++;
      BrainForge.Audio.correct();
      showResultFlash("✓ Correct!", "var(--success)");
      flashAnswerBtn(choice, "correct-flash");
    } else {
      BrainForge.Audio.wrong();
      const wrongChoice = choice === "A" ? "B" : "A";
      showResultFlash("✗ Wrong! It was " + trial.task[`answer${trial.correctAns}`], "var(--error)");
      flashAnswerBtn(choice, "wrong-flash");
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
    clearCueTimer();
    const pct = (correct / totalTrials) * 100;
    engine.completeLevel(pct);
    BrainForge.Audio.levelUp();
  }

  /* ── Display helpers ── */
  function displayCue(trial, isCueOnly) {
    const indicator = document.getElementById("ts-rule-indicator");
    const subLabel = document.getElementById("ts-sub-label");
    if (!indicator) return;

    const wasSwitch = trial.isSwitch;
    indicator.style.background = trial.task.color;
    indicator.innerHTML =
      trial.task.label +
      (wasSwitch ? '<span class="ts-switch-badge">SWITCH!</span>' : "");
    if (wasSwitch) {
      indicator.classList.remove("switching");
      void indicator.offsetWidth; // reflow
      indicator.classList.add("switching");
    }
    if (subLabel) subLabel.textContent = trial.task.shortLabel;
    updateButtonLabels(trial.task);
  }

  function showNumber(n) {
    const el = document.getElementById("ts-number-display");
    if (!el) return;
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent = n;
      el.style.opacity = "1";
    }, 60);
  }

  function hideNumber() {
    const el = document.getElementById("ts-number-display");
    if (el) {
      el.textContent = "—";
      el.style.opacity = "0.3";
    }
  }

  function updateButtonLabels(task) {
    const labelA = document.getElementById("ts-label-a");
    const labelB = document.getElementById("ts-label-b");
    if (labelA) labelA.textContent = task.answerA;
    if (labelB) labelB.textContent = task.answerB;
  }

  function flashAnswerBtn(choice, cls) {
    const btn = document.getElementById(`ts-btn-${choice.toLowerCase()}`);
    if (!btn) return;
    btn.classList.add(cls);
    setTimeout(() => btn.classList.remove(cls), 400);
  }

  function setButtonsDisabled(disabled) {
    ["a", "b"].forEach((side) => {
      const btn = document.getElementById(`ts-btn-${side}`);
      if (!btn) return;
      btn.disabled = disabled;
      btn.style.opacity = disabled ? "0.5" : "1";
      btn.style.cursor = disabled ? "not-allowed" : "pointer";
    });
  }

  function showResultFlash(msg, color) {
    const el = document.getElementById("ts-result-flash");
    if (!el) return;
    el.textContent = msg;
    el.style.color = color;
    el.style.opacity = "1";
    setTimeout(() => { el.style.opacity = "0"; }, 350);
  }

  function updateProgress() {
    const countEl = document.getElementById("ts-trial-count");
    const barEl = document.getElementById("ts-progress-bar");
    const correctEl = document.getElementById("ts-correct-count");
    if (countEl) countEl.textContent = `${trialIndex + 1} / ${totalTrials}`;
    if (barEl) barEl.style.width = `${(trialIndex / totalTrials) * 100}%`;
    if (correctEl) correctEl.textContent = `✓ ${correct}`;
  }

  /* ── Cleanup ── */
  function clearTrialTimer() {
    if (trialTimer) { clearTimeout(trialTimer); trialTimer = null; }
  }
  function clearCueTimer() {
    if (cueTimer) { clearTimeout(cueTimer); cueTimer = null; }
  }

  /* ── Boot ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
