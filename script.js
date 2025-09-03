let worker = null;
let timerInterval = null;
let timeRemaining = 0;

function startGame() {
    if (worker) worker.terminate();
    document.getElementById("cards").innerHTML = "Dealing cards...";
    document.getElementById("probabilities").innerHTML = "";
    document.getElementById("startBtn").disabled = true;
    document.getElementById("submitBtn").disabled = false;
    document.getElementById("nextBtn").disabled = false;

    worker = new Worker("worker.js");
    worker.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === "probabilities") {
            document.getElementById("probabilities").innerHTML =
                Object.entries(data).map(([hand, prob]) =>
                    `<p>${hand}: ${prob.toFixed(4)}</p>` // decimals instead of %
                ).join("");
        }
        if (type === "cards") {
            document.getElementById("cards").innerHTML =
                "Your Cards: " + data.player.join(" ") + "<br>" +
                "Board: " + data.community.join(" ");
        }
    };

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
    document.getElementById("submitBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;

    document.querySelectorAll(".guess-input").forEach(input => input.value = "");
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
    document.getElementById("submitBtn").disabled = true;
    document.getElementById("nextBtn").disabled = true;

    document.querySelectorAll(".guess-input").forEach(input => input.value = "");
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.getElementById("exitBtn").addEventListener("click", exitGame);
