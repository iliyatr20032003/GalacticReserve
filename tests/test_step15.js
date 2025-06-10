const assert = require('assert');
const { GameState, Shotgun, Phase, Remote, Jammer } = require('../js/buckshotCore');

// Remote reverses turn order
let state = new GameState({
  phase: Phase.MAIN,
  players: [{},{},{},{}],
  shotgun: new Shotgun(),
  turnOrder: [0,1,2,3]
});
new Remote().apply(state, state.players[0]);
assert.deepStrictEqual(state.turnOrder, [0,3,2,1]);
state.nextPlayer();
assert.strictEqual(state.turn, 3);

// Jammer skips targeted player once
state = new GameState({
  phase: Phase.MAIN,
  players: [{flags:{}},{flags:{}},{flags:{}},{flags:{}}],
  shotgun: new Shotgun(),
  turnOrder: [0,1,2,3]
});
new Jammer(2).apply(state, state.players[0]);
state.nextPlayer(); // to player 1
state.nextPlayer(); // should skip player 2
assert.strictEqual(state.turn, 3);

console.log('Step 15: Remote and Jammer test passed');
