/* ============================================
   Word Recall Game
   ============================================ */

(function() {
  'use strict';

  // --- Word Dictionary ---
  var CATEGORIES = {
    animals: ['cat','dog','elephant','tiger','lion','bear','wolf','eagle','hawk','snake','dolphin','whale','shark','horse','deer','rabbit','fox','mouse','frog','turtle','penguin','parrot','crow','owl','salmon','trout','butterfly','beetle','spider','ant','bee','wasp','gorilla','monkey','panda','koala','zebra','giraffe','hippo','rhino','camel','leopard','cheetah','buffalo','moose','otter','seal','crab','lobster','octopus','squid','jellyfish','starfish','chicken','duck','goose','swan','flamingo','pelican'],
    foods: ['pizza','pasta','bread','cheese','butter','chicken','steak','salmon','rice','beans','potato','tomato','onion','garlic','pepper','carrot','broccoli','spinach','apple','banana','orange','grape','mango','peach','plum','cherry','lemon','melon','cookie','cake','candy','chocolate','sugar','honey','yogurt','cream','bacon','sausage','burger','sandwich','salad','soup','curry','noodle','dumpling','taco','burrito','waffle','pancake','muffin'],
    countries: ['france','germany','italy','spain','portugal','brazil','mexico','canada','japan','china','india','russia','egypt','turkey','greece','sweden','norway','finland','denmark','poland','austria','belgium','ireland','scotland','england','australia','argentina','chile','peru','colombia','kenya','nigeria','morocco','thailand','vietnam','korea','indonesia','malaysia','singapore','philippines','pakistan','iran','iraq','israel','jordan','cuba','jamaica','iceland','ukraine','romania'],
    colors: ['red','blue','green','yellow','orange','purple','pink','brown','black','white','gray','silver','gold','teal','cyan','magenta','maroon','navy','olive','coral','ivory','beige','turquoise','indigo','violet','crimson','scarlet','amber','bronze','copper'],
    professions: ['doctor','nurse','teacher','lawyer','engineer','pilot','chef','artist','writer','actor','singer','dancer','farmer','builder','plumber','driver','soldier','police','dentist','surgeon','scientist','chemist','physicist','architect','designer','painter','musician','athlete','coach','referee','banker','accountant','manager','director','secretary','librarian','janitor','mechanic','electrician','carpenter'],
    sports: ['soccer','football','baseball','basketball','tennis','golf','hockey','rugby','cricket','boxing','wrestling','swimming','diving','surfing','skiing','skating','cycling','running','jumping','climbing','fencing','archery','rowing','sailing','volleyball','badminton','squash','karate','judo','taekwondo'],
    fruits: ['apple','banana','orange','grape','mango','peach','plum','cherry','lemon','lime','melon','watermelon','strawberry','blueberry','raspberry','blackberry','cranberry','pineapple','coconut','papaya','kiwi','fig','date','apricot','pomegranate','guava','lychee','passion','avocado','pear'],
    bodyparts: ['head','face','eye','ear','nose','mouth','tongue','tooth','chin','neck','shoulder','arm','elbow','wrist','hand','finger','thumb','chest','stomach','back','hip','leg','knee','ankle','foot','toe','brain','heart','lung','liver','bone','skin','hair','nail','muscle']
  };

  // General word list for anagrams
  var WORDS = {
    4: ['able','back','cake','dark','each','face','game','half','idea','joke','keep','lamp','made','name','open','page','rain','safe','take','unit','vast','walk','yard','zero','army','bank','camp','deny','edit','fear','gift','harm','iron','jazz','king','land','mask','near','oath','pair','quit','rare','salt','tall','ugly','vein','warn','yell','zone','acid','bold','calm','dawn','emit','fold','gain','haze','itch','jolt'],
    5: ['about','basic','chair','dance','earth','flame','ghost','happy','image','juice','knife','lemon','magic','night','ocean','piano','queen','river','storm','tower','ultra','vivid','water','yacht','zebra','angel','brave','chase','dream','eager','fancy','grain','heart','ivory','joker','kneel','laser','march','noble','orbit','peach','quest','reign','solar','trail','unity','vapor','whale','young','acute','blend','coral','drift','evoke','frost','globe','humor','irony'],
    6: ['bright','castle','danger','energy','forest','garden','hammer','island','jungle','kitten','ladder','marble','narrow','orange','palace','rabbit','sacred','temple','unique','valley','winter','anchor','bridge','canvas','desert','emerge','frozen','global','honest','insect','jester','kernel','lizard','mirror','needle','outlet','pirate','quartz','riddle','summit','trophy','unfold','violin','walnut','export','myrtle','planet','rocket','silver','breeze','candle','dinner'],
    7: ['balance','cabinet','diamond','emerald','factory','gateway','harvest','imagine','journey','kitchen','lantern','machine','natural','ostrich','pattern','quantum','reflect','shelter','triumph','uniform','venture','warrior','example','mystery','blanket','chapter','decimal','emotion','fiction','glacier','horizon','illicit','jasmine','kindred','lecture','mineral','network','opinion','perfect','rainbow','silence','thermal','whisper','article'],
    8: ['absolute','balanced','calendar','darkness','database','elephant','envelope','fearless','fraction','generous','graceful','handsome','hardware','interest','innocent','jungle','keyboard','language','lifetime','magnetic','material','national','negative','notebook','obstacle','painting','paradise','pleasure','possible','question','relation','remember','sandwich','schedule','shoulder','strategy','surprise','teaching','together','treasure','umbrella','universe','vacation','variable','violence','wardrobe','wildfire','workshop','yearbook']
  };

  // --- Level Configuration ---
  function getLevelConfig(level) {
    if (level <= 2)  return { mode: 'anagram', wordLen: 4, time: 30, target: 1 };
    if (level <= 4)  return { mode: 'anagram', wordLen: 5, time: 25, target: 1 };
    if (level <= 6)  return { mode: 'anagram', wordLen: [5,6], time: 20, target: 1 };
    if (level <= 8)  return { mode: 'category', time: 30, target: 5, categories: ['animals','colors','fruits'], minLen: 0 };
    if (level <= 10) return { mode: 'category', time: 30, target: 7, categories: ['countries','professions','sports'], minLen: 0 };
    if (level <= 12) return { mode: 'chain', time: 60, target: 6, minWordLen: 3 };
    if (level <= 14) return { mode: 'anagram', wordLen: [6,7], time: 20, target: 1 };
    if (level <= 16) return { mode: 'category', time: 30, target: 6, categories: ['animals','foods','countries'], minLen: 5 };
    if (level <= 18) return { mode: 'chain', time: 60, target: 10, minWordLen: 4 };
    if (level <= 20) return { mode: 'double_anagram', wordLen: 6, time: 30, target: 2 };
    if (level <= 22) return { mode: 'category_letter', time: 30, target: 5, categories: ['animals','foods','countries','professions'] };
    if (level <= 24) return { mode: 'chain', time: 50, target: 10, minWordLen: 5 };
    if (level <= 26) return { mode: 'anagram', wordLen: 8, time: 25, target: 1 };
    if (level <= 28) return { mode: 'category', time: 20, target: 8, categories: ['animals','foods','sports','fruits'], minLen: 0 };
    return { mode: 'mixed', time: 45, target: 8 };
  }

  // --- Utilities ---
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getAllWords() {
    var all = {};
    Object.keys(WORDS).forEach(function(len) {
      WORDS[len].forEach(function(w) { all[w.toLowerCase()] = true; });
    });
    Object.keys(CATEGORIES).forEach(function(cat) {
      CATEGORIES[cat].forEach(function(w) { all[w.toLowerCase()] = true; });
    });
    return all;
  }

  var ALL_WORDS = getAllWords();

  function isValidWord(word) {
    return ALL_WORDS[word.toLowerCase()] === true;
  }

  function scrambleWord(word) {
    var letters = word.split('');
    var scrambled;
    var attempts = 0;
    do {
      scrambled = shuffle(letters).join('');
      attempts++;
    } while (scrambled === word && attempts < 20);
    return scrambled;
  }

  // --- Game State ---
  var engine;
  var gameState = {
    config: null,
    correctWords: [],
    submittedWords: [],
    targetWord: '',
    targetWords: [],
    scrambled: '',
    category: '',
    startLetter: '',
    lastWord: '',
    phase: 0, // for mixed mode
    roundsCompleted: 0,
    roundsTotal: 0
  };

  // --- DOM References ---
  var gameArea, statusEl;

  function initGame() {
    engine = new BrainForge.GameEngine({
      gameId: 'word-recall',
      totalLevels: 30,
      passThreshold: 80,
      onGameStart: startLevel
    });
  }

  function startLevel(level) {
    var config = getLevelConfig(level);
    gameState.config = config;
    gameState.submittedWords = [];
    gameState.correctWords = [];
    gameState.lastWord = '';
    gameState.phase = 0;
    gameState.roundsCompleted = 0;

    gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';

    if (config.mode === 'anagram' || config.mode === 'double_anagram') {
      setupAnagram(config);
    } else if (config.mode === 'category') {
      setupCategory(config);
    } else if (config.mode === 'category_letter') {
      setupCategoryLetter(config);
    } else if (config.mode === 'chain') {
      setupChain(config);
    } else if (config.mode === 'mixed') {
      gameState.roundsTotal = 8;
      setupMixedRound();
    }
  }

  // --- Anagram Mode ---
  function setupAnagram(config) {
    var len = Array.isArray(config.wordLen) ? pickRandom(config.wordLen) : config.wordLen;
    var wordList = WORDS[len] || WORDS[6];
    var word = pickRandom(wordList);
    gameState.targetWord = word.toLowerCase();
    gameState.scrambled = scrambleWord(word).toUpperCase();

    if (config.mode === 'double_anagram') {
      // Find words that are anagrams of each other
      var sorted = word.split('').sort().join('');
      gameState.targetWords = wordList.filter(function(w) {
        return w.split('').sort().join('') === sorted;
      });
      if (gameState.targetWords.length < 2) {
        // fallback: just use the word twice requirement
        gameState.targetWords = [word];
      }
    }

    var html = '<div class="game-status" id="game-status">Unscramble the letters to form a word</div>';
    html += '<div class="scrambled-letters">';
    for (var i = 0; i < gameState.scrambled.length; i++) {
      html += '<div class="scrambled-letter">' + gameState.scrambled[i] + '</div>';
    }
    html += '</div>';
    html += '<div class="input-area"><input type="text" id="word-input" placeholder="Type your answer..." maxlength="' + (len + 2) + '" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
    html += '<div class="word-tags" id="word-tags"></div>';

    if (config.mode === 'double_anagram') {
      html = '<div class="game-status" id="game-status">Find 2 different words from these letters</div>' + html.substring(html.indexOf('<div class="scrambled'));
    }

    gameArea.innerHTML = html;

    var input = document.getElementById('word-input');
    var submitBtn = document.getElementById('submit-word');

    input.focus();

    submitBtn.addEventListener('click', function() { submitAnagram(config); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitAnagram(config);
    });

    engine.startTimer(config.time, function() {
      finishRound();
    });
  }

  function submitAnagram(config) {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';
    input.focus();

    if (!word || word.length < 3) return;
    if (gameState.submittedWords.indexOf(word) !== -1) {
      BrainForge.showToast('Already submitted!', 'error');
      return;
    }

    // Check if letters match
    var sortedInput = word.split('').sort().join('');
    var sortedTarget = gameState.targetWord.split('').sort().join('');

    gameState.submittedWords.push(word);

    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    if (sortedInput === sortedTarget && isValidWord(word)) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.correctWords.push(word);
      BrainForge.Audio.correct();

      var target = config.mode === 'double_anagram' ? 2 : config.target;
      if (gameState.correctWords.length >= target) {
        engine.stopTimer();
        setTimeout(finishRound, 500);
      }
    } else {
      tag.className = 'word-tag word-tag--wrong';
      tag.textContent = word;
      BrainForge.Audio.wrong();
    }

    tags.appendChild(tag);
    engine.updateScore(Math.min(100, (gameState.correctWords.length / (config.target || 1)) * 100));
  }

  // --- Category Mode ---
  function setupCategory(config) {
    var cat = pickRandom(config.categories);
    gameState.category = cat;

    var label = cat.charAt(0).toUpperCase() + cat.slice(1);
    var html = '<div class="game-status" id="game-status">Name ' + config.target + ' ' + label;
    if (config.minLen > 0) html += ' (' + config.minLen + '+ letters)';
    html += '</div>';
    html += '<div class="problem-display"><div class="problem-text" style="font-family:var(--font-sans)">' + label + '</div></div>';
    html += '<div class="input-area"><input type="text" id="word-input" placeholder="Type a word..." maxlength="20" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
    html += '<div class="word-tags" id="word-tags"></div>';
    html += '<div style="text-align:center;margin-top:var(--space-2)"><span style="font-size:var(--text-sm);color:var(--text-muted)" id="word-count">0 / ' + config.target + '</span></div>';

    gameArea.innerHTML = html;

    var input = document.getElementById('word-input');
    input.focus();

    document.getElementById('submit-word').addEventListener('click', function() { submitCategory(config); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitCategory(config);
    });

    engine.startTimer(config.time, function() { finishRound(); });
  }

  function submitCategory(config) {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';
    input.focus();

    if (!word || word.length < 2) return;
    if (gameState.submittedWords.indexOf(word) !== -1) {
      BrainForge.showToast('Already submitted!', 'error');
      return;
    }
    if (config.minLen && word.length < config.minLen) {
      BrainForge.showToast('Word must be ' + config.minLen + '+ letters', 'error');
      return;
    }

    gameState.submittedWords.push(word);

    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    var catWords = CATEGORIES[gameState.category] || [];
    if (catWords.indexOf(word) !== -1) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.correctWords.push(word);
      BrainForge.Audio.correct();
    } else {
      tag.className = 'word-tag word-tag--wrong';
      tag.textContent = word;
      BrainForge.Audio.wrong();
    }

    tags.appendChild(tag);

    var count = document.getElementById('word-count');
    if (count) count.textContent = gameState.correctWords.length + ' / ' + config.target;

    var pct = Math.min(100, (gameState.correctWords.length / config.target) * 100);
    engine.updateScore(pct);

    if (gameState.correctWords.length >= config.target) {
      engine.stopTimer();
      setTimeout(finishRound, 500);
    }
  }

  // --- Category + Letter Mode ---
  function setupCategoryLetter(config) {
    var cat = pickRandom(config.categories);
    var catWords = CATEGORIES[cat];
    var letters = {};
    catWords.forEach(function(w) { letters[w[0]] = true; });
    var availableLetters = Object.keys(letters);
    var letter = pickRandom(availableLetters).toUpperCase();

    gameState.category = cat;
    gameState.startLetter = letter.toLowerCase();

    var label = cat.charAt(0).toUpperCase() + cat.slice(1);
    var html = '<div class="game-status" id="game-status">Name ' + config.target + ' ' + label + ' starting with "' + letter + '"</div>';
    html += '<div class="problem-display"><div class="problem-text" style="font-family:var(--font-sans)">' + label + ' &mdash; ' + letter + '</div></div>';
    html += '<div class="input-area"><input type="text" id="word-input" placeholder="Type a word..." maxlength="20" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
    html += '<div class="word-tags" id="word-tags"></div>';
    html += '<div style="text-align:center;margin-top:var(--space-2)"><span style="font-size:var(--text-sm);color:var(--text-muted)" id="word-count">0 / ' + config.target + '</span></div>';

    gameArea.innerHTML = html;

    var input = document.getElementById('word-input');
    input.focus();

    document.getElementById('submit-word').addEventListener('click', function() { submitCategoryLetter(config); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitCategoryLetter(config);
    });

    engine.startTimer(config.time, function() { finishRound(); });
  }

  function submitCategoryLetter(config) {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';
    input.focus();

    if (!word || word.length < 2) return;
    if (gameState.submittedWords.indexOf(word) !== -1) {
      BrainForge.showToast('Already submitted!', 'error');
      return;
    }

    gameState.submittedWords.push(word);

    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    var catWords = CATEGORIES[gameState.category] || [];
    if (catWords.indexOf(word) !== -1 && word[0] === gameState.startLetter) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.correctWords.push(word);
      BrainForge.Audio.correct();
    } else {
      tag.className = 'word-tag word-tag--wrong';
      tag.textContent = word;
      BrainForge.Audio.wrong();
    }

    tags.appendChild(tag);

    var count = document.getElementById('word-count');
    if (count) count.textContent = gameState.correctWords.length + ' / ' + config.target;

    engine.updateScore(Math.min(100, (gameState.correctWords.length / config.target) * 100));

    if (gameState.correctWords.length >= config.target) {
      engine.stopTimer();
      setTimeout(finishRound, 500);
    }
  }

  // --- Word Chain Mode ---
  function setupChain(config) {
    // Pick a starting word
    var startWords = WORDS[4] || ['game'];
    var startWord = pickRandom(startWords).toLowerCase();
    gameState.lastWord = startWord;
    gameState.correctWords = [startWord];
    gameState.submittedWords = [startWord];

    var html = '<div class="game-status" id="game-status">Build a word chain! Each word starts with the last letter of the previous word.</div>';
    html += '<div style="text-align:center;margin:var(--space-4) 0"><span style="font-size:var(--text-sm);color:var(--text-muted)">Min ' + config.minWordLen + ' letters per word</span></div>';
    html += '<div class="word-tags" id="word-tags"><span class="word-tag word-tag--correct">' + startWord + '</span></div>';
    html += '<div class="input-area"><input type="text" id="word-input" placeholder="Word starting with \'' + startWord.slice(-1).toUpperCase() + '\'..." maxlength="20" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
    html += '<div style="text-align:center;margin-top:var(--space-2)"><span style="font-size:var(--text-sm);color:var(--text-muted)" id="word-count">1 / ' + (config.target + 1) + ' words</span></div>';

    gameArea.innerHTML = html;

    var input = document.getElementById('word-input');
    input.focus();

    document.getElementById('submit-word').addEventListener('click', function() { submitChain(config); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitChain(config);
    });

    engine.startTimer(config.time, function() { finishRound(); });
  }

  function submitChain(config) {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';

    if (!word || word.length < config.minWordLen) {
      if (word) BrainForge.showToast('Word must be ' + config.minWordLen + '+ letters', 'error');
      input.focus();
      return;
    }
    if (gameState.submittedWords.indexOf(word) !== -1) {
      BrainForge.showToast('Already used!', 'error');
      input.focus();
      return;
    }

    var requiredStart = gameState.lastWord.slice(-1);
    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    gameState.submittedWords.push(word);

    if (word[0] === requiredStart && isValidWord(word)) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.correctWords.push(word);
      gameState.lastWord = word;
      BrainForge.Audio.correct();

      input.placeholder = "Word starting with '" + word.slice(-1).toUpperCase() + "'...";
    } else {
      tag.className = 'word-tag word-tag--wrong';
      if (word[0] !== requiredStart) {
        tag.textContent = word + ' (must start with ' + requiredStart.toUpperCase() + ')';
      } else {
        tag.textContent = word + ' (not in dictionary)';
      }
      BrainForge.Audio.wrong();
    }

    tags.appendChild(tag);
    input.focus();

    var count = document.getElementById('word-count');
    // -1 because start word doesn't count toward target
    var chainLen = gameState.correctWords.length - 1;
    if (count) count.textContent = (chainLen + 1) + ' / ' + (config.target + 1) + ' words';

    engine.updateScore(Math.min(100, (chainLen / config.target) * 100));

    if (chainLen >= config.target) {
      engine.stopTimer();
      setTimeout(finishRound, 500);
    }
  }

  // --- Mixed Mode ---
  function setupMixedRound() {
    var phase = gameState.phase;
    if (phase < 3) {
      // 3 anagrams
      var len = pickRandom([5, 6, 7]);
      var wordList = WORDS[len] || WORDS[5];
      var word = pickRandom(wordList);
      gameState.targetWord = word.toLowerCase();
      gameState.scrambled = scrambleWord(word).toUpperCase();
      gameState.submittedWords = [];

      var html = '<div class="game-status" id="game-status">Round ' + (phase + 1) + '/8 — Unscramble</div>';
      html += '<div class="scrambled-letters">';
      for (var i = 0; i < gameState.scrambled.length; i++) {
        html += '<div class="scrambled-letter">' + gameState.scrambled[i] + '</div>';
      }
      html += '</div>';
      html += '<div class="input-area"><input type="text" id="word-input" placeholder="Type your answer..." maxlength="12" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
      html += '<div class="word-tags" id="word-tags"></div>';

      gameArea.innerHTML = html;

      var input = document.getElementById('word-input');
      input.focus();

      document.getElementById('submit-word').addEventListener('click', submitMixedAnagram);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitMixedAnagram(); });

      engine.startTimer(15, function() {
        gameState.phase++;
        if (gameState.phase < 8) setupMixedRound();
        else finishRound();
      });

    } else {
      // 5 category words
      var catNames = ['animals', 'foods', 'fruits', 'sports', 'countries'];
      var cat = pickRandom(catNames);
      gameState.category = cat;
      gameState.submittedWords = [];

      var remaining = 8 - phase;
      var label = cat.charAt(0).toUpperCase() + cat.slice(1);
      var html = '<div class="game-status" id="game-status">Round ' + (phase + 1) + '/8 — Name a ' + label.slice(0, -1) + '</div>';
      html += '<div class="problem-display"><div class="problem-text" style="font-family:var(--font-sans)">' + label + '</div></div>';
      html += '<div class="input-area"><input type="text" id="word-input" placeholder="Type a word..." maxlength="20" autocomplete="off" autocapitalize="off"><button class="btn btn--primary" id="submit-word">Submit</button></div>';
      html += '<div class="word-tags" id="word-tags"></div>';

      gameArea.innerHTML = html;

      var input = document.getElementById('word-input');
      input.focus();

      document.getElementById('submit-word').addEventListener('click', submitMixedCategory);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitMixedCategory(); });

      engine.startTimer(8, function() {
        gameState.phase++;
        if (gameState.phase < 8) setupMixedRound();
        else finishRound();
      });
    }
  }

  function submitMixedAnagram() {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';
    input.focus();

    if (!word) return;

    var sortedInput = word.split('').sort().join('');
    var sortedTarget = gameState.targetWord.split('').sort().join('');

    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    if (sortedInput === sortedTarget && isValidWord(word)) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.roundsCompleted++;
      BrainForge.Audio.correct();
      engine.stopTimer();
      engine.updateScore((gameState.roundsCompleted / 8) * 100);
      gameState.phase++;
      setTimeout(function() {
        if (gameState.phase < 8) setupMixedRound();
        else finishRound();
      }, 500);
    } else {
      tag.className = 'word-tag word-tag--wrong';
      tag.textContent = word;
      BrainForge.Audio.wrong();
    }

    tags.appendChild(tag);
  }

  function submitMixedCategory() {
    var input = document.getElementById('word-input');
    var word = input.value.trim().toLowerCase();
    input.value = '';
    input.focus();

    if (!word) return;

    var tags = document.getElementById('word-tags');
    var tag = document.createElement('span');

    var catWords = CATEGORIES[gameState.category] || [];
    if (catWords.indexOf(word) !== -1 && gameState.submittedWords.indexOf(word) === -1) {
      tag.className = 'word-tag word-tag--correct';
      tag.textContent = word;
      gameState.submittedWords.push(word);
      gameState.roundsCompleted++;
      BrainForge.Audio.correct();
      engine.stopTimer();
      engine.updateScore((gameState.roundsCompleted / 8) * 100);
      gameState.phase++;
      setTimeout(function() {
        if (gameState.phase < 8) setupMixedRound();
        else finishRound();
      }, 500);
    } else {
      tag.className = 'word-tag word-tag--wrong';
      tag.textContent = word;
      BrainForge.Audio.wrong();
      tags.appendChild(tag);
    }
  }

  // --- Finish ---
  function finishRound() {
    engine.stopTimer();

    var config = gameState.config;
    var score;

    if (config.mode === 'mixed') {
      score = (gameState.roundsCompleted / 8) * 100;
    } else if (config.mode === 'chain') {
      var chainLen = gameState.correctWords.length - 1;
      score = Math.min(100, (chainLen / config.target) * 100);
    } else if (config.mode === 'double_anagram') {
      score = Math.min(100, (gameState.correctWords.length / 2) * 100);
    } else {
      score = Math.min(100, (gameState.correctWords.length / config.target) * 100);
    }

    engine.completeLevel(score);
  }

  // --- Initialize ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
