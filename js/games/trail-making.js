(function () {
  "use strict";

  const LEVELS = (function () {
    const cfg = [
      [8,  "A", 60], [8,  "A", 60], [8,  "A", 60],
      [10, "A", 50], [10, "A", 50], [10, "A", 50],
      [12, "A", 50], [12, "A", 50], [12, "A", 50],
      [14, "A", 45], [14, "A", 45], [14, "A", 45],
      [8,  "B", 60], [8,  "B", 60], [8,  "B", 60],
      [10, "B", 55], [10, "B", 55], [10, "B", 55],
      [12, "B", 55], [12, "B", 55], [12, "B", 55],
      [14, "B", 50], [14, "B", 50], [14, "B", 50],
      [16, "B", 50], [16, "B", 50], [16, "B", 50],
      [20, "B", 60], [20, "B", 60], [20, "B", 60],
    ];
    return cfg.map(function (c, i) {
      return { level: i + 1, nodeCount: c[0], type: c[1], timeLimit: c[2] };
    });
  }());

  const LETTERS = ["A","B","C","D","E","F","G","H","I","J"];
  const NODE_RADIUS = 24;
  const MIN_SPACING = 65;

  function buildSequence(nodeCount, type) {
    if (type === "A") {
      return Array.from({ length: nodeCount }, function (_, i) {
        return { label: String(i + 1), kind: "number" };
      });
    }
    // Type B: 1,A,2,B,3,C...
    var seq = [];
    var numCount = Math.ceil(nodeCount / 2);
    var letCount = Math.floor(nodeCount / 2);
    for (var i = 0; i < numCount; i++) {
      seq.push({ label: String(i + 1), kind: "number" });
      if (i < letCount) {
        seq.push({ label: LETTERS[i], kind: "letter" });
      }
    }
    return seq.slice(0, nodeCount);
  }

  function randomPositions(count, canvasW, canvasH) {
    var positions = [];
    var maxAttempts = 2000;
    var pad = NODE_RADIUS + 8;

    for (var i = 0; i < count; i++) {
      var placed = false;
      for (var attempt = 0; attempt < maxAttempts; attempt++) {
        var x = pad + Math.random() * (canvasW - pad * 2);
        var y = pad + Math.random() * (canvasH - pad * 2);
        var ok = true;
        for (var j = 0; j < positions.length; j++) {
          var dx = positions[j].x - x;
          var dy = positions[j].y - y;
          if (Math.sqrt(dx * dx + dy * dy) < MIN_SPACING) {
            ok = false;
            break;
          }
        }
        if (ok) {
          positions.push({ x: x, y: y });
          placed = true;
          break;
        }
      }
      if (!placed) {
        // fallback: place without spacing guarantee
        positions.push({
          x: pad + Math.random() * (canvasW - pad * 2),
          y: pad + Math.random() * (canvasH - pad * 2),
        });
      }
    }
    return positions;
  }

  var engine;
  var currentLevel = 1;
  var canvas, ctx;
  var nodes = [];       // {x,y,label,kind,connected}
  var sequence = [];    // ordered sequence of labels
  var currentTargetIdx = 0;
  var errorCount = 0;
  var correctCount = 0;
  var totalNodes = 0;
  var levelActive = false;
  var completionLines = []; // {x1,y1,x2,y2}
  var flashNode = null;     // {idx, color, until}

  function init() {
    engine = new BrainForge.GameEngine({
      gameId: "trail-making",
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: function (levelNum) {
        currentLevel = levelNum;
        startLevel(levelNum);
      },
    });
  }

  function getGameArea() {
    return document.getElementById("game-area");
  }

  function getCanvasSize() {
    var area = getGameArea();
    var w = Math.min(area.clientWidth || 500, 500);
    var h = Math.min(Math.max(w * 0.75, 320), 420);
    return { w: Math.floor(w), h: Math.floor(h) };
  }

  function setupCanvas() {
    var area = getGameArea();
    area.innerHTML = "";

    // Instructions bar
    var infoBar = document.createElement("div");
    infoBar.id = "tm-info";
    infoBar.style.cssText =
      "text-align:center;margin-bottom:8px;font-size:0.85rem;color:var(--text-secondary);min-height:24px;";
    area.appendChild(infoBar);

    // Error indicator
    var errBar = document.createElement("div");
    errBar.id = "tm-errors";
    errBar.style.cssText =
      "text-align:center;margin-bottom:6px;font-size:0.8rem;color:var(--error);min-height:20px;";
    area.appendChild(errBar);

    canvas = document.createElement("canvas");
    var size = getCanvasSize();
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.cssText =
      "display:block;margin:0 auto;border-radius:12px;cursor:crosshair;" +
      "background:#131e35;touch-action:none;";
    area.appendChild(canvas);
    ctx = canvas.getContext("2d");

    // Mobile tap hint
    var tapHint = document.createElement("div");
    tapHint.style.cssText =
      "text-align:center;margin-top:6px;font-size:0.75rem;color:var(--text-secondary);";
    tapHint.textContent = "Click or tap each circle in order";
    area.appendChild(tapHint);

    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchend", function (e) {
      e.preventDefault();
      var touch = e.changedTouches[0];
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var x = (touch.clientX - rect.left) * scaleX;
      var y = (touch.clientY - rect.top) * scaleY;
      handleCanvasHit(x, y);
    }, { passive: false });
  }

  function onCanvasClick(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    handleCanvasHit(x, y);
  }

  function handleCanvasHit(x, y) {
    if (!levelActive) return;
    // Find which node was clicked
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var dx = n.x - x;
      var dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS + 4) {
        processNodeClick(i);
        return;
      }
    }
  }

  function processNodeClick(idx) {
    var target = sequence[currentTargetIdx];
    if (!target) return;
    var node = nodes[idx];

    if (node.label === target.label) {
      // Correct
      BrainForge.Audio.correct();
      node.connected = true;
      correctCount++;

      if (currentTargetIdx > 0) {
        var prev = nodes[getNodeIdxByLabel(sequence[currentTargetIdx - 1].label)];
        completionLines.push({ x1: prev.x, y1: prev.y, x2: node.x, y2: node.y });
      }

      currentTargetIdx++;
      setFlash(idx, "correct");
      updateInfoBar();
      render();

      if (currentTargetIdx >= sequence.length) {
        endLevel(true);
      }
    } else {
      // Wrong click
      BrainForge.Audio.wrong();
      errorCount++;
      setFlash(idx, "error");
      updateErrorBar();
      render();
    }
  }

  function getNodeIdxByLabel(label) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].label === label) return i;
    }
    return -1;
  }

  function setFlash(idx, type) {
    flashNode = { idx: idx, type: type, until: Date.now() + 350 };
    setTimeout(function () {
      flashNode = null;
      render();
    }, 380);
  }

  function updateInfoBar() {
    var bar = document.getElementById("tm-info");
    if (!bar) return;
    var target = sequence[currentTargetIdx];
    if (target) {
      bar.textContent = "Next: " + target.label;
    } else {
      bar.textContent = "All nodes connected!";
    }
  }

  function updateErrorBar() {
    var bar = document.getElementById("tm-errors");
    if (!bar) return;
    if (errorCount > 0) {
      bar.textContent = "Errors: " + errorCount;
    }
  }

  function render() {
    if (!ctx) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw completed lines
    ctx.save();
    ctx.strokeStyle = "rgba(79,107,245,0.7)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (var li = 0; li < completionLines.length; li++) {
      var ln = completionLines[li];
      ctx.beginPath();
      ctx.moveTo(ln.x1, ln.y1);
      ctx.lineTo(ln.x2, ln.y2);
      ctx.stroke();
    }
    ctx.restore();

    // Draw nodes
    for (var i = 0; i < nodes.length; i++) {
      drawNode(i);
    }
  }

  function drawNode(idx) {
    var node = nodes[idx];
    var isConnected = node.connected;
    var isTarget = (idx === getNodeIdxByLabel(sequence[currentTargetIdx] && sequence[currentTargetIdx].label));
    var isFlash = (flashNode && flashNode.idx === idx);

    var x = node.x;
    var y = node.y;
    var r = NODE_RADIUS;

    ctx.save();

    // Glow for current target
    if (isTarget && !isConnected) {
      ctx.shadowColor = "#4F6BF5";
      ctx.shadowBlur = 18;
    }

    // Circle fill
    var fillColor;
    if (isFlash && flashNode.type === "error") {
      fillColor = "rgba(239,68,68,0.85)";
    } else if (isFlash && flashNode.type === "correct") {
      fillColor = "rgba(34,197,94,0.9)";
    } else if (isConnected) {
      fillColor = "rgba(79,107,245,0.65)";
    } else if (isTarget) {
      fillColor = "#1E3A6E";
    } else {
      fillColor = "#1E293B";
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Border
    var strokeColor;
    if (isFlash && flashNode.type === "error") {
      strokeColor = "#EF4444";
    } else if (isConnected) {
      strokeColor = "#4F6BF5";
    } else if (isTarget) {
      strokeColor = "#14B8A6";
    } else {
      strokeColor = "#334155";
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isTarget ? 2.5 : 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = isConnected ? "#fff" : (isTarget ? "#F1F5F9" : "#94A3B8");
    ctx.font = "bold " + (r * 0.75) + "px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, x, y);

    ctx.restore();
  }

  function startLevel(levelNum) {
    var cfg = LEVELS[levelNum - 1];
    currentTargetIdx = 0;
    errorCount = 0;
    correctCount = 0;
    completionLines = [];
    flashNode = null;
    levelActive = false;
    nodes = [];
    sequence = [];
    totalNodes = cfg.nodeCount;

    setupCanvas();

    var size = getCanvasSize();
    sequence = buildSequence(cfg.nodeCount, cfg.type);
    var positions = randomPositions(cfg.nodeCount, size.w, size.h);

    // Assign positions to nodes (shuffle positions so labels aren't in order visually)
    for (var i = 0; i < sequence.length; i++) {
      nodes.push({
        x: positions[i].x,
        y: positions[i].y,
        label: sequence[i].label,
        kind: sequence[i].kind,
        connected: false,
      });
    }

    // Shuffle node positions on canvas (so order isn't obvious)
    shuffleNodePositions();

    updateInfoBar();
    render();

    // Brief countdown before start
    var overlay = document.getElementById("game-overlay");
    overlay.innerHTML =
      '<div style="text-align:center;padding:24px;">' +
      '<div style="font-size:1rem;color:var(--text-secondary);margin-bottom:8px;">Level ' + levelNum + ' &mdash; Type ' + cfg.type + '</div>' +
      '<div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">' +
      cfg.nodeCount + " nodes &bull; " + cfg.timeLimit + "s" +
      "</div>" +
      '<button class="btn btn--primary" id="tm-start-btn">Start</button>' +
      "</div>";
    overlay.style.display = "flex";

    document.getElementById("tm-start-btn").addEventListener("click", function () {
      overlay.style.display = "none";
      overlay.innerHTML = "";
      levelActive = true;
      engine.startTimer(cfg.timeLimit, function () {
        if (levelActive) endLevel(false);
      });
      updateInfoBar();
    });
  }

  function shuffleNodePositions() {
    // Keep label-position mapping intact but shuffle x,y coords
    var coords = nodes.map(function (n) { return { x: n.x, y: n.y }; });
    for (var i = coords.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = coords[i];
      coords[i] = coords[j];
      coords[j] = tmp;
    }
    for (var k = 0; k < nodes.length; k++) {
      nodes[k].x = coords[k].x;
      nodes[k].y = coords[k].y;
    }
  }

  function endLevel(completed) {
    levelActive = false;
    engine.stopTimer();

    var pct = Math.round((correctCount / totalNodes) * 100);
    BrainForge.Audio.levelUp();

    var overlay = document.getElementById("game-overlay");
    var resultClass = pct >= 80 ? "color:var(--success)" : "color:var(--error)";
    var msg = completed ? "Trail Complete!" : "Time's Up!";

    overlay.innerHTML =
      '<div style="text-align:center;padding:24px;">' +
      '<div style="font-size:1.3rem;font-weight:700;margin-bottom:12px;">' + msg + "</div>" +
      '<div style="font-size:2rem;font-weight:800;' + resultClass + ";margin-bottom:8px;\">" +
      pct + "%" +
      "</div>" +
      '<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">' +
      "Connected: " + correctCount + " / " + totalNodes +
      "</div>" +
      '<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">' +
      "Errors: " + errorCount +
      "</div>" +
      '<button class="btn btn--primary" id="tm-next-btn">Continue</button>' +
      "</div>";
    overlay.style.display = "flex";

    engine.completeLevel(pct);

    document.getElementById("tm-next-btn").addEventListener("click", function () {
      overlay.style.display = "none";
      overlay.innerHTML = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
}());
