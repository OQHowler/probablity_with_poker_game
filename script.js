let worker = null;
let timerInterval = null;
let timeRemaining = 0;

function startGame() {
    if (worker) worker.terminate(); // cleanup before start
    document.getElementById("cards").innerHTML = "Dealing cards...";
    document.getElementById("probabilities").innerHTML = "";
    document.getElementById("startBtn").disabled = true;

    // Setup worker
    worker = new Worker("worker.js");
    worker.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === "probabilities") {
            document.getElementById("probabilities").innerHTML =
                Object.entries(data).map(([hand, prob]) =>
                    `<p>${hand}: ${(prob * 100).toFixed(2)}%</p>`
                ).join("");
        }
        if (type === "cards") {
            document.getElementById("cards").innerHTML =
                "Your Cards: " + data.player.join(" ") + "<br>" +
                "Community: " + data.community.join(" ");
        }
    };

    // Simulated time ~5 seconds
    timeRemaining = 5;
    document.getElementById("timer").innerHTML =
        `Calculating... ${timeRemaining}s`;
    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining > 0) {
            document.getElementById("timer").innerHTML =
                `Calculating... ${timeRemaining}s`;
        } else {
            clearInterval(timerInterval);
            document.getElementById("timer").innerHTML =
                "Calculation complete!";
        }
    }, 1000);

    // Tell worker to start
    worker.postMessage({ type: "start" });
}

function resetGame() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    clearInterval(timerInterval);
    document.getElementById("cards").innerHTML = "";
    document.getElementById("probabilities").innerHTML = "";
    document.getElementById("timer").innerHTML = "";
    document.getElementById("startBtn").disabled = false;
}

function exitGame() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    clearInterval(timerInterval);
    document.getElementById("cards").innerHTML = "Game exited.";
    document.getElementById("probabilities").innerHTML = "";
    document.getElementById("timer").innerHTML = "";
    document.getElementById("startBtn").disabled = false;
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("exitBtn").addEventListener("click", exitGame);
