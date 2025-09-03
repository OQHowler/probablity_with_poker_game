// worker.js - Poker probability calculator using Monte Carlo simulation

// Suits and ranks
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

// Build full deck
function buildDeck() {
    let deck = [];
    for (let s of suits) {
        for (let r of ranks) {
            deck.push(r + s);
        }
    }
    return deck;
}

// Shuffle utility
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Hand rank evaluator (simplified but works for simulation)
function evaluateHand(cards) {
    // Count ranks & suits
    let rankCounts = {};
    let suitCounts = {};
    let rankValues = [];

    for (let card of cards) {
        let rank = card[0];
        let suit = card[1];
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        rankValues.push(ranks.indexOf(rank));
    }

    rankValues.sort((a, b) => a - b);

    // Detect flush
    let flush = Object.values(suitCounts).some(c => c >= 5);

    // Detect straight
    let straight = false;
    let uniqueRanks = [...new Set(rankValues)];
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
        if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) straight = true;
    }
    // Special A-2-3-4-5 straight
    if (uniqueRanks.includes(12) && uniqueRanks.includes(0) &&
        uniqueRanks.includes(1) && uniqueRanks.includes(2) && uniqueRanks.includes(3)) {
        straight = true;
    }

    let counts = Object.values(rankCounts).sort((a, b) => b - a);

    if (straight && flush) return "Straight Flush";
    if (counts[0] === 4) return "Four of a Kind";
    if (counts[0] === 3 && counts[1] >= 2) return "Full House";
    if (flush) return "Flush";
    if (straight) return "Straight";
    if (counts[0] === 3) return "Three of a Kind";
    if (counts[0] === 2 && counts[1] === 2) return "Two Pair";
    if (counts[0] === 2) return "Pair";
    return "High Card"; // we’ll exclude later
}

// Monte Carlo simulation
function simulateProbabilities(playerCards, boardCards, iterations = 5000) {
    let outcomes = {
        "Pair": 0,
        "Two Pair": 0,
        "Three of a Kind": 0,
        "Straight": 0,
        "Flush": 0,
        "Full House": 0,
        "Four of a Kind": 0,
        "Straight Flush": 0,
        "Royal Flush": 0
    };

    let deck = buildDeck();
    // Remove used cards
    for (let card of [...playerCards, ...boardCards]) {
        deck = deck.filter(c => c !== card);
    }

    for (let i = 0; i < iterations; i++) {
        let simDeck = shuffle([...deck]);
        let needed = 5 - boardCards.length;
        let simBoard = [...boardCards, ...simDeck.slice(0, needed)];
        let allCards = [...playerCards, ...simBoard];

        let rank = evaluateHand(allCards);

        if (rank === "Straight Flush") {
            // Check for Royal Flush
            let ranksOnly = allCards.map(c => c[0]);
            if (["T", "J", "Q", "K", "A"].every(r => ranksOnly.includes(r))) {
                outcomes["Royal Flush"]++;
            } else {
                outcomes["Straight Flush"]++;
            }
        } else if (rank !== "High Card") {
            outcomes[rank]++;
        }
    }

    // Normalize to decimal probabilities
    for (let key in outcomes) {
        outcomes[key] = outcomes[key] / iterations;
    }

    return outcomes;
}

// Handle messages from main thread
onmessage = function (e) {
    const { playerCards, boardCards } = e.data;

    // Run simulation
    const results = simulateProbabilities(playerCards, boardCards, 3000); // adjustable iterations

    postMessage({ type: "probabilities", data: results });
};
