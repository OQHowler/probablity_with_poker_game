let worker;
let gameActive = false;

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const exitBtn = document.getElementById("exit-btn");
  const statusEl = document.getElementById("status");
  const playerCards = document.getElementById("player-cards");
  const boardCards = document.getElementById("board-cards");

  startBtn.addEventListener("click", () => {
    gameActive = true;
    startBtn.disabled = true;
    nextBtn.disabled = false;
    submitBtn.disabled = false;
    resetBtn.disabled = false;
    exitBtn.disabled = false;

    playerCards.textContent = "Your cards: 9♥ J♥"; // placeholder
    boardCards.textContent = "Board: Q♥ 5♥ 4♠";  // placeholder

    statusEl.textContent = "Calculating exact probabilities...";

    worker = new Worker("worker.js");
    worker.postMessage({ type: "start" });

    worker.onmessage = function (e) {
      if (e.data.type === "done") {
        const probs = e.data.probabilities;
        statusEl.textContent = "Calculation complete!";

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
  });

  submitBtn.addEventListener("click", () => {
    if (!gameActive) return;
    statusEl.textContent = "Your guesses submitted!";
  });

  resetBtn.addEventListener("click", () => {
    gameActive = false;
    statusEl.textContent = "";
    playerCards.textContent = "";
    boardCards.textContent = "";

    document.querySelectorAll("#probabilities input").forEach(input => input.value = "");
    document.querySelectorAll("#probabilities span").forEach(span => span.textContent = "");

    startBtn.disabled = false;
    nextBtn.disabled = true;
    submitBtn.disabled = true;
    resetBtn.disabled = true;
    exitBtn.disabled = true;

    if (worker) {
      worker.terminate();
      worker = null;
    }
  });

  exitBtn.addEventListener("click", () => {
    resetBtn.click(); // Reset everything
    statusEl.textContent = "Exited the game.";
  });
});
