(function () {
  "use strict";

  // ── Level config ────────────────────────────────────────────────────────────
  const LEVELS = [
    null, // index 0 unused
    { grid: 3, filled: 3,  flash: 1500, diff: 2 }, // 1
    { grid: 3, filled: 3,  flash: 1500, diff: 2 }, // 2
    { grid: 3, filled: 4,  flash: 1200, diff: 2 }, // 3
    { grid: 3, filled: 4,  flash: 1200, diff: 2 }, // 4
    { grid: 3, filled: 5,  flash: 1000, diff: 1 }, // 5
    { grid: 3, filled: 5,  flash: 1000, diff: 1 }, // 6
    { grid: 4, filled: 5,  flash:  900, diff: 2 }, // 7
    { grid: 4, filled: 5,  flash:  900, diff: 2 }, // 8
    { grid: 4, filled: 6,  flash:  700, diff: 2 }, // 9
    { grid: 4, filled: 6,  flash:  700, diff: 2 }, // 10
    { grid: 4, filled: 7,  flash:  600, diff: 1 }, // 11
    { grid: 4, filled: 7,  flash:  600, diff: 1 }, // 12
    { grid: 4, filled: 8,  flash:  500, diff: 1 }, // 13
    { grid: 4, filled: 8,  flash:  500, diff: 1 }, // 14
    { grid: 5, filled: 8,  flash:  500, diff: 2 }, // 15
    { grid: 5, filled: 8,  flash:  500, diff: 2 }, // 16
    { grid: 5, filled: 10, flash:  400, diff: 2 }, // 17
    { grid: 5, filled: 10, flash:  400, diff: 2 }, // 18
    { grid: 5, filled: 12, flash:  350, diff: 2 }, // 19
    { grid: 5, filled: 12, flash:  350, diff: 2 }, // 20
    { grid: 5, filled: 12, flash:  300, diff: 1 }, // 21
    { grid: 5, filled: 12, flash:  300, diff: 1 }, // 22
    { grid: 5, filled: 14, flash:  250, diff: 1 }, // 23
    { grid: 5, filled: 14, flash:  250, diff: 1 }, // 24
    { grid: 6, filled: 14, flash:  200, diff: 2 }, // 25
    { grid: 6, filled: 14, flash:  200, diff: 2 }, // 26
    { grid: 6, filled: 16, flash:  150, diff: 2 }, // 27
    { grid: 6, filled: 16, flash:  150, diff: 2 }, // 28
    { grid: 6, filled: 18, flash:  100, diff: 1 }, // 29
    { grid: 6, filled: 18, flash:  100, diff: 1 }, // 30
  ];

  const ROUNDS_PER_LEVEL = 10;
  const PASS_THRESHOLD   = 80;
  const TOTAL_LEVELS     = 30;

  // Canvas drawing constants
  const CANVAS_SIZE      = 200; // large pattern canvas (px)
  const CHOICE_SIZE      = 110; // small choice canvas (px)
  const FILLED_COLORS    = ["#4F6BF5", "#14B8A6", "#F59E0B", "#EF4444"];
  const EMPTY_COLOR      = "#334155";
  const BORDER_COLOR     = "#475569";

  // ── State ───────────────────────────────────────────────────────────────────
  let engine, currentLevel, cfg;
  let roundIndex, correct, patternCells;
  let answerLocked = false;
  let flashTimeout  = null;

  // ── Utility ─────────────────────────────────────────────────────────────────
  function rng(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Generate a random set of `filled` unique cell indices in a grid*grid board */
  function randomPattern(gridSize, filledCount) {
    const total = gridSize * gridSize;
    const indices = shuffle([...Array(total).keys()]);
    return indices.slice(0, filledCount).sort((a, b) => a - b);
  }

  /** Create a distractor by swapping `diff` cells */
  function makeDistractor(original, gridSize, diff) {
    const total = gridSize * gridSize;
    const filledSet = new Set(original);
    const empty     = [];
    for (let i = 0; i < total; i++) if (!filledSet.has(i)) empty.push(i);

    if (empty.length === 0 || original.length === 0) return original.slice();

    const safeFlip = Math.min(diff, Math.floor(original.length / 2), empty.length);
    const toRemove = shuffle(original).slice(0, safeFlip);
    const toAdd    = shuffle(empty).slice(0, safeFlip);

    const result = new Set(original);
    toRemove.forEach(v => result.delete(v));
    toAdd.forEach(v => result.add(v));
    return [...result].sort((a, b) => a - b);
  }

  /** Draw a pattern on a canvas */
  function drawPattern(canvas, cells, gridSize, size) {
    const ctx    = canvas.getContext("2d");
    const margin = Math.floor(size * 0.05);
    const avail  = size - margin * 2;
    const cell   = Math.floor(avail / gridSize);
    const pad    = Math.max(2, Math.floor(cell * 0.08));
    const r      = Math.max(2, Math.floor((cell - pad * 2) / 2));

    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(0, 0, size, size);

    const filledSet = new Set(cells);
    const colorIdx  = cells.length % FILLED_COLORS.length;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const idx = row * gridSize + col;
        const cx  = margin + col * cell + cell / 2;
        const cy  = margin + row * cell + cell / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);

        if (filledSet.has(idx)) {
          ctx.fillStyle = FILLED_COLORS[colorIdx];
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF22";
          ctx.lineWidth   = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = EMPTY_COLOR;
          ctx.fill();
          ctx.strokeStyle = BORDER_COLOR;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }
    }
  }

  // ── Inject CSS ───────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById("vps-styles")) return;
    const style = document.createElement("style");
    style.id = "vps-styles";
    style.textContent = `
      #game-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: 24px 16px;
        min-height: 400px;
      }
      .vps-flash-timer {
        font-size: 0.85rem;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        min-height: 1.4em;
      }
      .vps-pattern-area {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid var(--bg-elevated);
        background: var(--bg-surface);
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        transition: border-color 0.2s;
      }
      .vps-pattern-area.vps-visible {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(79,107,245,0.25), 0 4px 24px rgba(0,0,0,0.4);
      }
      .vps-round-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: -12px;
      }
      .vps-instruction {
        font-size: 1.05rem;
        color: var(--text-primary);
        font-weight: 600;
        text-align: center;
        min-height: 1.5em;
      }
      .vps-choices-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-top: 4px;
      }
      .vps-choice-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        border-radius: 10px;
        border: 2px solid var(--bg-elevated);
        overflow: hidden;
        background: var(--bg-surface);
        transition: border-color 0.15s, transform 0.12s;
        padding: 0;
        outline: none;
      }
      .vps-choice-wrap:hover:not(:disabled) {
        border-color: var(--primary-500);
        transform: translateY(-2px);
      }
      .vps-choice-wrap:active:not(:disabled) {
        transform: scale(0.97);
      }
      .vps-choice-wrap.correct {
        border-color: var(--success) !important;
        box-shadow: 0 0 0 3px rgba(34,197,94,0.3);
      }
      .vps-choice-wrap.wrong {
        border-color: var(--error) !important;
        box-shadow: 0 0 0 3px rgba(239,68,68,0.25);
      }
      .vps-choice-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        padding: 4px 0 2px;
        user-select: none;
      }
      .vps-no-peek {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: var(--text-secondary);
        background: var(--bg-surface);
      }
      @media (max-width: 480px) {
        .vps-choices-grid { gap: 10px; }
        .vps-choice-wrap canvas { width: 90px !important; height: 90px !important; }
        .vps-pattern-area canvas { width: 160px !important; height: 160px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Build game UI ────────────────────────────────────────────────────────────
  function buildUI() {
    const area = document.getElementById("game-area");
    area.innerHTML = `
      <span class="vps-round-label" id="vps-round-label">Round 1 / ${ROUNDS_PER_LEVEL}</span>
      <span class="vps-flash-timer" id="vps-flash-timer">&nbsp;</span>
      <div class="vps-pattern-area" id="vps-pattern-area">
        <canvas id="vps-main-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
      </div>
      <div class="vps-instruction" id="vps-instruction">Get ready…</div>
      <div class="vps-choices-grid" id="vps-choices-grid" style="visibility:hidden"></div>
    `;
  }

  // ── Round logic ──────────────────────────────────────────────────────────────
  function startRound() {
    if (roundIndex >= ROUNDS_PER_LEVEL) {
      endLevel();
      return;
    }

    answerLocked = false;
    const area      = document.getElementById("vps-pattern-area");
    const mainCanvas= document.getElementById("vps-main-canvas");
    const instruct  = document.getElementById("vps-instruction");
    const timer     = document.getElementById("vps-flash-timer");
    const grid      = document.getElementById("vps-choices-grid");
    const label     = document.getElementById("vps-round-label");

    label.textContent   = `Round ${roundIndex + 1} / ${ROUNDS_PER_LEVEL}`;
    grid.style.visibility = "hidden";
    grid.innerHTML = "";

    // Generate pattern
    patternCells = randomPattern(cfg.grid, cfg.filled);

    // Build 4 choices: 1 correct + 3 distractors
    const choices = [{ cells: patternCells, correct: true }];
    let attempts = 0;
    while (choices.length < 4 && attempts < 200) {
      attempts++;
      const d = makeDistractor(patternCells, cfg.grid, cfg.diff);
      // Ensure uniqueness
      const key = d.join(",");
      if (!choices.some(c => c.cells.join(",") === key)) {
        choices.push({ cells: d, correct: false });
      }
    }
    const shuffled = shuffle(choices);

    // Show flash
    timer.textContent  = `Pattern flashes for ${cfg.flash}ms`;
    instruct.textContent = "Memorize the pattern!";
    area.classList.add("vps-visible");

    // Draw main pattern
    drawPattern(mainCanvas, patternCells, cfg.grid, CANVAS_SIZE);

    // Hide after flash duration
    flashTimeout = setTimeout(() => {
      // Replace canvas with blank placeholder
      area.classList.remove("vps-visible");
      const blank = document.createElement("div");
      blank.className = "vps-no-peek";
      blank.style.width  = CANVAS_SIZE + "px";
      blank.style.height = CANVAS_SIZE + "px";
      blank.textContent  = "?";
      area.innerHTML = "";
      area.appendChild(blank);

      timer.textContent    = "";
      instruct.textContent = "Which pattern did you see?";

      // Build choices
      shuffled.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.className   = "vps-choice-wrap";
        btn.dataset.correct = choice.correct ? "1" : "0";

        const cvs       = document.createElement("canvas");
        cvs.width       = CHOICE_SIZE;
        cvs.height      = CHOICE_SIZE;
        cvs.style.display = "block";
        drawPattern(cvs, choice.cells, cfg.grid, CHOICE_SIZE);

        const lbl       = document.createElement("span");
        lbl.className   = "vps-choice-label";
        lbl.textContent = String.fromCharCode(65 + i); // A B C D

        btn.appendChild(cvs);
        btn.appendChild(lbl);
        btn.addEventListener("click", () => onChoiceClick(btn, choice.correct, shuffled));
        grid.appendChild(btn);
      });

      grid.style.visibility = "visible";
    }, cfg.flash);
  }

  function onChoiceClick(btn, isCorrect, allChoices) {
    if (answerLocked) return;
    answerLocked = true;

    const grid = document.getElementById("vps-choices-grid");
    // Disable all buttons
    grid.querySelectorAll(".vps-choice-wrap").forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === "1") b.classList.add("correct");
    });

    if (isCorrect) {
      btn.classList.add("correct");
      correct++;
      BrainForge.Audio.correct();
    } else {
      btn.classList.add("wrong");
      BrainForge.Audio.wrong();
    }

    const pct = Math.round((correct / (roundIndex + 1)) * 100);
    engine.updateScore(pct);

    roundIndex++;
    setTimeout(nextRound, 900);
  }

  function nextRound() {
    // Restore main canvas in pattern area
    const area = document.getElementById("vps-pattern-area");
    if (area) {
      area.innerHTML = "";
      const cvs = document.createElement("canvas");
      cvs.id     = "vps-main-canvas";
      cvs.width  = CANVAS_SIZE;
      cvs.height = CANVAS_SIZE;
      area.appendChild(cvs);
      // Clear it
      const ctx = cvs.getContext("2d");
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
    startRound();
  }

  function endLevel() {
    const pct = Math.round((correct / ROUNDS_PER_LEVEL) * 100);
    engine.completeLevel(pct);
  }

  // ── Engine callbacks ─────────────────────────────────────────────────────────
  function onGameStart(level) {
    currentLevel = level;
    cfg          = LEVELS[level];
    roundIndex   = 0;
    correct      = 0;

    buildUI();
    // Small delay so engine can update HUD first
    setTimeout(startRound, 400);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();

    engine = new BrainForge.GameEngine({
      gameId:        "visual-processing-speed",
      totalLevels:   TOTAL_LEVELS,
      passThreshold: PASS_THRESHOLD,
      onGameStart:   onGameStart,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
