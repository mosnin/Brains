/* ============================================
   Audio Manager - Web Audio API sound effects
   ============================================ */

var BrainForge = window.BrainForge || {};

BrainForge.Audio = (function() {
  'use strict';

  var ctx = null;

  function getContext() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
    return ctx;
  }

  function playTone(freq, duration, type, volume) {
    var ac = getContext();
    if (!ac) return;
    if (BrainForge.Storage && !BrainForge.Storage.getSettings().soundEnabled) return;

    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }

  function correct() {
    playTone(523.25, 0.15, 'sine', 0.25);
    setTimeout(function() { playTone(659.25, 0.2, 'sine', 0.25); }, 100);
  }

  function wrong() {
    playTone(200, 0.3, 'square', 0.15);
  }

  function levelUp() {
    playTone(523.25, 0.1, 'sine', 0.2);
    setTimeout(function() { playTone(659.25, 0.1, 'sine', 0.2); }, 100);
    setTimeout(function() { playTone(783.99, 0.2, 'sine', 0.2); }, 200);
  }

  function click() {
    playTone(800, 0.05, 'sine', 0.1);
  }

  function tick() {
    playTone(1000, 0.03, 'sine', 0.08);
  }

  // Speak a letter for Dual N-Back
  function speakLetter(letter) {
    var ac = getContext();
    if (!ac) return;
    if (BrainForge.Storage && !BrainForge.Storage.getSettings().soundEnabled) return;

    if (window.speechSynthesis) {
      var utt = new SpeechSynthesisUtterance(letter);
      utt.rate = 1.2;
      utt.pitch = 1;
      utt.volume = 0.8;
      window.speechSynthesis.speak(utt);
    }
  }

  return {
    correct: correct,
    wrong: wrong,
    levelUp: levelUp,
    click: click,
    tick: tick,
    speakLetter: speakLetter,
    resume: function() {
      var ac = getContext();
      if (ac && ac.state === 'suspended') ac.resume();
    }
  };
})();
