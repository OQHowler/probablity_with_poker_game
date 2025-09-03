// script.js
let worker = null;
let playerCards = [];
let boardCards = [];
let gameActive = false;

// ---- UI Elements ----
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const exitBtn = document.getElementById("exit-btn");
const submitBtn = document.getElementById("submit-btn");
const playerDiv = document.getElementById("player-cards");
const boardDiv = document.getElementById("board-cards");
const guessesDiv = document.getElementById("probabilities");

// ---- Event Listeners ----
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
exitBtn.addEventListener("click", exitGame);
submitBtn.addEventListener("click", checkGuesses);

// ---- Game Functions ----
function startGame() {
  if (gameActive) return;
  gameActive = true;

  // Reset state
  playerCards = [];
  boardCards = [];
  playerDiv.textContent = "";
  boardDiv.textContent = "";
  clearActuals();

  // Build deck
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
  const deck = [];
  for (let r of ranks) for (let s of suits) deck.push(r+s);

  shuffle(deck);

  // Deal 2 hole cards + flop (3)
  playerCards = [deck.pop(), deck.pop()];
  boardCards = [deck.pop(), deck.pop(), deck.pop()];

  playerDiv.textContent = "Player: " + playerCards.join(" ");
  boardDiv.textContent = "Board: " + boardCards.join(" ");

  // Launch worker
  runWorker();
}

function resetGame() {
  if (!gameActive) return;
  playerCards = [];
  boardCards = [];
  playerDiv.textContent = "";
  boardDiv.textContent = "";
  clearActuals();
  gameActive = false;
}

function exitGame() {
  resetGame();
  disableInputs(true);
}

function disableInputs(disable) {
  const inputs = guessesDiv.querySelectorAll("input");
  inputs.forEach(inp => inp.disabled = disable);
  submitBtn.disabled = disable;
}

function clearActuals() {
  const spans = guessesDiv.querySelectorAll("span");
  spans.forEach(s => s.textContent = "");
  disableInputs(false);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ---- Worker Communication ----
function runWorker() {
  if (worker) worker.terminate();
  worker = new Worker("worker.js");

  worker.onmessage = function(e) {
    if (e.data.type === "done") {
      const probs = e.data.probabilities;

      document.getElementById("actual-pair").textContent = ` | Actual: ${probs.pair.toFixed(4)}`;
      document.getElementById("actual-two-pair").textContent = ` | Actual: ${probs.twoPair.toFixed(4)}`;
      document.getElementById("actual-three-kind").textContent = ` | Actual: ${probs.threeKind.toFixed(4)}`;
      document.getElementById("actual-straight").textContent = ` | Actual: ${probs.straight.toFixed(4)}`;
      document.getElementById("actual-flush").textContent = ` | Actual: ${probs.flush.toFixed(4)}`;
      document.getElementById("actual-full-house").textContent = ` | Actual: ${probs.fullHouse.toFixed(4)}`;
      document.getElementById("actual-four-kind").textContent = ` | Actual: ${probs.fourKind.toFixed(4)}`;
      document.getElementById("actual-straight-flush").textContent = ` | Actual: ${probs.straightFlush.toFixed(4)}`;
      document.getElementById("actual-royal-flush").textContent = ` | Actual: ${probs.royalFlush.toFixed(4)}`;
    }
  };

  worker.postMessage({
    type: "start",
    playerCards: playerCards,
    boardCards: boardCards,
    iterations: 10000  // adjust for speed vs accuracy
  });
}

// ---- Checking Guesses ----
function checkGuesses() {
  const guessMap = {
    pair: document.getElementById("guess-pair").value,
    twoPair: document.getElementById("guess-two-pair").value,
    threeKind: document.getElementById("guess-three-kind").value,
    straight: document.getElementById("guess-straight").value,
    flush: document.getElementById("guess-flush").value,
    fullHouse: document.getElementById("guess-full-house").value,
    fourKind: document.getElementById("guess-four-kind").value,
    straightFlush: document.getElementById("guess-straight-flush").value,
    royalFlush: document.getElementById("guess-royal-flush").value
  };

  // Simple feedback
  for (const [key, val] of Object.entries(guessMap)) {
    if (val) {
      document.getElementById("actual-" + key).textContent += ` | Your Guess: ${parseFloat(val).toFixed(4)}`;
    }
  }
}
