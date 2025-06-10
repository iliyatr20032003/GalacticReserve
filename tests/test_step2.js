const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType, Phase } = require('../js/buckshotCore');

// Build initial state
const shotgun = new Shotgun();
shotgun.magazine.push(new Shell(ShellType.LIVE));
shotgun.magazine.push(new Shell(ShellType.BLANK));
const state = new GameState({
  phase: Phase.LOAD,
  round: 2,
  turn: 1,
  players: ['Alice', 'Bob'],
  shotgun,
  rng: 42,
  streak: 3,
  finished: false
});

const json = JSON.stringify(state.toJSON());
const restored = GameState.fromJSON(JSON.parse(json));

assert.deepStrictEqual(restored, state);
console.log('Step 2: GameState serialization test passed');
