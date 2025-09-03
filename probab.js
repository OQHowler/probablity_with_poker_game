// ========== GLOBALS ==========
let playerCards = [];
let board = [];
let stage = 0; // 0 = preflop, 1 = flop, 2 = turn, 3 = river
let gameActive = false;
let worker = null;

// Hand ranks we consider (High Card excluded)
const handRanks = [
  "Pair", "Two Pair", "Three of a Kind", "Straight",
  "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush"
];

// ========== DECK FUNCTIONS ==========
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
let deck = [];

function buildDeck() {
  deck = [];
  for (let r of ranks) {
    for (let s of suits) {
      deck.push({rank: r, suit: s});
    }
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ========== GAME LOGIC ==========
function startGame() {
  buildDeck();
  shuffle(deck);
  playerCards = [deck.pop(), deck.pop()];
  board = [];
  stage = 0;
  gameActive = true;

  document.getElementById("next").disabled = false;
  document.getElementById("reset").disabled = false;
  document.getElementById("exit").disabled = false;
  document.getElementById("submit").disabled = true;
  document.getElementById("start").disabled = true;

  showCards();
  showGuessInputs(0); // preflop guesses
}

function nextCard() {
  if (!gameActive) return;

  if (stage === 0) {
    board.push(deck.pop(), deck.pop(), deck.pop()); // flop
    showGuessInputs(1);
  } else if (stage === 1) {
    board.push(deck.pop()); // turn
    showGuessInputs(2);
  } else if (stage === 2) {
    board.push(deck.pop()); // river
    document.getElementById("next").disabled = true;
    document.getElementById("submit").disabled = false;
  }
  stage++;
  showCards();
}

function resetGame() {
  document.getElementById("cards").innerHTML = "";
  document.getElementById("result").innerText = "";
  document.getElementById("guesses").innerHTML = "";
  document.getElementById("finalResults").innerHTML = "";
  document.getElementById("progress").innerText = "";
  document.querySelector(".progress-bar").style.width = "0%";

  playerCards = [];
  board = [];
  stage = 0;
  gameActive = false;

  document.getElementById("next").disabled = true;
  document.getElementById("submit").disabled = true;
  document.getElementById("reset").disabled = true;
  document.getElementById("exit").disabled = true;
  document.getElementById("start").disabled = false;
}

function exitGame() {
  resetGame();
  alert("Game exited!");
}

function showCards() {
  const cardsDiv = document.getElementById("cards");
  cardsDiv.innerHTML = `
    <p>Your cards: ${playerCards.map(c => c.rank+c.suit).join(" ")} </p>
    <p>Board: ${board.map(c => c.rank+c.suit).join(" ")} </p>
  `;
}

// ========== GUESS INPUTS ==========
function showGuessInputs(round) {
  const container = document.getElementById("guesses");
  let section = document.createElement("div");
  section.classList.add("guess-section");
  section.innerHTML = `<h3>Enter probabilities after ${round===0?"Preflop":round===1?"Flop":"Turn"}:</h3>`;

  handRanks.forEach(rank => {
    let input = document.createElement("input");
    input.type = "number";
    input.min = "0"; input.max = "100"; input.step = "0.1";
    input.id = `guess-${round}-${rank}`;
    section.innerHTML += `<label>${rank}: </label>`;
    section.appendChild(input);
    section.innerHTML += " %<br>";
  });

  container.appendChild(section);
}

// ========== RESULTS ==========
function submitGuesses() {
  document.getElementById("result").innerText = "Calculating exact probabilities...";

  // Start worker
  worker = new Worker("worker.js");
  worker.postMessage({
    type: "compute",
    playerCards,
    board
  });

  worker.onmessage = function(e) {
    if (e.data.type === "progress") {
      const { progress, eta } = e.data;
      document.getElementById("progress").innerText =
        `Progress: ${(progress*100).toFixed(1)}% | ETA: ${eta.toFixed(1)}s`;
      document.querySelector(".progress-bar").style.width = (progress*100).toFixed(1) + "%";
    } else if (e.data.type === "done") {
      document.getElementById("progress").innerText = "Calculation complete!";
      document.querySelector(".progress-bar").style.width = "100%";
      showResults(e.data.results);
      worker.terminate();
    }
  };
}

function showResults(correctResults) {
  document.getElementById("result").innerText = "Here are the final probabilities:";
  const container = document.getElementById("finalResults");
  container.innerHTML = "";

  [0,1,2].forEach(round => {
    let section = document.createElement("div");
    section.innerHTML = `<h3>${round===0?"Preflop":round===1?"Flop":"Turn"}</h3>`;
    
    handRanks.forEach(rank => {
      const guess = parseFloat(document.getElementById(`guess-${round}-${rank}`).value) || 0;
      const correct = (correctResults[round][rank] * 100).toFixed(2);
      const diff = Math.abs(guess - correct);
      const mark = diff <= 1.0 ? "✅" : "❌";
      section.innerHTML += `${rank}: You = ${guess}% | Correct = ${correct}% ${mark}<br>`;
    });

    container.appendChild(section);
  });
}

// ========== BUTTON BINDINGS ==========
document.getElementById("start").onclick = startGame;
document.getElementById("next").onclick = nextCard;
document.getElementById("reset").onclick = resetGame;
document.getElementById("exit").onclick = exitGame;
document.getElementById("submit").onclick = submitGuesses;
