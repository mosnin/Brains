/* ============================================
   Game Engine - Shared base for all games
   ============================================ */

var BrainForge = window.BrainForge || {};

BrainForge.GameEngine = (function() {
  'use strict';

  var STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over'
  };

  function GameEngine(config) {
    this.gameId = config.gameId;
    this.totalLevels = config.totalLevels || 30;
    this.passThreshold = config.passThreshold || 80;
    this.currentLevel = 1;
    this.state = STATES.MENU;
    this.score = 0;
    this.timer = null;
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.progress = BrainForge.Storage.getGameProgress(this.gameId);

    this.container = document.getElementById('game-container');
    this.hudLevel = document.getElementById('hud-level');
    this.hudScore = document.getElementById('hud-score');
    this.hudTimer = document.getElementById('hud-timer');
    this.hudTimerBar = document.getElementById('hud-timer-bar');

    this.onLevelComplete = config.onLevelComplete || function(){};
    this.onGameStart = config.onGameStart || function(){};
    this.onGamePause = config.onGamePause || function(){};

    this._initLevelSelect();
    this._initPauseHandler();
  }

  GameEngine.prototype._initLevelSelect = function() {
    var self = this;
    var grid = document.getElementById('level-select-grid');
    if (!grid) return;

    grid.innerHTML = '';
    for (var i = 1; i <= this.totalLevels; i++) {
      var btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.textContent = i;
      btn.dataset.level = i;

      if (i <= this.progress.highestLevel + 1) {
        btn.classList.add('level-btn--unlocked');
        if (i <= this.progress.highestLevel) {
          btn.classList.add('level-btn--completed');
          var score = this.progress.scores[i-1] || 0;
          if (score >= 90) btn.classList.add('level-btn--star3');
          else if (score >= 80) btn.classList.add('level-btn--star2');
          else btn.classList.add('level-btn--star1');
        }
      } else {
        btn.classList.add('level-btn--locked');
        btn.disabled = true;
      }

      btn.addEventListener('click', (function(level) {
        return function() {
          BrainForge.Audio.click();
          self.startLevel(level);
        };
      })(i));

      grid.appendChild(btn);
    }
  };

  GameEngine.prototype._initPauseHandler = function() {
    var self = this;
    var pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function() {
        if (self.state === STATES.PLAYING) {
          self.pauseGame();
        } else if (self.state === STATES.PAUSED) {
          self.resumeGame();
        }
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (self.state === STATES.PLAYING) self.pauseGame();
        else if (self.state === STATES.PAUSED) self.resumeGame();
      }
    });
  };

  GameEngine.prototype.startLevel = function(level) {
    this.currentLevel = level;
    this.state = STATES.PLAYING;
    this.score = 0;

    if (this.hudLevel) this.hudLevel.textContent = 'Level ' + level;
    if (this.hudScore) this.hudScore.textContent = '0%';

    // Hide level select, show game area
    var levelSelect = document.getElementById('level-select');
    var gameArea = document.getElementById('game-area');
    var hud = document.getElementById('game-hud');

    if (levelSelect) levelSelect.style.display = 'none';
    if (gameArea) gameArea.style.display = 'block';
    if (hud) hud.style.display = 'flex';

    this.hideOverlay();
    this.onGameStart(level);
  };

  GameEngine.prototype.pauseGame = function() {
    if (this.state !== STATES.PLAYING) return;
    this.state = STATES.PAUSED;
    this.stopTimer();
    this.showOverlay('Paused', '', [
      { text: 'Resume', class: 'btn--primary', action: 'resume' },
      { text: 'Quit', class: 'btn--ghost', action: 'quit' }
    ]);
    this.onGamePause();
  };

  GameEngine.prototype.resumeGame = function() {
    this.state = STATES.PLAYING;
    this.hideOverlay();
    if (this.timerRemaining > 0) {
      this.startTimer(this.timerRemaining);
    }
  };

  GameEngine.prototype.completeLevel = function(scorePercent) {
    this.state = STATES.LEVEL_COMPLETE;
    this.stopTimer();
    var passed = scorePercent >= this.passThreshold;
    var stars = scorePercent >= 95 ? 3 : scorePercent >= 85 ? 2 : scorePercent >= this.passThreshold ? 1 : 0;

    if (passed) {
      this.progress = BrainForge.Storage.completeLevel(this.gameId, this.currentLevel, scorePercent);
      BrainForge.Audio.levelUp();
    } else {
      BrainForge.Audio.wrong();
    }

    var starsHtml = '';
    for (var i = 0; i < 3; i++) {
      starsHtml += '<span class="star ' + (i < stars ? 'star--filled' : '') + '">&#9733;</span>';
    }

    var subtitle = '<div class="overlay-score">' + Math.round(scorePercent) + '%</div>' +
                   '<div class="overlay-stars">' + starsHtml + '</div>' +
                   (passed ? '<p class="overlay-msg overlay-msg--success">Level Complete!</p>' :
                    '<p class="overlay-msg overlay-msg--fail">Score ' + this.passThreshold + '% to pass</p>');

    var buttons = [];
    if (passed && this.currentLevel < this.totalLevels) {
      buttons.push({ text: 'Next Level', class: 'btn--primary', action: 'next' });
    }
    buttons.push({ text: 'Retry', class: passed ? 'btn--ghost' : 'btn--primary', action: 'retry' });
    buttons.push({ text: 'Menu', class: 'btn--ghost', action: 'quit' });

    this.showOverlay(passed ? 'Well Done!' : 'Try Again', subtitle, buttons);
  };

  GameEngine.prototype.showOverlay = function(title, subtitle, buttons) {
    var self = this;
    var overlay = document.getElementById('game-overlay');
    if (!overlay) return;

    var html = '<div class="overlay-content">';
    html += '<h2 class="overlay-title">' + title + '</h2>';
    if (subtitle) html += '<div class="overlay-subtitle">' + subtitle + '</div>';
    if (buttons && buttons.length) {
      html += '<div class="overlay-buttons">';
      buttons.forEach(function(b) {
        html += '<button class="btn ' + b.class + '" data-action="' + b.action + '">' + b.text + '</button>';
      });
      html += '</div>';
    }
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    overlay.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = this.dataset.action;
        if (action === 'resume') {
          self.resumeGame();
        } else if (action === 'retry') {
          self.hideOverlay();
          self.startLevel(self.currentLevel);
        } else if (action === 'next') {
          self.hideOverlay();
          self.startLevel(self.currentLevel + 1);
        } else if (action === 'quit') {
          self.returnToMenu();
        }
      });
    });
  };

  GameEngine.prototype.hideOverlay = function() {
    var overlay = document.getElementById('game-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  };

  GameEngine.prototype.returnToMenu = function() {
    this.state = STATES.MENU;
    this.stopTimer();
    this.hideOverlay();

    var levelSelect = document.getElementById('level-select');
    var gameArea = document.getElementById('game-area');
    var hud = document.getElementById('game-hud');

    if (gameArea) gameArea.style.display = 'none';
    if (hud) hud.style.display = 'none';
    if (levelSelect) levelSelect.style.display = 'block';

    this.progress = BrainForge.Storage.getGameProgress(this.gameId);
    this._initLevelSelect();
  };

  GameEngine.prototype.startTimer = function(seconds, callback) {
    var self = this;
    this.stopTimer();
    this.timerTotal = seconds;
    this.timerRemaining = seconds;

    var startTime = Date.now();
    this.timer = setInterval(function() {
      if (self.state !== STATES.PLAYING) return;
      var elapsed = (Date.now() - startTime) / 1000;
      self.timerRemaining = Math.max(0, seconds - elapsed);
      var pct = (self.timerRemaining / self.timerTotal) * 100;

      if (self.hudTimer) self.hudTimer.textContent = Math.ceil(self.timerRemaining) + 's';
      if (self.hudTimerBar) self.hudTimerBar.style.width = pct + '%';

      if (self.timerRemaining <= 0) {
        self.stopTimer();
        if (callback) callback();
      }
    }, 100);
  };

  GameEngine.prototype.stopTimer = function() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  GameEngine.prototype.updateScore = function(scorePercent) {
    if (this.hudScore) this.hudScore.textContent = Math.round(scorePercent) + '%';
  };

  GameEngine.STATES = STATES;

  return GameEngine;
})();
