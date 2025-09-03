// Simple deck generator
function generateDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    let deck = [];
    for (let s of suits) {
        for (let r of ranks) {
            deck.push(r + s);
        }
    }
    return deck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Dummy probability calculator (replace with exact hand evaluator later)
function calculateProbabilities() {
    return {
        "Pair": Math.random(),
        "Two Pair": Math.random(),
        "Three of a Kind": Math.random(),
        "Straight": Math.random(),
        "Flush": Math.random(),
        "Full House": Math.random(),
        "Four of a Kind": Math.random(),
        "Straight Flush": Math.random(),
        "Royal Flush": Math.random()
    };
}

onmessage = (event) => {
    if (event.data.type === "start") {
        let deck = shuffle(generateDeck());
        let player = [deck.pop(), deck.pop()];
        let community = [deck.pop(), deck.pop(), deck.pop()];

        // Send cards to main thread
        postMessage({ type: "cards", data: { player, community } });

        // Simulate calculation delay
        setTimeout(() => {
            const probs = calculateProbabilities();
            postMessage({ type: "probabilities", data: probs });
        }, 4000);
    }
};
