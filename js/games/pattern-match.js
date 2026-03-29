(function() {
    'use strict';

    var engine = null;
    var currentLevel = 1;
    var currentRound = 0;
    var totalRounds = 5;
    var correctCount = 0;
    var patterns = [];
    var correctAnswer = null;
    var choices = [];
    var roundActive = false;

    // Shape drawing constants
    var COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    var COLOR_NAMES = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'darkorange', 'darkblue'];
    var SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'pentagon', 'hexagon', 'cross'];
    var FILLS = ['solid', 'empty', 'striped', 'dotted'];

    // Level configuration
    function getLevelConfig(level) {
        if (level <= 3) return { type: 'color-cycle', items: 3, choices: 3, time: 0 };
        if (level <= 6) return { type: 'shape-rotation', items: 3, choices: 4, time: 0 };
        if (level <= 9) return { type: 'size-color', items: 4, choices: 4, time: 30 };
        if (level <= 12) return { type: 'number-sequence', items: 4, choices: 4, time: 25 };
        if (level <= 15) return { type: 'shape-fill-border', items: 4, choices: 4, time: 25 };
        if (level <= 18) return { type: 'grid-transform', items: 4, choices: 4, time: 20 };
        if (level <= 21) return { type: 'simple-matrix', items: 0, choices: 6, time: 20 };
        if (level <= 24) return { type: 'hard-matrix', items: 0, choices: 6, time: 18 };
        if (level <= 27) return { type: 'complex-matrix', items: 0, choices: 6, time: 15 };
        return { type: 'expert-matrix', items: 0, choices: 8, time: 12 };
    }

    // Seeded random for reproducibility within a round
    var seed = 1;
    function seededRandom() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(seededRandom() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function pick(arr) {
        return arr[Math.floor(seededRandom() * arr.length)];
    }

    // ========== SHAPE DRAWING ==========

    function drawShape(ctx, shape, x, y, size, color, fill, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation || 0) * Math.PI / 180);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, size / 15);

        var path;
        switch (shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.beginPath();
                var hs = size / 2;
                ctx.rect(-hs, -hs, size, size);
                break;
            case 'triangle':
                ctx.beginPath();
                var r = size / 2;
                ctx.moveTo(0, -r);
                ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
                ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
                ctx.closePath();
                break;
            case 'star':
                ctx.beginPath();
                drawStar(ctx, 0, 0, 5, size / 2, size / 4);
                break;
            case 'diamond':
                ctx.beginPath();
                var d = size / 2;
                ctx.moveTo(0, -d);
                ctx.lineTo(d * 0.6, 0);
                ctx.lineTo(0, d);
                ctx.lineTo(-d * 0.6, 0);
                ctx.closePath();
                break;
            case 'pentagon':
                ctx.beginPath();
                drawPolygon(ctx, 0, 0, size / 2, 5);
                break;
            case 'hexagon':
                ctx.beginPath();
                drawPolygon(ctx, 0, 0, size / 2, 6);
                break;
            case 'cross':
                ctx.beginPath();
                var w = size / 4, h = size / 2;
                ctx.rect(-w, -h, w * 2, h * 2);
                ctx.rect(-h, -w, h * 2, w * 2);
                break;
        }

        applyFill(ctx, fill, color, size);
        ctx.restore();
    }

    function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
        var rot = -Math.PI / 2;
        var step = Math.PI / spikes;
        ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        for (var i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.closePath();
    }

    function drawPolygon(ctx, cx, cy, r, sides) {
        var angle = -Math.PI / 2;
        var step = (Math.PI * 2) / sides;
        ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        for (var i = 1; i <= sides; i++) {
            ctx.lineTo(cx + r * Math.cos(angle + step * i), cy + r * Math.sin(angle + step * i));
        }
        ctx.closePath();
    }

    function applyFill(ctx, fill, color, size) {
        switch (fill) {
            case 'solid':
                ctx.fill();
                ctx.stroke();
                break;
            case 'empty':
                ctx.stroke();
                break;
            case 'striped':
                ctx.stroke();
                ctx.save();
                ctx.clip();
                ctx.lineWidth = 1.5;
                for (var i = -size; i < size; i += 5) {
                    ctx.beginPath();
                    ctx.moveTo(i, -size);
                    ctx.lineTo(i, size);
                    ctx.stroke();
                }
                ctx.restore();
                break;
            case 'dotted':
                ctx.stroke();
                ctx.save();
                ctx.clip();
                for (var dx = -size; dx < size; dx += 6) {
                    for (var dy = -size; dy < size; dy += 6) {
                        ctx.beginPath();
                        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
                break;
            default:
                ctx.fill();
                ctx.stroke();
        }
    }

    function drawNumber(ctx, num, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.font = 'bold ' + Math.floor(size * 0.6) + 'px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString(), x, y);
    }

    function drawMiniGrid(ctx, grid, x, y, cellSize) {
        var rows = grid.length;
        var cols = grid[0].length;
        var totalW = cols * cellSize;
        var totalH = rows * cellSize;
        var startX = x - totalW / 2;
        var startY = y - totalH / 2;

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cx = startX + c * cellSize + cellSize / 2;
                var cy = startY + r * cellSize + cellSize / 2;
                ctx.strokeRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
                if (grid[r][c]) {
                    var cell = grid[r][c];
                    if (cell.shape) {
                        drawShape(ctx, cell.shape, cx, cy, cellSize * 0.6, cell.color || '#333', cell.fill || 'solid', cell.rotation || 0);
                    } else if (cell.color) {
                        ctx.fillStyle = cell.color;
                        ctx.fillRect(startX + c * cellSize + 1, startY + r * cellSize + 1, cellSize - 2, cellSize - 2);
                    }
                }
            }
        }
    }

    function drawQuestionMark(ctx, x, y, size) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold ' + Math.floor(size * 0.7) + 'px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
    }

    // ========== PATTERN GENERATORS ==========

    function generateColorCycle(level, round) {
        seed = level * 1000 + round * 100 + 42;
        var numColors = 3;
        var pool = shuffle(COLORS.slice(0, 5));
        var cycle = pool.slice(0, numColors);
        var sequence = [];
        for (var i = 0; i < 3; i++) {
            sequence.push({ shape: 'circle', color: cycle[i % numColors], size: 40, fill: 'solid' });
        }
        var answer = { shape: 'circle', color: cycle[3 % numColors], size: 40, fill: 'solid' };

        var distractors = [];
        for (var j = 0; j < pool.length; j++) {
            if (pool[j] !== answer.color) {
                distractors.push({ shape: 'circle', color: pool[j], size: 40, fill: 'solid' });
            }
        }
        while (distractors.length < 3) {
            distractors.push({ shape: 'circle', color: COLORS[distractors.length + 3], size: 40, fill: 'solid' });
        }
        return { sequence: sequence, answer: answer, distractors: distractors.slice(0, 2) };
    }

    function generateShapeRotation(level, round) {
        seed = level * 1000 + round * 100 + 77;
        var shapeType = pick(['triangle', 'square', 'star', 'diamond']);
        var color = pick(COLORS.slice(0, 6));
        var rotStep = pick([90, 60, 45, 120]);
        var startRot = Math.floor(seededRandom() * 4) * 30;
        var sequence = [];
        for (var i = 0; i < 3; i++) {
            sequence.push({ shape: shapeType, color: color, size: 40, fill: 'solid', rotation: startRot + rotStep * i });
        }
        var answer = { shape: shapeType, color: color, size: 40, fill: 'solid', rotation: startRot + rotStep * 3 };

        var distractors = [];
        var wrongRots = [rotStep * 2, -rotStep, rotStep * 0.5, rotStep * 4];
        for (var j = 0; j < 3; j++) {
            distractors.push({ shape: shapeType, color: color, size: 40, fill: 'solid', rotation: startRot + wrongRots[j] });
        }
        return { sequence: sequence, answer: answer, distractors: distractors };
    }

    function generateSizeColor(level, round) {
        seed = level * 1000 + round * 100 + 99;
        var pool = shuffle(COLORS.slice(0, 5));
        var numColors = 3;
        var cycle = pool.slice(0, numColors);
        var baseSize = 20;
        var sizeStep = 10;
        var sequence = [];
        for (var i = 0; i < 4; i++) {
            sequence.push({ shape: 'circle', color: cycle[i % numColors], size: baseSize + sizeStep * i, fill: 'solid' });
        }
        var answer = { shape: 'circle', color: cycle[4 % numColors], size: baseSize + sizeStep * 4, fill: 'solid' };

        var distractors = [];
        distractors.push({ shape: 'circle', color: cycle[4 % numColors], size: baseSize + sizeStep * 3, fill: 'solid' });
        distractors.push({ shape: 'circle', color: cycle[(4 + 1) % numColors], size: baseSize + sizeStep * 4, fill: 'solid' });
        distractors.push({ shape: 'circle', color: cycle[(4 + 2) % numColors], size: baseSize + sizeStep * 2, fill: 'solid' });
        return { sequence: sequence, answer: answer, distractors: distractors };
    }

    function generateNumberSequence(level, round) {
        seed = level * 1000 + round * 100 + 55;
        var subtype = Math.floor(seededRandom() * 3);
        var sequence = [];
        var answerVal;

        if (subtype === 0) {
            // Arithmetic: +d
            var start = Math.floor(seededRandom() * 10) + 1;
            var d = Math.floor(seededRandom() * 5) + 2;
            for (var i = 0; i < 4; i++) sequence.push(start + d * i);
            answerVal = start + d * 4;
        } else if (subtype === 1) {
            // Geometric: *m
            var start2 = Math.floor(seededRandom() * 3) + 2;
            var m = Math.floor(seededRandom() * 2) + 2;
            for (var i2 = 0; i2 < 4; i2++) sequence.push(start2 * Math.pow(m, i2));
            answerVal = start2 * Math.pow(m, 4);
        } else {
            // Alternating add
            var s = Math.floor(seededRandom() * 5) + 1;
            var a = Math.floor(seededRandom() * 3) + 1;
            var b = Math.floor(seededRandom() * 4) + 2;
            for (var i3 = 0; i3 < 4; i3++) {
                sequence.push(s);
                s += (i3 % 2 === 0) ? a : b;
            }
            answerVal = s;
        }

        var items = [];
        var color = pick(COLORS.slice(0, 4));
        for (var k = 0; k < sequence.length; k++) {
            items.push({ number: sequence[k], color: color });
        }
        var answer = { number: answerVal, color: color };

        var distractors = [];
        var offsets = [1, -1, 2, -2, 3];
        for (var j = 0; j < 3; j++) {
            var dv = answerVal + offsets[j] * (Math.floor(seededRandom() * 3) + 1);
            if (dv === answerVal) dv = answerVal + offsets[j + 1] * 2;
            distractors.push({ number: dv, color: color });
        }
        return { sequence: items, answer: answer, distractors: distractors, isNumber: true };
    }

    function generateShapeFillBorder(level, round) {
        seed = level * 1000 + round * 100 + 33;
        var shapePool = shuffle(SHAPES.slice(0, 4));
        var fillPool = shuffle(FILLS.slice(0, 3));
        var colorPool = shuffle(COLORS.slice(0, 4));
        var sequence = [];
        for (var i = 0; i < 4; i++) {
            sequence.push({
                shape: shapePool[i % shapePool.length],
                fill: fillPool[i % fillPool.length],
                color: colorPool[i % colorPool.length],
                size: 40
            });
        }
        var answer = {
            shape: shapePool[4 % shapePool.length],
            fill: fillPool[4 % fillPool.length],
            color: colorPool[4 % colorPool.length],
            size: 40
        };

        var distractors = [];
        for (var j = 0; j < 3; j++) {
            distractors.push({
                shape: shapePool[(4 + j + 1) % shapePool.length],
                fill: fillPool[(4 + j + 2) % fillPool.length],
                color: colorPool[(4 + j) % colorPool.length],
                size: 40
            });
        }
        return { sequence: sequence, answer: answer, distractors: distractors };
    }

    function generateGridTransform(level, round) {
        seed = level * 1000 + round * 100 + 11;
        var gridColors = shuffle(COLORS.slice(0, 6));
        var sequence = [];

        // Generate initial 2x2 grid
        var grid0 = [
            [{ color: gridColors[0] }, { color: gridColors[1] }],
            [{ color: gridColors[2] }, { color: gridColors[3] }]
        ];
        sequence.push(grid0);

        // Apply rotation transformation for each step
        for (var step = 1; step < 4; step++) {
            var prev = sequence[step - 1];
            var next = [
                [{ color: prev[0][1].color }, { color: prev[1][1].color }],
                [{ color: prev[0][0].color }, { color: prev[1][0].color }]
            ];
            sequence.push(next);
        }

        var prev2 = sequence[3];
        var answer = [
            [{ color: prev2[0][1].color }, { color: prev2[1][1].color }],
            [{ color: prev2[0][0].color }, { color: prev2[1][0].color }]
        ];

        var distractors = [];
        // Wrong transforms
        distractors.push([
            [{ color: prev2[1][0].color }, { color: prev2[0][0].color }],
            [{ color: prev2[1][1].color }, { color: prev2[0][1].color }]
        ]);
        distractors.push([
            [{ color: prev2[1][1].color }, { color: prev2[1][0].color }],
            [{ color: prev2[0][1].color }, { color: prev2[0][0].color }]
        ]);
        distractors.push([
            [{ color: prev2[0][0].color }, { color: prev2[0][1].color }],
            [{ color: prev2[1][0].color }, { color: prev2[1][1].color }]
        ]);

        return { sequence: sequence, answer: answer, distractors: distractors, isGrid: true };
    }

    function generateMatrix(level, round) {
        seed = level * 1000 + round * 100 + 22;
        var config = getLevelConfig(level);
        var numChoices = config.choices;
        var difficulty = level <= 21 ? 1 : level <= 24 ? 2 : level <= 27 ? 3 : 4;

        var shapePool = shuffle(SHAPES.slice(0, 4 + difficulty));
        var colorPool = shuffle(COLORS.slice(0, 3 + difficulty));
        var sizePool = [25, 35, 45];
        var fillPool = shuffle(FILLS.slice(0, 2 + Math.min(difficulty, 2)));

        // Build 3x3 matrix with rules
        var matrix = [];
        // Rule 1: shape changes across columns
        // Rule 2: color changes across rows
        // Rule 3 (harder): size changes diagonally or fill changes

        for (var r = 0; r < 3; r++) {
            matrix[r] = [];
            for (var c = 0; c < 3; c++) {
                matrix[r][c] = {
                    shape: shapePool[c % shapePool.length],
                    color: colorPool[r % colorPool.length],
                    size: difficulty >= 2 ? sizePool[(r + c) % 3] : 35,
                    fill: difficulty >= 3 ? fillPool[(r + c) % fillPool.length] : 'solid',
                    rotation: difficulty >= 4 ? ((r * 3 + c) * 45) % 360 : 0
                };
            }
        }

        var answer = JSON.parse(JSON.stringify(matrix[2][2]));
        matrix[2][2] = null; // missing cell

        var distractors = [];
        for (var d = 0; d < numChoices - 1; d++) {
            var dist = JSON.parse(JSON.stringify(answer));
            // Alter one or more attributes
            var alterAttr = d % 4;
            if (alterAttr === 0) dist.shape = shapePool[(shapePool.indexOf(dist.shape) + 1 + d) % shapePool.length];
            else if (alterAttr === 1) dist.color = colorPool[(colorPool.indexOf(dist.color) + 1 + d) % colorPool.length];
            else if (alterAttr === 2) dist.size = sizePool[(sizePool.indexOf(dist.size) + 1) % 3];
            else {
                dist.fill = fillPool[(fillPool.indexOf(dist.fill) + 1) % fillPool.length];
                if (d > 3) dist.shape = shapePool[(shapePool.indexOf(dist.shape) + 2) % shapePool.length];
            }
            distractors.push(dist);
        }

        return { matrix: matrix, answer: answer, distractors: distractors, isMatrix: true };
    }

    // ========== ROUND MANAGEMENT ==========

    function generateRound(level, round) {
        var config = getLevelConfig(level);
        var type = config.type;

        switch (type) {
            case 'color-cycle': return generateColorCycle(level, round);
            case 'shape-rotation': return generateShapeRotation(level, round);
            case 'size-color': return generateSizeColor(level, round);
            case 'number-sequence': return generateNumberSequence(level, round);
            case 'shape-fill-border': return generateShapeFillBorder(level, round);
            case 'grid-transform': return generateGridTransform(level, round);
            case 'simple-matrix':
            case 'hard-matrix':
            case 'complex-matrix':
            case 'expert-matrix':
                return generateMatrix(level, round);
            default: return generateColorCycle(level, round);
        }
    }

    function renderSequenceCanvas(container, data) {
        var canvas = document.createElement('canvas');
        var isGrid = data.isGrid;
        var isNumber = data.isNumber;
        var isMatrix = data.isMatrix;

        if (isMatrix) {
            renderMatrixCanvas(container, data);
            return;
        }

        var seq = data.sequence;
        var itemWidth = isGrid ? 80 : 80;
        var spacing = 20;
        var totalWidth = seq.length * itemWidth + (seq.length - 1) * spacing + 60;
        // Add space for "?" element
        totalWidth += itemWidth + spacing;
        var height = isGrid ? 100 : 100;

        canvas.width = Math.min(totalWidth, 700);
        canvas.height = height;
        canvas.style.maxWidth = '100%';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var startX = (canvas.width - (seq.length * itemWidth + seq.length * spacing + itemWidth)) / 2 + itemWidth / 2;
        var cy = height / 2;

        for (var i = 0; i < seq.length; i++) {
            var cx = startX + i * (itemWidth + spacing);
            if (isGrid) {
                drawMiniGrid(ctx, seq[i], cx, cy, 30);
            } else if (isNumber) {
                // Draw rounded box behind number
                ctx.fillStyle = '#f0f0f0';
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 2;
                roundRect(ctx, cx - 30, cy - 30, 60, 60, 8);
                ctx.fill();
                ctx.stroke();
                drawNumber(ctx, seq[i].number, cx, cy, 60, seq[i].color);
            } else {
                drawShape(ctx, seq[i].shape, cx, cy, seq[i].size, seq[i].color, seq[i].fill || 'solid', seq[i].rotation || 0);
            }

            // Arrow between items
            if (i < seq.length - 1) {
                var ax = cx + itemWidth / 2 + 2;
                ctx.fillStyle = '#999';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('\u2192', ax + spacing / 2, cy);
            }
        }

        // Draw "?" at the end
        var qx = startX + seq.length * (itemWidth + spacing);
        ctx.fillStyle = '#f0f0f0';
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        roundRect(ctx, qx - 30, cy - 30, 60, 60, 8);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        drawQuestionMark(ctx, qx, cy, 60);

        container.appendChild(canvas);
    }

    function renderMatrixCanvas(container, data) {
        var matrix = data.matrix;
        var rows = matrix.length;
        var cols = matrix[0].length;
        var cellSize = 70;
        var gap = 4;
        var totalW = cols * (cellSize + gap) + gap;
        var totalH = rows * (cellSize + gap) + gap;

        var canvas = document.createElement('canvas');
        canvas.width = totalW;
        canvas.height = totalH;
        canvas.style.maxWidth = '100%';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';

        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, totalW, totalH);

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var x = gap + c * (cellSize + gap);
                var y = gap + r * (cellSize + gap);
                var cx = x + cellSize / 2;
                var cy = y + cellSize / 2;

                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                roundRect(ctx, x, y, cellSize, cellSize, 6);
                ctx.fill();
                ctx.stroke();

                if (matrix[r][c] === null) {
                    ctx.fillStyle = '#fef3f3';
                    roundRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 5);
                    ctx.fill();
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    roundRect(ctx, x, y, cellSize, cellSize, 6);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    drawQuestionMark(ctx, cx, cy, cellSize);
                } else {
                    var cell = matrix[r][c];
                    drawShape(ctx, cell.shape, cx, cy, cell.size, cell.color, cell.fill || 'solid', cell.rotation || 0);
                }
            }
        }

        container.appendChild(canvas);
    }

    function renderChoiceCanvas(item, size, isNumber, isGrid) {
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        var ctx = canvas.getContext('2d');
        var cx = size / 2;
        var cy = size / 2;

        if (isGrid) {
            drawMiniGrid(ctx, item, cx, cy, 22);
        } else if (isNumber) {
            drawNumber(ctx, item.number, cx, cy, size, item.color);
        } else {
            drawShape(ctx, item.shape, cx, cy, Math.min(item.size, size * 0.6), item.color, item.fill || 'solid', item.rotation || 0);
        }

        return canvas;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Compare two items for equality
    function itemsEqual(a, b) {
        if (!a || !b) return false;
        if (a.number !== undefined) return a.number === b.number;
        if (Array.isArray(a)) {
            // Grid comparison
            return JSON.stringify(a) === JSON.stringify(b);
        }
        return a.shape === b.shape && a.color === b.color &&
               (a.size || 35) === (b.size || 35) &&
               (a.fill || 'solid') === (b.fill || 'solid') &&
               (a.rotation || 0) === (b.rotation || 0);
    }

    // ========== GAME FLOW ==========

    function startRound() {
        if (currentRound >= totalRounds) {
            endLevel();
            return;
        }

        roundActive = true;
        var gameArea = document.getElementById('game-area');
        gameArea.innerHTML = '';

        var roundInfo = document.createElement('div');
        roundInfo.className = 'pattern-round-info';
        roundInfo.innerHTML = '<span>Round ' + (currentRound + 1) + ' of ' + totalRounds + '</span>' +
            '<span>Score: ' + correctCount + '/' + currentRound + '</span>';
        gameArea.appendChild(roundInfo);

        var data = generateRound(currentLevel, currentRound);

        // Sequence display
        var seqContainer = document.createElement('div');
        seqContainer.className = 'pattern-sequence';
        renderSequenceCanvas(seqContainer, data);
        gameArea.appendChild(seqContainer);

        // Instruction
        var instruction = document.createElement('p');
        instruction.className = 'pattern-instruction';
        instruction.textContent = data.isMatrix ? 'Select the missing piece:' : 'What comes next?';
        gameArea.appendChild(instruction);

        // Choices
        var config = getLevelConfig(currentLevel);
        var allChoices = [data.answer].concat(data.distractors);
        seed = currentLevel * 777 + currentRound * 333;
        allChoices = shuffle(allChoices);

        correctAnswer = data.answer;
        choices = allChoices;

        var choicesContainer = document.createElement('div');
        choicesContainer.className = 'pattern-choices';
        var choiceSize = data.isGrid ? 80 : (data.isMatrix ? 70 : 80);

        for (var i = 0; i < allChoices.length; i++) {
            (function(index) {
                var btn = document.createElement('button');
                btn.className = 'pattern-choice-btn';
                var c = renderChoiceCanvas(allChoices[index], choiceSize, data.isNumber, data.isGrid);
                btn.appendChild(c);
                btn.addEventListener('click', function() {
                    if (!roundActive) return;
                    handleChoice(index, allChoices, data, choicesContainer);
                });
                choicesContainer.appendChild(btn);
            })(i);
        }

        gameArea.appendChild(choicesContainer);

        // Start timer if applicable
        var config2 = getLevelConfig(currentLevel);
        if (config2.time > 0) {
            engine.startTimer(config2.time, function() {
                if (roundActive) {
                    roundActive = false;
                    BrainForge.Audio.wrong();
                    showRoundFeedback(false);
                }
            });
        }
    }

    function handleChoice(index, allChoices, data, container) {
        if (!roundActive) return;
        roundActive = false;
        engine.stopTimer();

        var selected = allChoices[index];
        var isCorrect = itemsEqual(selected, correctAnswer);

        // Visual feedback
        var buttons = container.querySelectorAll('.pattern-choice-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].style.pointerEvents = 'none';
            if (itemsEqual(allChoices[i], correctAnswer)) {
                buttons[i].classList.add('correct');
            }
            if (i === index && !isCorrect) {
                buttons[i].classList.add('wrong');
            }
        }

        if (isCorrect) {
            correctCount++;
            BrainForge.Audio.correct();
        } else {
            BrainForge.Audio.wrong();
        }

        showRoundFeedback(isCorrect);
    }

    function showRoundFeedback(isCorrect) {
        var pct = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0;
        engine.updateScore(pct);

        setTimeout(function() {
            currentRound++;
            if (currentRound >= totalRounds) {
                endLevel();
            } else {
                startRound();
            }
        }, 1200);
    }

    function endLevel() {
        var scorePct = Math.round((correctCount / totalRounds) * 100);
        engine.completeLevel(scorePct);
    }

    function startGame(level) {
        currentLevel = level;
        currentRound = 0;
        correctCount = 0;
        engine.startLevel(level);
        startRound();
    }

    // ========== INIT ==========

    function init() {
        engine = new BrainForge.GameEngine({
            gameId: 'pattern-match',
            totalLevels: 30,
            passThreshold: 80,
            onGameStart: function(level) {
                startGame(level);
            }
        });

        // Inject game-specific styles
        var style = document.createElement('style');
        style.textContent = '' +
            '.pattern-round-info { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; margin-bottom: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.95rem; color: #b0b0b0; }' +
            '.pattern-sequence { display: flex; justify-content: center; align-items: center; padding: 1.5rem 0.5rem; margin-bottom: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; overflow-x: auto; }' +
            '.pattern-instruction { text-align: center; font-size: 1.1rem; color: #ccc; margin: 1rem 0; }' +
            '.pattern-choices { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; padding: 1rem 0; }' +
            '.pattern-choice-btn { background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 10px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }' +
            '.pattern-choice-btn:hover { border-color: #6c5ce7; background: rgba(108,92,231,0.15); transform: translateY(-2px); }' +
            '.pattern-choice-btn.correct { border-color: #2ecc71; background: rgba(46,204,113,0.2); box-shadow: 0 0 12px rgba(46,204,113,0.4); }' +
            '.pattern-choice-btn.wrong { border-color: #e74c3c; background: rgba(231,76,60,0.2); box-shadow: 0 0 12px rgba(231,76,60,0.4); }' +
            '.pattern-choice-btn canvas { display: block; }' +
            '@media (max-width: 600px) { .pattern-choices { gap: 8px; } .pattern-choice-btn { padding: 6px; } }';
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
