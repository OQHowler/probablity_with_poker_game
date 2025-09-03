let worker = null;
let gameState = {
    playerCards: [],
    boardCards: []
};
let calcInProgress = false;

// DOM elements
const startBtn = document.getElementById("startBtn");
const nextCardBtn = document.getElementById("nextCardBtn");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const exitBtn = document.getElementById("exitBtn");
const cardsDiv = document.getElementById("cards");
const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");
const probsDiv = document.getElementById("probabilities");

// Build full deck
function buildDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    let deck = [];
    for (let s of suits) for (let r of ranks) deck.push(r + s);
    return deck;
}

// Shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start Game
startBtn.addEventListener("click", () => {
    resetGame(false);

    let deck = shuffle(buildDeck());
    gameState.playerCards = deck.splice(0, 2);
    gameState.boardCards = deck.splice(0, 3);

    cardsDiv.innerHTML = `Your cards: ${gameState.playerCards.join(" ")}`;
    boardDiv.innerHTML = `Board: ${gameState.boardCards.join(" ")}`;

    statusDiv.innerHTML = "Calculating exact probabilities...";
    probsDiv.innerHTML = "";

    startWorker();

    startBtn.disabled = true;
    nextCardBtn.disabled = false;
    submitBtn.disabled = false;
});

// Next Card
nextCardBtn.addEventListener("click", () => {
    if (gameState.boardCards.length < 5) {
        let deck = buildDeck().filter(
            c => !gameState.playerCards.includes(c) && !gameState.boardCards.includes(c)
        );
        shuffle(deck);
        gameState.boardCards.push(deck[0]);
        boardDiv.innerHTML = `Board: ${gameState.boardCards.join(" ")}`;
        statusDiv.innerHTML = "Calculating exact probabilities...";
        startWorker();
    }
    if (gameState.boardCards.length === 5) {
        nextCardBtn.disabled = true;
    }
});

// Submit Guesses
submitBtn.addEventListener("click", () => {
    alert("Your guesses submitted! Wait for exact results.");
});

// Reset Game
resetBtn.addEventListener("click", () => {
    resetGame(true);
});

// Exit Game
exitBtn.addEventListener("click", () => {
    resetGame(true);
    cardsDiv.innerHTML = "Game exited.";
});

// Reset utility
function resetGame(fullClear = true) {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    gameState = { playerCards: [], boardCards: [] };
    calcInProgress = false;
    statusDiv.innerHTML = "";
    probsDiv.innerHTML = "";
    if (fullClear) {
        cardsDiv.innerHTML = "";
        boardDiv.innerHTML = "";
    }
    startBtn.disabled = false;
    nextCardBtn.disabled = true;
    submitBtn.disabled = true;
}

// Start worker
function startWorker() {
    if (calcInProgress) return;
    calcInProgress = true;

    worker = new Worker("worker.js");
    worker.postMessage({
        playerCards: gameState.playerCards,
        boardCards: gameState.boardCards
    });

    worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === "probabilities") {
            statusDiv.innerHTML = "Calculation complete!";
            probsDiv.innerHTML = Object.entries(data)
                .map(([hand, prob]) => `<p>${hand}: ${prob.toFixed(4)}</p>`)
                .join("");
            worker.terminate();
            worker = null;
            calcInProgress = false;
        }
    };
}
