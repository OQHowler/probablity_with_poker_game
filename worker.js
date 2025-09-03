// ========== Worker.js ==========
// Runs heavy probability calculations off the main thread

// Hand ranks (excluding High Card)
const handRanks = [
  "Pair", "Two Pair", "Three of a Kind", "Straight",
  "Flush", "Full House", "Four of a Kind",
  "Straight Flush", "Royal Flush"
];

// ===== Deck utils =====
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
let rankValues = {};
ranks.forEach((r, i) => rankValues[r] = i + 2);

function buildDeck() {
  let d = [];
  for (let r of ranks) {
    for (let s of suits) {
      d.push({rank: r, suit: s});
    }
  }
  return d;
}

// ===== Poker Hand Evaluator =====
function evaluateHand(cards) {
  // cards: array of 7 (2 player + up to 5 board)
  // returns best rank name

  // Count occurrences
  let counts = {};
  let suitsMap = {};
  cards.forEach(c => {
    counts[c.rank] = (counts[c.rank]||0) + 1;
    suitsMap[c.suit] = (suitsMap[c.suit]||0) + 1;
  });

  let values = cards.map(c => rankValues[c.rank]).sort((a,b) => a-b);

  // Flush
  let flushSuit = Object.keys(suitsMap).find(s => suitsMap[s] >= 5);
  let flushCards = flushSuit ? cards.filter(c=>c.suit===flushSuit) : [];

  // Straight
  function isStraight(vals) {
    let uniq = [...new Set(vals)];
    if (uniq.includes(14)) uniq.unshift(1); // Ace low
    uniq.sort((a,b)=>a-b);
    let maxRun = 1, run = 1;
    for (let i=1;i<uniq.length;i++){
      if (uniq[i] === uniq[i-1]+1) {
        run++;
        maxRun = Math.max(maxRun, run);
        if (maxRun>=5) return true;
      } else run=1;
    }
    return false;
  }

  // Straight Flush / Royal
  if (flushCards.length >= 5) {
    let flushVals = flushCards.map(c => rankValues[c.rank]);
    if (isStraight(flushVals)) {
      if (flushVals.includes(14) && flushVals.includes(13) &&
          flushVals.includes(12) && flushVals.includes(11) && flushVals.includes(10)) {
        return "Royal Flush";
      }
      return "Straight Flush";
    }
  }

  // Four / Full house / Trips / Pairs
  let freq = Object.values(counts).sort((a,b)=>b-a);
  if (freq[0]===4) return "Four of a Kind";
  if (freq[0]===3 && freq[1]>=2) return "Full House";
  if (flushCards.length >= 5) return "Flush";
  if (isStraight(values)) return "Straight";
  if (freq[0]===3) return "Three of a Kind";
  if (freq[0]===2 && freq[1]===2) return "Two Pair";
  if (freq[0]===2) return "Pair";

  return "High Card";
}

// ===== Main Probability Calculation =====
function computeProbabilities(playerCards, board) {
  let deck = buildDeck();

  // Remove used cards
  let used = [...playerCards, ...board];
  deck = deck.filter(card =>
    !used.some(u => u.rank===card.rank && u.suit===card.suit)
  );

  let results = [{}, {}, {}]; // for preflop, flop, turn
  handRanks.forEach(r => {
    results[0][r] = 0;
    results[1][r] = 0;
    results[2][r] = 0;
  });

  let totalCombos = [0,0,0];

  // Stage 0 (preflop): complete all 5 community cards
  let needed0 = 5;
  totalCombos[0] = nCr(deck.length, needed0);

  // Stage 1 (flop done): need 2 more
  let needed1 = 5 - 3;
  totalCombos[1] = nCr(deck.length, needed1);

  // Stage 2 (turn done): need 1 more
  let needed2 = 5 - 4;
  totalCombos[2] = nCr(deck.length, needed2);

  let progressCount = 0;
  let totalWork = totalCombos[0] + totalCombos[1] + totalCombos[2];
  let startTime = Date.now();

  // Helper: combinations generator
  function* k_combinations(arr, k) {
    let n = arr.length;
    if (k > n) return;
    let indices = Array.from({length:k}, (_,i)=>i);
    while (true) {
      yield indices.map(i => arr[i]);
      let i;
      for (i=k-1; i>=0; i--) {
        if (indices[i] !== i + n - k) break;
      }
      if (i<0) return;
      indices[i]++;
      for (let j=i+1; j<k; j++) indices[j]=indices[j-1]+1;
    }
  }

  // Process one stage
  function processStage(round, currentBoard, needed) {
    for (let combo of k_combinations(deck, needed)) {
      let fullBoard = [...currentBoard, ...combo];
      let hand = [...playerCards, ...fullBoard];
      let rank = evaluateHand(hand);
      if (rank !== "High Card") {
        results[round][rank]++;
      }
      progressCount++;
      if (progressCount % 1000 === 0) {
        let elapsed = (Date.now()-startTime)/1000;
        let progress = progressCount/totalWork;
        let eta = (elapsed/progress) - elapsed;
        postMessage({type:"progress", progress, eta});
      }
    }
  }

  // Stage 0 (preflop)
  processStage(0, [], 5);
  // Stage 1 (flop)
  if (board.length>=3) processStage(1, board.slice(0,3), 2);
  // Stage 2 (turn)
  if (board.length>=4) processStage(2, board.slice(0,4), 1);

  // Normalize
  [0,1,2].forEach(r=>{
    handRanks.forEach(h=>{
      results[r][h] = results[r][h]/totalCombos[r];
    });
  });

  return results;
}

// ===== Combination count =====
function nCr(n,r){
  if (r>n) return 0;
  if (r===0||r===n) return 1;
  let num=1,den=1;
  for (let i=0;i<r;i++){
    num*=(n-i);
    den*=(i+1);
  }
  return num/den;
}

// ===== Worker listener =====
onmessage = function(e) {
  if (e.data.type==="compute") {
    let {playerCards, board} = e.data;
    let results = computeProbabilities(playerCards, board);
    postMessage({type:"done", results});
  }
};
