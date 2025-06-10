const assert = require('assert');
const { GameState, Shotgun, setRoundHp, loadShotgun } = require('../js/buckshotCore');

function startRound(state) {
  setRoundHp(state);
  loadShotgun(state);
  state.turnOrder = [0,1];
  state.turn = 0;
}

function roundWinner(state) {
  const p1 = state.players[0];
  const p2 = state.players[1];
  if (p1.hp <= 0 && p2.hp <= 0) return null;
  if (p1.hp <= 0) return p2;
  if (p2.hp <= 0) return p1;
  if (!state.shotgun.magazine.length) return p1.hp >= p2.hp ? p1 : p2;
  return null;
}

function playGame() {
  const state = new GameState({ players: [{}, {}], shotgun: new Shotgun() });
  startRound(state);
  while (true) {
    const actor = state.players[state.turn];
    state.takeTurn(actor);
    const winner = roundWinner(state);
    if (winner) return winner === state.players[0] ? 0 : 1;
  }
}

let wins = [0, 0];
for (let i = 0; i < 10000; i++) {
  wins[playGame()]++;
}

const ratio = wins[0] / (wins[0] + wins[1]);
assert(ratio > 0.3 && ratio < 0.7);
console.log('Step 19: stress test passed');
