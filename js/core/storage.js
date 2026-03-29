/* ============================================
   Storage Manager - localStorage wrapper
   ============================================ */

var BrainForge = window.BrainForge || {};

BrainForge.Storage = (function() {
  'use strict';

  var PROGRESS_KEY = 'brainforge_progress';
  var SETTINGS_KEY = 'brainforge_settings';

  function getProgress() {
    try {
      var data = localStorage.getItem(PROGRESS_KEY);
      return data ? JSON.parse(data) : {};
    } catch(e) {
      return {};
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch(e) {}
  }

  function getGameProgress(gameId) {
    var progress = getProgress();
    return progress[gameId] || {
      highestLevel: 0,
      scores: [],
      totalPlays: 0
    };
  }

  function saveGameProgress(gameId, data) {
    var progress = getProgress();
    progress[gameId] = data;
    saveProgress(progress);
  }

  function completeLevel(gameId, level, score) {
    var game = getGameProgress(gameId);
    if (level > game.highestLevel) {
      game.highestLevel = level;
    }
    game.scores[level - 1] = Math.max(game.scores[level - 1] || 0, score);
    game.totalPlays = (game.totalPlays || 0) + 1;
    saveGameProgress(gameId, game);
    return game;
  }

  function getSettings() {
    try {
      var data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { soundEnabled: true };
    } catch(e) {
      return { soundEnabled: true };
    }
  }

  function saveSetting(key, value) {
    var settings = getSettings();
    settings[key] = value;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch(e) {}
  }

  return {
    getGameProgress: getGameProgress,
    saveGameProgress: saveGameProgress,
    completeLevel: completeLevel,
    getSettings: getSettings,
    saveSetting: saveSetting
  };
})();
