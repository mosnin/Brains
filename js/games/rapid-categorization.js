(function () {
  "use strict";

  // ── Word Lists ───────────────────────────────────────────────────────────────
  const WORDS = {
    ANIMAL: [
      "Dog","Cat","Tiger","Eagle","Shark","Horse","Frog","Snake","Bear","Wolf",
      "Rabbit","Deer","Whale","Crow","Fox","Owl","Lion","Monkey","Zebra","Penguin",
      "Dolphin","Elephant","Crocodile","Parrot","Giraffe","Hamster","Turtle","Bat","Salmon","Hawk"
    ],
    OBJECT: [
      "Chair","Table","Lamp","Phone","Bottle","Brick","Clock","Knife","Mirror","Rope",
      "Shoe","Bag","Pen","Book","Jar","Pillow","Blanket","Cup","Wheel","Nail",
      "Key","Plate","Box","Coin","Vase","Ring","Cable","Helmet","Ruler","Brush"
    ],
    FOOD: [
      "Apple","Bread","Rice","Pizza","Carrot","Egg","Milk","Steak","Soup","Banana",
      "Cheese","Pasta","Mango","Lettuce","Butter","Corn","Tuna","Honey","Yogurt","Lemon",
      "Onion","Bacon","Grape","Peach","Oats","Tofu","Salmon","Waffle","Beet","Cream"
    ],
    TOOL: [
      "Hammer","Drill","Wrench","Saw","Pliers","Chisel","Screwdriver","Level","Clamp","File",
      "Lathe","Trowel","Axe","Mallet","Scythe","Vice","Grinder","Jigsaw","Plane","Rasp",
      "Punch","Stapler","Cutter","Caliper","Gauge","Press","Crowbar","Sander","Rivet","Bolt"
    ],
    LIVING: [
      "Tree","Fungus","Seaweed","Moss","Coral","Rose","Fern","Oak","Cactus","Bamboo",
      "Spider","Beetle","Worm","Moth","Fly","Ant","Bee","Crab","Clam","Shrimp",
      "Human","Child","Elder","Sprout","Algae","Lichen","Plankton","Mold","Yeast","Orchid"
    ],
    NONLIVING: [
      "Stone","Metal","Glass","Plastic","Sand","Smoke","Ice","Cloud","Gravel","Ash",
      "Steam","Foam","Rust","Dust","Clay","Wax","Tar","Paper","Fabric","Ceramic",
      "Crystal","Pebble","Concrete","Soil","Coal","Marble","Slate","Steel","Bronze","Rubber"
    ],
    FAST: [
      "Jet","Bullet","Cheetah","Flash","Sprint","Lightning","Rocket","Ferrari","Missile","Laser",
      "Arrow","Bolt","Blitz","Comet","Falcon","Turbo","Dash","Surge","Gust","Rapid",
      "Express","Pulse","Streak","Zoom","Rush","Charge","Blast","Swift","Racer","Speed"
    ],
    SLOW: [
      "Snail","Glacier","Turtle","Crawl","Drift","Plod","Trickle","Ooze","Trudge","Stroll",
      "Creep","Limp","Sloth","Waddle","Amble","Lumber","Seep","Inch","Plough","Lug",
      "Meander","Mosey","Dawdle","Lag","Delay","Slog","Grind","Steep","Tread","Slouch"
    ],
    PLANT: [
      "Rose","Oak","Cactus","Fern","Bamboo","Moss","Tulip","Spruce","Ivy","Daisy",
      "Wheat","Willow","Maple","Pine","Sage","Basil","Mint","Palm","Lotus","Nettle",
      "Vine","Reed","Clover","Thistle","Kelp","Shrub","Bush","Blossom","Grass","Trunk"
    ],
    PERSON: [
      "Doctor","Teacher","Chef","Pilot","Nurse","Soldier","Judge","Priest","Farmer","Actor",
      "Poet","Mayor","Guard","Monk","Coach","Sailor","Artist","Dancer","Writer","Trader",
      "Banker","Vendor","Ranger","Warden","Miner","Driver","Miller","Baker","Hunter","Clerk"
    ],
  };

  // ── Level config ─────────────────────────────────────────────────────────────
  // categories: array of category keys used at this level
  const LEVELS = [
    null, // index 0 unused
    { items: 20, time: 3000, cats: ["ANIMAL","OBJECT"] },         // 1
    { items: 20, time: 3000, cats: ["ANIMAL","OBJECT"] },         // 2
    { items: 20, time: 2500, cats: ["ANIMAL","OBJECT"] },         // 3
    { items: 20, time: 2500, cats: ["ANIMAL","OBJECT"] },         // 4
    { items: 20, time: 2000, cats: ["ANIMAL","OBJECT"] },         // 5
    { items: 20, time: 2000, cats: ["ANIMAL","OBJECT"] },         // 6
    { items: 20, time: 2500, cats: ["FOOD","TOOL"] },             // 7
    { items: 20, time: 2500, cats: ["FOOD","TOOL"] },             // 8
    { items: 20, time: 2000, cats: ["FOOD","TOOL"] },             // 9
    { items: 20, time: 2000, cats: ["FOOD","TOOL"] },             // 10
    { items: 20, time: 1500, cats: ["FOOD","TOOL"] },             // 11
    { items: 20, time: 1500, cats: ["FOOD","TOOL"] },             // 12
    { items: 25, time: 2000, cats: ["LIVING","NONLIVING"] },      // 13
    { items: 25, time: 2000, cats: ["LIVING","NONLIVING"] },      // 14
    { items: 25, time: 1500, cats: ["LIVING","NONLIVING"] },      // 15
    { items: 25, time: 1500, cats: ["LIVING","NONLIVING"] },      // 16
    { items: 25, time: 1200, cats: ["LIVING","NONLIVING"] },      // 17
    { items: 25, time: 1200, cats: ["LIVING","NONLIVING"] },      // 18
    { items: 25, time: 2000, cats: ["FAST","SLOW"] },             // 19
    { items: 25, time: 2000, cats: ["FAST","SLOW"] },             // 20
    { items: 25, time: 1500, cats: ["FAST","SLOW"] },             // 21
    { items: 25, time: 1500, cats: ["FAST","SLOW"] },             // 22
    { items: 25, time: 1200, cats: ["FAST","SLOW"] },             // 23
    { items: 25, time: 1200, cats: ["FAST","SLOW"] },             // 24
    { items: 30, time: 2000, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 25
    { items: 30, time: 2000, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 26
    { items: 30, time: 1500, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 27
    { items: 30, time: 1500, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 28
    { items: 30, time: 1000, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 29
    { items: 30, time: 1000, cats: ["ANIMAL","PLANT","OBJECT","PERSON"] }, // 30
  ];

  // Display labels for categories
  const CAT_LABELS = {
    ANIMAL:   "Animal",
    OBJECT:   "Object",
    FOOD:     "Food",
    TOOL:     "Tool",
    LIVING:   "Living",
    NONLIVING:"Non-Living",
    FAST:     "Fast",
    SLOW:     "Slow",
    PLANT:    "Plant",
    PERSON:   "Person",
  };

  // Category button accent colors
  const CAT_COLORS = [
    "#4F6BF5", // blue
    "#14B8A6", // teal
    "#F59E0B", // amber
    "#A855F7", // purple
  ];

  const PASS_THRESHOLD = 80;
  const TOTAL_LEVELS   = 30;

  // ── State ────────────────────────────────────────────────────────────────────
  let engine, currentLevel, cfg;
  let queue = [];          // Array of {word, correctCat}
  let itemIndex, correctCount, totalItems;
  let itemTimer   = null;
  let answerLocked= false;

  // ── Utility ──────────────────────────────────────────────────────────────────
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Build a balanced queue of items for the level */
  function buildQueue(cats, itemCount) {
    const perCat = Math.ceil(itemCount / cats.length);
    let result   = [];
    cats.forEach(cat => {
      const pool = shuffle(WORDS[cat]);
      for (let i = 0; i < perCat; i++) {
        result.push({ word: pool[i % pool.length], correctCat: cat });
      }
    });
    return shuffle(result).slice(0, itemCount);
  }

  // ── CSS Injection ─────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById("rc-styles")) return;
    const style = document.createElement("style");
    style.id = "rc-styles";
    style.textContent = `
      #game-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 28px;
        padding: 32px 16px;
        min-height: 420px;
        position: relative;
      }
      .rc-progress-bar-wrap {
        width: 100%;
        max-width: 420px;
        background: var(--bg-elevated);
        border-radius: 999px;
        height: 6px;
        overflow: hidden;
      }
      .rc-progress-bar {
        height: 100%;
        background: var(--primary-500);
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .rc-item-counter {
        font-size: 0.8rem;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
      }
      .rc-timer-wrap {
        width: 100%;
        max-width: 420px;
        background: var(--bg-elevated);
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
      }
      .rc-timer-bar {
        height: 100%;
        background: var(--accent-500);
        border-radius: 999px;
        transition: width linear;
      }
      .rc-word-display {
        font-size: clamp(2rem, 8vw, 3.5rem);
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        text-align: center;
        min-height: 1.3em;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.1s;
        padding: 0 12px;
      }
      .rc-word-display.rc-flash-in {
        animation: rcWordIn 0.18s ease-out;
      }
      @keyframes rcWordIn {
        from { opacity: 0; transform: scale(0.85) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      .rc-feedback {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 1.5rem;
        font-weight: 800;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;
      }
      .rc-feedback.show-correct {
        color: var(--success);
        opacity: 1;
        animation: rcFeedback 0.6s ease-out forwards;
      }
      .rc-feedback.show-wrong {
        color: var(--error);
        opacity: 1;
        animation: rcFeedback 0.6s ease-out forwards;
      }
      @keyframes rcFeedback {
        0%   { opacity: 1; transform: translateY(0);   }
        60%  { opacity: 1; transform: translateY(-12px);}
        100% { opacity: 0; transform: translateY(-20px);}
      }
      .rc-category-buttons {
        display: grid;
        gap: 12px;
        width: 100%;
        max-width: 460px;
      }
      .rc-category-buttons.cats-2 {
        grid-template-columns: 1fr 1fr;
      }
      .rc-category-buttons.cats-4 {
        grid-template-columns: 1fr 1fr;
      }
      .rc-cat-btn {
        padding: 14px 10px;
        border-radius: 10px;
        border: 2px solid transparent;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        color: #fff;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        transition: transform 0.1s, box-shadow 0.1s, opacity 0.15s;
        outline: none;
      }
      .rc-cat-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      }
      .rc-cat-btn:active:not(:disabled) {
        transform: scale(0.96);
      }
      .rc-cat-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .rc-cat-btn.flash-correct {
        box-shadow: 0 0 0 4px var(--success);
      }
      .rc-cat-btn.flash-wrong {
        box-shadow: 0 0 0 4px var(--error);
      }
      @media (max-width: 400px) {
        .rc-cat-btn { font-size: 0.85rem; padding: 12px 6px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Build UI ──────────────────────────────────────────────────────────────────
  function buildUI() {
    const area = document.getElementById("game-area");
    const catCount = cfg.cats.length;
    area.innerHTML = `
      <div class="rc-progress-bar-wrap">
        <div class="rc-progress-bar" id="rc-progress-bar" style="width:0%"></div>
      </div>
      <div class="rc-item-counter" id="rc-item-counter">Item 1 / ${totalItems}</div>
      <div class="rc-timer-wrap">
        <div class="rc-timer-bar" id="rc-timer-bar" style="width:100%"></div>
      </div>
      <div class="rc-word-display" id="rc-word-display">&nbsp;</div>
      <div class="rc-feedback" id="rc-feedback"></div>
      <div class="rc-category-buttons cats-${catCount}" id="rc-cat-buttons"></div>
    `;

    // Build category buttons
    const btnContainer = document.getElementById("rc-cat-buttons");
    cfg.cats.forEach((cat, i) => {
      const btn = document.createElement("button");
      btn.className   = "rc-cat-btn";
      btn.dataset.cat = cat;
      btn.textContent = CAT_LABELS[cat];
      btn.style.background   = CAT_COLORS[i % CAT_COLORS.length];
      btn.style.borderColor  = CAT_COLORS[i % CAT_COLORS.length];
      btn.addEventListener("click", () => onCategoryClick(cat));
      btnContainer.appendChild(btn);
    });
  }

  // ── Item timer ────────────────────────────────────────────────────────────────
  function startItemTimer(duration) {
    const bar = document.getElementById("rc-timer-bar");
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width      = "100%";
    // Force reflow
    bar.offsetWidth; // eslint-disable-line no-unused-expressions
    bar.style.transition = `width ${duration}ms linear`;
    bar.style.width      = "0%";

    clearTimeout(itemTimer);
    itemTimer = setTimeout(() => {
      // Time ran out — count as wrong
      onCategoryClick(null);
    }, duration);
  }

  // ── Show next item ────────────────────────────────────────────────────────────
  function showItem() {
    if (itemIndex >= totalItems) {
      endLevel();
      return;
    }

    answerLocked = false;

    const item    = queue[itemIndex];
    const counter = document.getElementById("rc-item-counter");
    const wordEl  = document.getElementById("rc-word-display");
    const progress= document.getElementById("rc-progress-bar");
    const btns    = document.querySelectorAll(".rc-cat-btn");

    counter.textContent = `Item ${itemIndex + 1} / ${totalItems}`;
    progress.style.width = `${(itemIndex / totalItems) * 100}%`;

    // Re-enable buttons
    btns.forEach(b => {
      b.disabled = false;
      b.classList.remove("flash-correct","flash-wrong");
    });

    // Animate word in
    wordEl.classList.remove("rc-flash-in");
    wordEl.textContent = item.word;
    void wordEl.offsetWidth; // reflow
    wordEl.classList.add("rc-flash-in");

    startItemTimer(cfg.time);
  }

  // ── Handle click ──────────────────────────────────────────────────────────────
  function onCategoryClick(selectedCat) {
    if (answerLocked) return;
    answerLocked = true;
    clearTimeout(itemTimer);

    const item    = queue[itemIndex];
    const isRight = selectedCat === item.correctCat;
    const feedback= document.getElementById("rc-feedback");
    const btns    = document.querySelectorAll(".rc-cat-btn");

    // Disable all buttons
    btns.forEach(b => b.disabled = true);

    // Highlight correct and selected
    btns.forEach(b => {
      if (b.dataset.cat === item.correctCat) b.classList.add("flash-correct");
    });
    if (selectedCat && selectedCat !== item.correctCat) {
      const wrongBtn = document.querySelector(`.rc-cat-btn[data-cat="${selectedCat}"]`);
      if (wrongBtn) wrongBtn.classList.add("flash-wrong");
    }

    // Feedback icon
    feedback.className = "rc-feedback";
    void feedback.offsetWidth;
    if (isRight) {
      feedback.textContent = "✓";
      feedback.className   = "rc-feedback show-correct";
      correctCount++;
      BrainForge.Audio.correct();
    } else {
      feedback.textContent = selectedCat ? "✗" : "⏱";
      feedback.className   = "rc-feedback show-wrong";
      BrainForge.Audio.wrong();
    }

    const pct = Math.round((correctCount / (itemIndex + 1)) * 100);
    engine.updateScore(pct);

    itemIndex++;
    setTimeout(showItem, 600);
  }

  function endLevel() {
    const pct = Math.round((correctCount / totalItems) * 100);
    engine.completeLevel(pct);
  }

  // ── Engine callback ───────────────────────────────────────────────────────────
  function onGameStart(level) {
    currentLevel = level;
    cfg          = LEVELS[level];
    totalItems   = cfg.items;
    itemIndex    = 0;
    correctCount = 0;
    queue        = buildQueue(cfg.cats, totalItems);

    buildUI();
    setTimeout(showItem, 300);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();

    engine = new BrainForge.GameEngine({
      gameId:        "rapid-categorization",
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
