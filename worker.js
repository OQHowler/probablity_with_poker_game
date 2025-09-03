// worker.js
// Monte Carlo Poker Probability Calculator

// ----- Card Utilities -----
const suits = ["♠", "♥", "♦", "♣"];
const ranks = [
  "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"
];

// Generate a full 52-card deck
function generateDeck() {
  const deck = [];
  for (let r of ranks) {
    for (let s of suits) {
      deck.push(r + s);
    }
  }
  return deck;
}

// Shuffle an array in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Rank evaluation helpers
function rankValue(rank) {
  return ranks.indexOf(rank);
}

// Count occurrences
function countRanks(hand) {
  const counts = {};
  for (let c of hand) {
    const r = c[0];
    counts[r] = (counts[r] || 0) + 1;
  }
  return counts;
}

// Check flush
function isFlush(hand) {
  const suit = hand[0][1];
  return hand.every(c => c[1] === suit);
}

// Check straight
function isStraight(hand) {
  const values = hand.map(c => rankValue(c[0])).sort((a, b) => a - b);
  // Handle wheel straight (A-2-3-4-5)
  const wheel = [0, 1, 2, 3, 12];
  if (wheel.every(v => values.includes(v))) return true;

  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] !== values[i] + 1) return false;
  }
  return true;
}

// Evaluate 7-card hand → best category
function evaluateHand(cards) {
  // Generate all 5-card combos from 7
  function* combinations(arr, k) {
    if (k === 0) yield [];
    else {
      for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(i + 1);
        for (const combo of combinations(rest, k - 1)) {
          yield [arr[i], ...combo];
        }
      }
    }
  }

  let bestRank = -1; // -1 means high card
  for (const combo of combinations(cards, 5)) {
    const counts = Object.values(countRanks(combo)).sort((a, b) => b - a);
    const flush = isFlush(combo);
    const straight = isStraight(combo);

    if (straight && flush) {
      const values = combo.map(c => rankValue(c[0]));
      if (Math.min(...values) >= 8) {
        bestRank = Math.max(bestRank, 9); // Royal Flush
      } else {
        bestRank = Math.max(bestRank, 8); // Straight Flush
      }
    } else if (counts[0] === 4) {
      bestRank = Math.max(bestRank, 7); // Four of a Kind
    } else if (counts[0] === 3 && counts[1] >= 2) {
      bestRank = Math.max(bestRank, 6); // Full House
    } else if (flush) {
      bestRank = Math.max(bestRank, 5); // Flush
    } else if (straight) {
      bestRank = Math.max(bestRank, 4); // Straight
    } else if (counts[0] === 3) {
      bestRank = Math.max(bestRank, 3); // Three of a Kind
    } else if (counts[0] === 2 && counts[1] === 2) {
      bestRank = Math.max(bestRank, 2); // Two Pair
    } else if (counts[0] === 2) {
      bestRank = Math.max(bestRank, 1); // One Pair
    } else {
      bestRank = Math.max(bestRank, 0); // High Card
    }
  }
  return bestRank;
}

// ----- Simulation Engine -----
self.onmessage = function (e) {
  if (e.data.type === "start") {
    const { playerCards, boardCards, iterations } = e.data;

    const categories = {
      pair: 0,
      twoPair: 0,
      threeKind: 0,
      straight: 0,
      flush: 0,
      fullHouse: 0,
      fourKind: 0,
      straightFlush: 0,
      royalFlush: 0
    };

    for (let i = 0; i < iterations; i++) {
      let deck = generateDeck();

      // Remove known cards
      const used = [...playerCards, ...boardCards];
      deck = deck.filter(c => !used.includes(c));

      shuffle(deck);

      // Complete board to 5 cards
      const needed = 5 - boardCards.length;
      const simBoard = [...boardCards, ...deck.slice(0, needed)];

      // Full 7-card hand
      const fullHand = [...playerCards, ...simBoard];
      const result = evaluateHand(fullHand);

      switch (result) {
        case 1: categories.pair++; break;
        case 2: categories.twoPair++; break;
        case 3: categories.threeKind++; break;
        case 4: categories.straight++; break;
        case 5: categories.flush++; break;
        case 6: categories.fullHouse++; break;
        case 7: categories.fourKind++; break;
        case 8: categories.straightFlush++; break;
        case 9: categories.royalFlush++; break;
        default: break; // high card ignored
      }
    }

    // Normalize results to probabilities
    const probs = {};
    for (let k in categories) {
      probs[k] = categories[k] / iterations;
    }

    self.postMessage({ type: "done", probabilities: probs });
  }
};
