(function() {
    'use strict';

    const PROBLEMS_PER_LEVEL = 10;
    const TOTAL_LEVELS = 30;
    const PASS_THRESHOLD = 80;

    const LEVEL_CONFIG = {
        1:  { ops: ['+'], range: [1, 10], choices: 4, time: 10, type: 'single' },
        2:  { ops: ['+'], range: [1, 10], choices: 4, time: 10, type: 'single' },
        3:  { ops: ['-'], range: [1, 15], choices: 4, time: 10, type: 'single' },
        4:  { ops: ['-'], range: [1, 15], choices: 4, time: 10, type: 'single' },
        5:  { ops: ['+', '-'], range: [1, 20], choices: 4, time: 8, type: 'single' },
        6:  { ops: ['+', '-'], range: [1, 20], choices: 4, time: 8, type: 'single' },
        7:  { ops: ['*'], range: [2, 9], choices: 4, time: 8, type: 'single' },
        8:  { ops: ['*'], range: [2, 9], choices: 4, time: 8, type: 'single' },
        9:  { ops: ['/'], range: [1, 12], choices: 4, time: 8, type: 'division' },
        10: { ops: ['/'], range: [1, 12], choices: 4, time: 8, type: 'division' },
        11: { ops: ['+', '-', '*', '/'], range: [1, 20], choices: 0, time: 7, type: 'mixed' },
        12: { ops: ['+', '-', '*', '/'], range: [1, 20], choices: 0, time: 7, type: 'mixed' },
        13: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 8, type: 'twoOps' },
        14: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 8, type: 'twoOps' },
        15: { ops: ['+', '-', '*'], range: [1, 30], choices: 0, time: 7, type: 'twoOps' },
        16: { ops: ['+', '-', '*'], range: [1, 30], choices: 0, time: 7, type: 'twoOps' },
        17: { ops: ['sq', 'sqrt'], range: [1, 15], choices: 0, time: 8, type: 'squares' },
        18: { ops: ['sq', 'sqrt'], range: [1, 15], choices: 0, time: 8, type: 'squares' },
        19: { ops: ['%'], range: [1, 100], choices: 0, time: 8, type: 'percent' },
        20: { ops: ['%'], range: [1, 100], choices: 0, time: 8, type: 'percent' },
        21: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 8, type: 'threeOps' },
        22: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 8, type: 'threeOps' },
        23: { ops: ['+'], range: [1, 1], choices: 0, time: 10, type: 'fraction' },
        24: { ops: ['+'], range: [1, 1], choices: 0, time: 10, type: 'fraction' },
        25: { ops: ['%', '+', '-'], range: [1, 50], choices: 0, time: 7, type: 'mixedAdvanced' },
        26: { ops: ['%', '+', '-'], range: [1, 50], choices: 0, time: 7, type: 'mixedAdvanced' },
        27: { ops: ['*'], range: [100, 500], choices: 4, time: 6, type: 'estimation' },
        28: { ops: ['*'], range: [100, 500], choices: 4, time: 6, type: 'estimation' },
        29: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 10, type: 'chain' },
        30: { ops: ['+', '-', '*'], range: [1, 20], choices: 0, time: 10, type: 'chain' }
    };

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function generateProblem(level) {
        var cfg = LEVEL_CONFIG[level];
        var type = cfg.type;
        var lo = cfg.range[0];
        var hi = cfg.range[1];

        switch (type) {
            case 'single': return genSingle(cfg, lo, hi);
            case 'division': return genDivision(cfg, lo, hi);
            case 'mixed': return genMixed(cfg, lo, hi);
            case 'twoOps': return genTwoOps(cfg, lo, hi);
            case 'squares': return genSquares(cfg, lo, hi);
            case 'percent': return genPercent(cfg);
            case 'threeOps': return genThreeOps(cfg, lo, hi);
            case 'fraction': return genFraction(cfg);
            case 'mixedAdvanced': return genMixedAdvanced(cfg);
            case 'estimation': return genEstimation(cfg, lo, hi);
            case 'chain': return genChain(cfg, lo, hi);
            default: return genSingle(cfg, lo, hi);
        }
    }

    function genSingle(cfg, lo, hi) {
        var op = pick(cfg.ops);
        var a = rand(lo, hi);
        var b = rand(lo, hi);
        var answer, text;

        if (op === '+') {
            answer = a + b;
            text = a + ' + ' + b + ' = ?';
        } else if (op === '-') {
            if (a < b) { var t = a; a = b; b = t; }
            answer = a - b;
            text = a + ' - ' + b + ' = ?';
        } else if (op === '*') {
            answer = a * b;
            text = a + ' \u00d7 ' + b + ' = ?';
        }

        return { text: text, answer: answer, choices: cfg.choices };
    }

    function genDivision(cfg, lo, hi) {
        var b = rand(2, hi);
        var answer = rand(lo, hi);
        var a = b * answer;
        return { text: a + ' \u00f7 ' + b + ' = ?', answer: answer, choices: cfg.choices };
    }

    function genMixed(cfg, lo, hi) {
        var op = pick(cfg.ops);
        var a, b, answer, text;

        if (op === '+') {
            a = rand(lo, hi); b = rand(lo, hi);
            answer = a + b; text = a + ' + ' + b + ' = ?';
        } else if (op === '-') {
            a = rand(lo, hi); b = rand(lo, hi);
            if (a < b) { var t = a; a = b; b = t; }
            answer = a - b; text = a + ' - ' + b + ' = ?';
        } else if (op === '*') {
            a = rand(2, Math.min(hi, 12)); b = rand(2, Math.min(hi, 12));
            answer = a * b; text = a + ' \u00d7 ' + b + ' = ?';
        } else {
            b = rand(2, Math.min(hi, 12)); answer = rand(1, 12);
            a = b * answer; text = a + ' \u00f7 ' + b + ' = ?';
        }

        return { text: text, answer: answer, choices: cfg.choices };
    }

    function genTwoOps(cfg, lo, hi) {
        var ops = [pick(cfg.ops), pick(cfg.ops)];
        var nums = [rand(lo, Math.min(hi, 15)), rand(lo, Math.min(hi, 10)), rand(lo, Math.min(hi, 10))];
        var result = nums[0];

        var parts = [String(nums[0])];
        for (var i = 0; i < 2; i++) {
            var op = ops[i];
            if (op === '*') {
                nums[i + 1] = rand(2, 9);
                result = result * nums[i + 1];
                parts.push(' \u00d7 ' + nums[i + 1]);
            } else if (op === '-') {
                if (result < nums[i + 1]) nums[i + 1] = rand(1, Math.max(1, result - 1));
                result = result - nums[i + 1];
                parts.push(' - ' + nums[i + 1]);
            } else {
                result = result + nums[i + 1];
                parts.push(' + ' + nums[i + 1]);
            }
        }

        return { text: '(' + parts.join('') + ') = ?', answer: result, choices: 0 };
    }

    function genSquares(cfg, lo, hi) {
        if (Math.random() < 0.5) {
            var n = rand(lo, hi);
            return { text: n + '\u00b2 = ?', answer: n * n, choices: 0 };
        } else {
            var root = rand(lo, Math.min(hi, 12));
            var sq = root * root;
            return { text: '\u221a' + sq + ' = ?', answer: root, choices: 0 };
        }
    }

    function genPercent(cfg) {
        var percents = [10, 20, 25, 50, 75];
        var p = pick(percents);
        var base = rand(2, 20) * 4;
        var answer = (p / 100) * base;
        return { text: p + '% of ' + base + ' = ?', answer: answer, choices: 0 };
    }

    function genThreeOps(cfg, lo, hi) {
        var nums = [rand(2, 10), rand(2, 8), rand(1, 6), rand(1, 5)];
        var ops = [pick(['+', '-', '*']), pick(['+', '-']), pick(['+', '-'])];
        var result = nums[0];
        var parts = [String(nums[0])];
        var opSymbols = { '+': ' + ', '-': ' - ', '*': ' \u00d7 ' };

        for (var i = 0; i < 3; i++) {
            var op = ops[i];
            if (op === '*') { nums[i + 1] = rand(2, 5); }
            if (op === '-' && result < nums[i + 1]) { nums[i + 1] = rand(1, Math.max(1, result)); }
            if (op === '+') result += nums[i + 1];
            else if (op === '-') result -= nums[i + 1];
            else result *= nums[i + 1];
            parts.push(opSymbols[op] + nums[i + 1]);
        }

        return { text: '(' + parts.join('') + ') = ?', answer: result, choices: 0 };
    }

    function genFraction() {
        var denoms = [2, 3, 4, 5, 6, 8];
        var d1 = pick(denoms);
        var d2 = pick(denoms);
        var n1 = rand(1, d1 - 1);
        var n2 = rand(1, d2 - 1);
        var answer = (n1 / d1) + (n2 / d2);
        answer = Math.round(answer * 1000) / 1000;
        return { text: n1 + '/' + d1 + ' + ' + n2 + '/' + d2 + ' = ?', answer: answer, choices: 0, tolerance: 0.02 };
    }

    function genMixedAdvanced() {
        var p = pick([10, 20, 25, 50]);
        var base = rand(4, 20) * 4;
        var pVal = (p / 100) * base;
        var add = rand(1, 20);
        var answer = pVal + add;
        return { text: p + '% of ' + base + ' + ' + add + ' = ?', answer: answer, choices: 0 };
    }

    function genEstimation(cfg, lo, hi) {
        var a = rand(lo, hi);
        var b = rand(10, 50);
        var answer = a * b;
        return { text: a + ' \u00d7 ' + b + ' \u2248 ?', answer: answer, choices: 4, isEstimation: true };
    }

    function genChain(cfg, lo, hi) {
        var nums = [rand(5, 15), rand(2, 8), rand(1, 6), rand(2, 5), rand(1, 4)];
        var ops = [pick(['+', '*']), pick(['+', '-']), pick(['+', '-']), pick(['+', '-'])];
        var result = nums[0];
        var parts = [String(nums[0])];
        var opSymbols = { '+': ' + ', '-': ' - ', '*': ' \u00d7 ' };

        for (var i = 0; i < 4; i++) {
            var op = ops[i];
            if (op === '*') nums[i + 1] = rand(2, 4);
            if (op === '-' && result < nums[i + 1]) nums[i + 1] = rand(1, Math.max(1, result));
            if (op === '+') result += nums[i + 1];
            else if (op === '-') result -= nums[i + 1];
            else result *= nums[i + 1];
            parts.push(opSymbols[op] + nums[i + 1]);
        }

        return { text: '(' + parts.join('') + ') = ?', answer: result, choices: 0 };
    }

    function generateChoices(correct, isEstimation) {
        var options = [correct];
        var spread = isEstimation ? Math.max(50, Math.floor(correct * 0.15)) : Math.max(1, Math.floor(Math.abs(correct) * 0.3) + 1);
        var attempts = 0;

        while (options.length < 4 && attempts < 50) {
            var offset;
            if (isEstimation) {
                offset = rand(-spread, spread);
                if (offset === 0) offset = rand(1, spread);
            } else {
                offset = rand(1, Math.max(2, spread)) * (Math.random() < 0.5 ? -1 : 1);
            }
            var wrong = correct + offset;
            if (wrong < 0) wrong = correct + Math.abs(offset);
            if (options.indexOf(wrong) === -1) {
                options.push(wrong);
            }
            attempts++;
        }

        while (options.length < 4) {
            options.push(correct + options.length * 2);
        }

        return shuffle(options);
    }

    function SpeedMathGame() {
        this.engine = null;
        this.currentLevel = 1;
        this.currentProblem = 0;
        this.correctCount = 0;
        this.currentAnswer = null;
        this.currentTolerance = 0;
        this.problemActive = false;
    }

    SpeedMathGame.prototype.init = function() {
        var self = this;

        this.engine = new BrainForge.GameEngine({
            gameId: 'speed-math',
            totalLevels: TOTAL_LEVELS,
            passThreshold: PASS_THRESHOLD,
            onGameStart: function(level) {
                self.startGame(level);
            }
        });
    };

    SpeedMathGame.prototype.startGame = function(level) {
        this.currentLevel = level;
        this.currentProblem = 0;
        this.correctCount = 0;
        this.engine.startLevel(level);
        this.buildGameUI();
        this.nextProblem();
    };

    SpeedMathGame.prototype.buildGameUI = function() {
        var area = document.getElementById('game-area');
        var cfg = LEVEL_CONFIG[this.currentLevel];

        var html = '<div class="problem-display"><div class="problem-text" id="problem-text"></div></div>';
        html += '<div id="progress-info" style="text-align:center;margin:0.5rem 0;font-size:0.95rem;color:#aaa;"></div>';

        if (cfg.choices > 0) {
            html += '<div class="choices" id="choices-area"></div>';
        } else {
            html += '<div class="input-area" id="input-area">';
            html += '<input type="number" step="any" id="answer-input" placeholder="Your answer" autocomplete="off">';
            html += '<button id="submit-btn" class="choice-btn">Submit</button>';
            html += '</div>';
        }

        html += '<div id="feedback" style="text-align:center;margin-top:1rem;font-size:1.2rem;min-height:1.5em;"></div>';
        area.innerHTML = html;

        var self = this;

        if (!cfg.choices) {
            var input = document.getElementById('answer-input');
            var btn = document.getElementById('submit-btn');

            btn.addEventListener('click', function() {
                self.submitTypedAnswer();
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    self.submitTypedAnswer();
                }
            });
        }
    };

    SpeedMathGame.prototype.nextProblem = function() {
        if (this.currentProblem >= PROBLEMS_PER_LEVEL) {
            this.endGame();
            return;
        }

        var self = this;
        var cfg = LEVEL_CONFIG[this.currentLevel];
        var problem = generateProblem(this.currentLevel);

        this.currentAnswer = problem.answer;
        this.currentTolerance = problem.tolerance || 0;
        this.problemActive = true;

        document.getElementById('problem-text').textContent = problem.text;
        document.getElementById('progress-info').textContent = 'Problem ' + (this.currentProblem + 1) + ' of ' + PROBLEMS_PER_LEVEL;
        document.getElementById('feedback').textContent = '';

        if (cfg.choices > 0 || problem.isEstimation) {
            var choicesArea = document.getElementById('choices-area');
            if (choicesArea) {
                var options = generateChoices(problem.answer, problem.isEstimation);
                choicesArea.innerHTML = '';
                options.forEach(function(opt) {
                    var btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.textContent = opt;
                    btn.addEventListener('click', function() {
                        if (!self.problemActive) return;
                        self.checkAnswer(opt, problem.isEstimation);
                    });
                    choicesArea.appendChild(btn);
                });
            }
        } else {
            var input = document.getElementById('answer-input');
            if (input) {
                input.value = '';
                input.focus();
            }
        }

        this.engine.startTimer(cfg.time, function() {
            self.timeUp();
        });
    };

    SpeedMathGame.prototype.submitTypedAnswer = function() {
        if (!this.problemActive) return;
        var input = document.getElementById('answer-input');
        var val = parseFloat(input.value);
        if (isNaN(val)) return;
        this.checkAnswer(val, false);
    };

    SpeedMathGame.prototype.checkAnswer = function(playerAnswer, isEstimation) {
        if (!this.problemActive) return;
        this.problemActive = false;
        this.engine.stopTimer();

        var correct = false;
        if (isEstimation) {
            correct = true;
        } else if (this.currentTolerance > 0) {
            correct = Math.abs(playerAnswer - this.currentAnswer) <= this.currentTolerance;
        } else {
            correct = playerAnswer === this.currentAnswer;
        }

        var feedback = document.getElementById('feedback');

        if (correct) {
            this.correctCount++;
            feedback.textContent = 'Correct!';
            feedback.style.color = '#4ecdc4';
            BrainForge.Audio.correct();
        } else {
            feedback.textContent = 'Wrong! Answer: ' + (Math.round(this.currentAnswer * 100) / 100);
            feedback.style.color = '#ff6b6b';
            BrainForge.Audio.wrong();
        }

        var score = Math.round((this.correctCount / PROBLEMS_PER_LEVEL) * 100);
        this.engine.updateScore(score);

        this.currentProblem++;

        var self = this;
        setTimeout(function() {
            self.nextProblem();
        }, 1000);
    };

    SpeedMathGame.prototype.timeUp = function() {
        if (!this.problemActive) return;
        this.problemActive = false;

        var feedback = document.getElementById('feedback');
        feedback.textContent = 'Time\'s up! Answer: ' + (Math.round(this.currentAnswer * 100) / 100);
        feedback.style.color = '#ff6b6b';
        BrainForge.Audio.wrong();

        this.currentProblem++;
        var score = Math.round((this.correctCount / PROBLEMS_PER_LEVEL) * 100);
        this.engine.updateScore(score);

        var self = this;
        setTimeout(function() {
            self.nextProblem();
        }, 1200);
    };

    SpeedMathGame.prototype.endGame = function() {
        var score = Math.round((this.correctCount / PROBLEMS_PER_LEVEL) * 100);
        this.engine.completeLevel(score);
        if (score >= PASS_THRESHOLD) {
            BrainForge.Audio.levelUp();
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        var game = new SpeedMathGame();
        game.init();
    });
})();
