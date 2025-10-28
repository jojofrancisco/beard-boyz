// Beard Boyz game

const NAMES = ["Abed", "Jeff", "Jing", "Renz", "Ramil", "Hanz", "Ritchie", "Jojo"];
const DATA = [
  { name: "Abed", src: "assets/images/img1.png" },
  { name: "Jeff", src: "assets/images/img2.png" },
  { name: "Jing", src: "assets/images/img3.png" },
  { name: "Renz", src: "assets/images/img4.png" },
  { name: "Ramil", src: "assets/images/img5.png" },
  { name: "Hanz", src: "assets/images/img6.png" },
  { name: "Ritchie", src: "assets/images/img7.png" },
  { name: "Jojo", src: "assets/images/img8.png" },
];

const ROUND_TIME = 5.0; // seconds

// Elements
const $ = sel => document.querySelector(sel);
const splash = $("#splash");
const game = $("#game");
const result = $("#result");
const playBtn = $("#playBtn");
const playAgainBtn = $("#playAgain");
const photo = $("#photo");
const choices = $("#choices");
const roundNum = $("#roundNum");
const scoreNum = $("#scoreNum");
const finalScore = $("#finalScore");
const resultMessage = $("#resultMessage");
const timerPie = $("#timerPie");
const timerText = $("#timerText");
const sndCorrect = $("#sndCorrect");
const sndWrong = $("#sndWrong");
const bigX = $("#bigX");
const stage = document.querySelector(".stage");

let order = [];      // Shuffled order of indices into DATA
let index = 0;       // Current round number (0..7)
let score = 0;
let timerId = null;  // interval
let tStart = 0;      // timestamp for timer
let locked = false;  // prevents multiple taps
let loaded = false;
let preloadPromise = null;

// Preload images
function preloadImages() {
  const promises = DATA.map(item => new Promise(res => {
    const img = new Image();
    img.src = item.src;
    img.onload = res;
    img.onerror = res; // allow continue even if missing
  }));
  return Promise.all(promises);
}

function ensureAssets() {
  if (loaded) return Promise.resolve();
  if (!preloadPromise) {
    preloadPromise = preloadImages().finally(() => {
      loaded = true;
    });
  }
  return preloadPromise;
}

function showScreen(el) {
  [splash, game, result].forEach(s => {
    s.classList.add("hidden");
    s.classList.remove("active");
  });
  el.classList.remove("hidden");
  el.classList.add("active");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build the bottom fixed set of 8 name buttons
function buildChoices() {
  choices.innerHTML = "";
  NAMES.forEach(n => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = n;
    btn.addEventListener("click", () => onChoice(n, btn));
    choices.appendChild(btn);
  });
}

function shuffleChoiceButtons() {
  const buttons = Array.from(choices.children);
  shuffle(buttons);
  buttons.forEach(btn => choices.appendChild(btn));
}

async function startGame() {
  await ensureAssets();
  order = shuffle([...DATA.keys()]);
  index = 0;
  score = 0;
  scoreNum.textContent = "0";
  buildChoices();
  showScreen(game);
  nextRound();
}

function nextRound() {
  if (index >= DATA.length) {
    endGame();
    return;
  }
  const item = DATA[order[index]];
  roundNum.textContent = (index + 1).toString();
  photo.src = item.src;
  resetTimer();
  locked = false;
  clearFX();
  shuffleChoiceButtons();
  // Reset button styles
  document.querySelectorAll(".choice").forEach(b => {
    b.classList.remove("correct", "wrong");
    b.disabled = false;
  });
}

function endGame() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  locked = true;
  finalScore.textContent = score.toString();
  finalScore.classList.toggle("score-low", score <= 4);
  if (score <= 4) {
    resultMessage.textContent = "Ang baba ng score, magpa-papaitan ka!";
  } else if (score <= 7) {
    resultMessage.textContent = "Nice!";
  } else {
    resultMessage.textContent = "Ayos! Magpapa-Paitan si boss Ramil!";
  }
  clearFX();
  showScreen(result);
}

function resetTimer() {
  if (timerId) clearInterval(timerId);
  const totalMs = ROUND_TIME * 1000;
  tStart = performance.now();
  timerText.textContent = Math.ceil(ROUND_TIME).toString();
  setPie(1);
  timerId = setInterval(() => {
    const elapsed = performance.now() - tStart;
    const remain = Math.max(0, totalMs - elapsed);
    const frac = remain / totalMs;
    setPie(frac);
    timerText.textContent = Math.max(0, Math.ceil(remain / 1000)).toString();
    if (remain <= 0) {
      clearInterval(timerId);
      timerId = null;
      timeUp();
    }
  }, 80);
}

function setPie(frac) {
  const deg = 360 * frac;
  timerPie.style.background = `conic-gradient(#3b82f6 ${deg}deg, #1f2937 ${deg}deg)`;
}

function timeUp() {
  if (locked) return;
  locked = true;
  markWrong(null);
  setTimeout(() => { index++; nextRound(); }, 800);
}

function onChoice(name, button) {
  if (locked) return;
  locked = true;
  const correct = DATA[order[index]].name;
  clearInterval(timerId); timerId = null;
  if (name === correct) {
    score++;
    scoreNum.textContent = score.toString();
    button.classList.add("correct");
    playSound(sndCorrect);
    stage?.classList.remove("flash-red");
    stage?.classList.add("flash-green");
    photo.classList.remove("flash-red");
    photo.classList.add("flash-green");
    setTimeout(() => { index++; nextRound(); }, 900);
  } else {
    button.classList.add("wrong");
    markWrong(button);
    setTimeout(() => { index++; nextRound(); }, 900);
  }
}

function markWrong(button) {
  playSound(sndWrong);
  // Big X overlay
  bigX.classList.remove("hidden");
  stage?.classList.remove("flash-green");
  stage?.classList.add("flash-red");
  photo.classList.remove("flash-green");
  photo.classList.add("flash-red");
  setTimeout(() => bigX.classList.add("hidden"), 650);
}

function playSound(audioEl) {
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) { /* autoplay restrictions */ }
}

function clearFX() {
  bigX.classList.add("hidden");
  stage?.classList.remove("flash-green", "flash-red");
  photo.classList.remove("flash-green", "flash-red");
}

async function init() {
  // Build static choices once
  buildChoices();
  // Prepare assets
  await ensureAssets();
}

playBtn.addEventListener("click", () => {
  if (playBtn.disabled) return;
  playBtn.disabled = true;
  playBtn.textContent = loaded ? "Play" : "Loading...";
  startGame().finally(() => {
    playBtn.disabled = false;
    playBtn.textContent = "Play";
  });
});
playAgainBtn.addEventListener("click", startGame);

// Kick off
init();
