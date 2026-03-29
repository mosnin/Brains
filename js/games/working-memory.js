(function() {
    'use strict';

    var LEVELS = [
        { grid: 3, cells: 3, ms: 800, mode: 'spatial', colors: 0, reverse: false },
        { grid: 3, cells: 3, ms: 800, mode: 'spatial', colors: 0, reverse: false },
        { grid: 3, cells: 4, ms: 700, mode: 'spatial', colors: 0, reverse: false },
        { grid: 3, cells: 4, ms: 700, mode: 'spatial', colors: 0, reverse: false },
        { grid: 4, cells: 4, ms: 700, mode: 'sequential', colors: 0, reverse: false },
        { grid: 4, cells: 4, ms: 700, mode: 'sequential', colors: 0, reverse: false },
        { grid: 4, cells: 5, ms: 600, mode: 'sequential', colors: 0, reverse: false },
        { grid: 4, cells: 5, ms: 600, mode: 'sequential', colors: 0, reverse: false },
        { grid: 4, cells: 6, ms: 600, mode: 'sequential', colors: 0, reverse: false },
        { grid: 4, cells: 6, ms: 600, mode: 'sequential', colors: 0, reverse: false },
        { grid: 5, cells: 6, ms: 500, mode: 'sequential', colors: 0, reverse: false },
        { grid: 5, cells: 6, ms: 500, mode: 'sequential', colors: 0, reverse: false },
        { grid: 5, cells: 7, ms: 500, mode: 'sequential', colors: 0, reverse: false },
        { grid: 5, cells: 7, ms: 500, mode: 'sequential', colors: 0, reverse: false },
        { grid: 5, cells: 8, ms: 450, mode: 'sequential', colors: 2, reverse: false },
        { grid: 5, cells: 8, ms: 450, mode: 'sequential', colors: 2, reverse: false },
        { grid: 5, cells: 9, ms: 450, mode: 'sequential', colors: 2, reverse: false },
        { grid: 5, cells: 9, ms: 450, mode: 'sequential', colors: 2, reverse: false },
        { grid: 6, cells: 9, ms: 400, mode: 'sequential', colors: 3, reverse: false },
        { grid: 6, cells: 9, ms: 400, mode: 'sequential', colors: 3, reverse: false },
        { grid: 6, cells: 10, ms: 400, mode: 'sequential', colors: 3, reverse: false },
        { grid: 6, cells: 10, ms: 400, mode: 'sequential', colors: 3, reverse: false },
        { grid: 6, cells: 11, ms: 350, mode: 'sequential', colors: 0, reverse: true },
        { grid: 6, cells: 11, ms: 350, mode: 'sequential', colors: 0, reverse: true },
        { grid: 7, cells: 12, ms: 350, mode: 'sequential', colors: 2, reverse: true },
        { grid: 7, cells: 12, ms: 350, mode: 'sequential', colors: 2, reverse: true },
        { grid: 7, cells: 13, ms: 300, mode: 'sequential', colors: 4, reverse: true },
        { grid: 7, cells: 13, ms: 300, mode: 'sequential', colors: 4, reverse: true },
        { grid: 8, cells: 14, ms: 250, mode: 'sequential', colors: 4, reverse: true },
        { grid: 8, cells: 14, ms: 250, mode: 'sequential', colors: 4, reverse: true }
    ];

    var engine;
    var currentLevel = 0;
    var levelConfig = null;
    var pattern = [];         // array of {index, color}
    var playerSelections = [];
    var selectedColor = 1;
    var phase = 'idle';       // idle, show, recall, feedback
    var showTimeouts = [];
    var gameArea;
    var gridEl;
    var statusEl;
    var colorPickerEl;
    var instructionEl;

    function init() {
        gameArea = document.getElementById('game-area');
        if (!gameArea) return;

        gameArea.innerHTML =
            '<div id="wm-instruction" class="game-instruction">Watch the pattern, then reproduce it!</div>' +
            '<div id="wm-color-picker" class="wm-color-picker" style="display:none;"></div>' +
            '<div id="wm-grid-wrap"></div>' +
            '<div id="wm-status" class="game-status"></div>';

        instructionEl = document.getElementById('wm-instruction');
        colorPickerEl = document.getElementById('wm-color-picker');
        statusEl = document.getElementById('wm-status');

        engine = new BrainForge.GameEngine({
            gameId: 'working-memory',
            totalLevels: 30,
            passThreshold: 80,
            onGameStart: startLevel
        });
    }

    function startLevel(level) {
        currentLevel = level;
        levelConfig = LEVELS[level - 1];
        pattern = [];
        playerSelections = [];
        selectedColor = 1;
        phase = 'idle';
        clearShowTimeouts();

        engine.startLevel(level);
        buildGrid();
        buildColorPicker();
        updateInstruction('Watch carefully...');
        statusEl.textContent = '';

        setTimeout(function() {
            showPattern();
        }, 600);
    }

    function buildGrid() {
        var wrap = document.getElementById('wm-grid-wrap');
        var size = levelConfig.grid;
        wrap.innerHTML = '';
        gridEl = document.createElement('div');
        gridEl.className = 'game-grid game-grid--' + size + 'x' + size;
        var total = size * size;
        for (var i = 0; i < total; i++) {
            var cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', onCellClick);
            gridEl.appendChild(cell);
        }
        wrap.appendChild(gridEl);
    }

    function buildColorPicker() {
        colorPickerEl.innerHTML = '';
        if (levelConfig.colors < 2) {
            colorPickerEl.style.display = 'none';
            return;
        }
        colorPickerEl.style.display = 'flex';
        var label = document.createElement('span');
        label.className = 'wm-color-picker__label';
        label.textContent = 'Color:';
        colorPickerEl.appendChild(label);

        for (var c = 1; c <= levelConfig.colors; c++) {
            var btn = document.createElement('button');
            btn.className = 'wm-color-btn game-cell--color-' + c;
            btn.setAttribute('data-color', c);
            btn.setAttribute('type', 'button');
            btn.setAttribute('aria-label', 'Select color ' + c);
            if (c === selectedColor) btn.classList.add('wm-color-btn--active');
            btn.addEventListener('click', onColorPick);
            colorPickerEl.appendChild(btn);
        }
    }

    function onColorPick(e) {
        var btn = e.currentTarget;
        selectedColor = parseInt(btn.getAttribute('data-color'), 10);
        var btns = colorPickerEl.querySelectorAll('.wm-color-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('wm-color-btn--active', parseInt(btns[i].getAttribute('data-color'), 10) === selectedColor);
        }
        BrainForge.Audio.click();
    }

    function generatePattern() {
        var size = levelConfig.grid;
        var total = size * size;
        var numCells = levelConfig.cells;
        var numColors = levelConfig.colors;
        var indices = [];
        while (indices.length < numCells) {
            var r = Math.floor(Math.random() * total);
            if (indices.indexOf(r) === -1) indices.push(r);
        }
        pattern = [];
        for (var i = 0; i < indices.length; i++) {
            var color = numColors >= 2 ? (Math.floor(Math.random() * numColors) + 1) : 1;
            pattern.push({ index: indices[i], color: color });
        }
    }

    function showPattern() {
        generatePattern();
        phase = 'show';
        clearShowTimeouts();

        var cells = gridEl.querySelectorAll('.game-cell');

        if (levelConfig.mode === 'spatial') {
            // flash all at once
            for (var i = 0; i < pattern.length; i++) {
                var c = cells[pattern[i].index];
                c.classList.add('game-cell--active');
                if (levelConfig.colors >= 2) {
                    c.classList.add('game-cell--color-' + pattern[i].color);
                }
            }
            var totalTime = levelConfig.ms * levelConfig.cells;
            var t = setTimeout(function() {
                clearHighlights(cells);
                beginRecall();
            }, totalTime);
            showTimeouts.push(t);
        } else {
            // sequential
            for (var j = 0; j < pattern.length; j++) {
                (function(idx) {
                    var tOn = setTimeout(function() {
                        clearHighlights(cells);
                        var cell = cells[pattern[idx].index];
                        cell.classList.add('game-cell--active');
                        if (levelConfig.colors >= 2) {
                            cell.classList.add('game-cell--color-' + pattern[idx].color);
                        }
                    }, idx * levelConfig.ms);
                    showTimeouts.push(tOn);
                })(j);
            }
            var endT = setTimeout(function() {
                clearHighlights(cells);
                beginRecall();
            }, pattern.length * levelConfig.ms);
            showTimeouts.push(endT);
        }
    }

    function clearHighlights(cells) {
        for (var i = 0; i < cells.length; i++) {
            cells[i].classList.remove('game-cell--active', 'game-cell--color-1', 'game-cell--color-2', 'game-cell--color-3', 'game-cell--color-4');
        }
    }

    function clearShowTimeouts() {
        for (var i = 0; i < showTimeouts.length; i++) clearTimeout(showTimeouts[i]);
        showTimeouts = [];
    }

    function beginRecall() {
        phase = 'recall';
        playerSelections = [];
        var modeText = levelConfig.reverse ? 'Tap cells in REVERSE order!' : 'Tap the cells!';
        if (levelConfig.colors >= 2) modeText += ' (Pick color first)';
        updateInstruction(modeText);
        statusEl.textContent = '0 / ' + levelConfig.cells + ' selected';
    }

    function onCellClick(e) {
        if (phase !== 'recall') return;
        var cell = e.currentTarget;
        var idx = parseInt(cell.getAttribute('data-index'), 10);

        // prevent double-selecting same cell
        for (var i = 0; i < playerSelections.length; i++) {
            if (playerSelections[i].index === idx) return;
        }

        var color = levelConfig.colors >= 2 ? selectedColor : 1;
        playerSelections.push({ index: idx, color: color });

        cell.classList.add('game-cell--selected');
        if (levelConfig.colors >= 2) {
            cell.classList.add('game-cell--color-' + color);
        }

        BrainForge.Audio.click();
        statusEl.textContent = playerSelections.length + ' / ' + levelConfig.cells + ' selected';

        if (playerSelections.length >= levelConfig.cells) {
            phase = 'feedback';
            setTimeout(evaluateResult, 300);
        }
    }

    function evaluateResult() {
        var cells = gridEl.querySelectorAll('.game-cell');
        var correct = 0;
        var total = pattern.length;

        if (levelConfig.mode === 'spatial') {
            // order does not matter
            var patternMap = {};
            for (var p = 0; p < pattern.length; p++) {
                patternMap[pattern[p].index] = pattern[p].color;
            }
            for (var s = 0; s < playerSelections.length; s++) {
                var sel = playerSelections[s];
                if (patternMap.hasOwnProperty(sel.index)) {
                    if (levelConfig.colors >= 2) {
                        if (patternMap[sel.index] === sel.color) correct++;
                    } else {
                        correct++;
                    }
                }
            }
        } else {
            // sequential - order matters; check against pattern (or reversed)
            var targetOrder = pattern.slice();
            if (levelConfig.reverse) targetOrder = targetOrder.slice().reverse();

            for (var q = 0; q < targetOrder.length; q++) {
                if (q < playerSelections.length) {
                    var t = targetOrder[q];
                    var ps = playerSelections[q];
                    if (ps.index === t.index) {
                        if (levelConfig.colors >= 2) {
                            if (ps.color === t.color) correct++;
                        } else {
                            correct++;
                        }
                    }
                }
            }
        }

        // show feedback on grid
        var patternIndices = {};
        for (var m = 0; m < pattern.length; m++) {
            patternIndices[pattern[m].index] = pattern[m].color;
        }

        for (var ci = 0; ci < cells.length; ci++) {
            var cellIdx = parseInt(cells[ci].getAttribute('data-index'), 10);
            cells[ci].classList.remove('game-cell--selected');
            if (patternIndices.hasOwnProperty(cellIdx)) {
                cells[ci].classList.add('game-cell--active');
                if (levelConfig.colors >= 2) {
                    // clear old color classes, show correct color
                    cells[ci].classList.remove('game-cell--color-1', 'game-cell--color-2', 'game-cell--color-3', 'game-cell--color-4');
                    cells[ci].classList.add('game-cell--color-' + patternIndices[cellIdx]);
                }
            }
        }

        // mark player cells correct/wrong
        var targetOrder2 = levelConfig.mode === 'spatial' ? null : (levelConfig.reverse ? pattern.slice().reverse() : pattern.slice());
        for (var si = 0; si < playerSelections.length; si++) {
            var pSel = playerSelections[si];
            var pCell = cells[pSel.index];
            var isCorrect = false;

            if (levelConfig.mode === 'spatial') {
                if (patternIndices.hasOwnProperty(pSel.index)) {
                    isCorrect = levelConfig.colors >= 2 ? (patternIndices[pSel.index] === pSel.color) : true;
                }
            } else {
                if (targetOrder2 && si < targetOrder2.length) {
                    var tgt = targetOrder2[si];
                    isCorrect = pSel.index === tgt.index && (levelConfig.colors < 2 || pSel.color === tgt.color);
                }
            }

            pCell.classList.add(isCorrect ? 'game-cell--correct' : 'game-cell--wrong');
        }

        var scorePercent = Math.round((correct / total) * 100);
        engine.updateScore(scorePercent);

        if (scorePercent >= 80) {
            BrainForge.Audio.correct();
        } else {
            BrainForge.Audio.wrong();
        }

        updateInstruction(correct + ' / ' + total + ' correct (' + scorePercent + '%)');

        setTimeout(function() {
            engine.completeLevel(scorePercent);
        }, 1500);
    }

    function updateInstruction(text) {
        if (instructionEl) instructionEl.textContent = text;
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
