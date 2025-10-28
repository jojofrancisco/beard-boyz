// Beard Boyz - mobile-friendly image guessing game
// Replace NAMES and DATA entries with your own images/names.
// Place your 8 images in /assets/images and update the src path below.

const NAMES = ["Diego","Kenji","Luca","Raj","Omar","Noah","Ivan","Mateo"];
const DATA = [
  { name: "Diego", src: "assets/images/img1.png" },
  { name: "Kenji", src: "assets/images/img2.png" },
  { name: "Luca", src: "assets/images/img3.png" },
  { name: "Raj", src: "assets/images/img4.png" },
  { name: "Omar", src: "assets/images/img5.png" },
  { name: "Noah", src: "assets/images/img6.png" },
  { name: "Ivan", src: "assets/images/img7.png" },
  { name: "Mateo", src: "assets/images/img8.png" },
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
const timerPie = $("#timerPie");
const timerText = $("#timerText");
const sndCorrect = $("#sndCorrect");
const sndWrong = $("#sndWrong");
const fxCanvas = $("#fxCanvas");
const bigX = $("#bigX");

const ctx = fxCanvas.getContext("2d", { alpha: true });

let order = [];      // Shuffled order of indices into DATA
let index = 0;       // Current round number (0..7)
let score = 0;
let timerId = null;  // interval
let tStart = 0;      // timestamp for timer
let locked = false;  // prevents multiple taps
let loaded = false;  // assets loaded

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

function showScreen(el) {
  [splash, game, result].forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

function shuffle(arr) {
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
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

function startGame() {
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
  const item = DATA[ order[index] ];
  roundNum.textContent = (index+1).toString();
  photo.src = item.src;
  resetTimer();
  locked = false;
  clearFX();
  // Reset button styles
  document.querySelectorAll(".choice").forEach(b => {
    b.classList.remove("correct","wrong");
    b.disabled = false;
  });
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
    timerText.textContent = Math.max(0, Math.ceil(remain/1000)).toString();
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
  const correct = DATA[ order[index] ].name;
  clearInterval(timerId); timerId = null;
  if (name === correct) {
    score++;
    scoreNum.textContent = score.toString();
    button.classList.add("correct");
    playSound(sndCorrect);
    confettiBurst();
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
  setTimeout(() => bigX.classList.add("hidden"), 650);
}

function playSound(audioEl) {
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) { /* autoplay restrictions */ }
}

function clearFX() {
  ctx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
  bigX.classList.add("hidden");
}

// Confetti
let confettiParticles = [];
let rafId = null;

function resizeCanvas() {
  const rect = fxCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  fxCanvas.width = Math.round(rect.width * dpr);
  fxCanvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resizeCanvas, { passive: true });

function confettiBurst() {
  resizeCanvas();
  confettiParticles = [];
  const count = 160;
  const w = fxCanvas.width, h = fxCanvas.height;
  for (let i=0;i<count;i++) {
    confettiParticles.push({
      x: w/2 + (Math.random()-0.5)*w*0.2,
      y: h*0.2,
      vx: (Math.random()-0.5)*6,
      vy: Math.random()*-6 - 4,
      size: Math.random()*10 + 6,
      rot: Math.random()*Math.PI,
      vr: (Math.random()-0.5)*0.3,
      color: `hsl(${Math.floor(Math.random()*360)}, 85%, 60%)`,
      life: 60 + Math.random()*40
    });
  }
  if (!rafId) rafId = requestAnimationFrame(tickConfetti);
}

function tickConfetti() {
  ctx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
  const g = 0.35;
  confettiParticles.forEach(p => {
    p.vy += g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
    ctx.restore();
  });
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < fxCanvas.height+40);
  if (confettiParticles.length) {
    rafId = requestAnimationFrame(tickConfetti);
  } else {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

async function init() {
  // Build static choices once
  buildChoices();
  // Prepare assets
  await preloadImages();
  loaded = true;
}

playBtn.addEventListener("click", () => {
  if (!loaded) {
    // quick guard if user taps immediately
    preloadImages().then(() => startGame());
  } else {
    startGame();
  }
});
playAgainBtn.addEventListener("click", startGame);

// Ensure canvas sized when entering game
const observer = new MutationObserver(() => {
  if (!game.classList.contains("hidden")) resizeCanvas();
});
observer.observe(game, { attributes:true, attributeFilter:["class"] });

// Kick off
init();
