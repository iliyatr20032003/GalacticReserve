const assert = require('assert');
const { GameState, setRoundHp } = require('../js/buckshotCore');

const rng = () => 0.8; // deterministic -> hpMax = 4
const state = new GameState({ players: [{}, {}] });
const hpMax = setRoundHp(state, rng);
assert.strictEqual(hpMax, state.players[0].hp);
assert.strictEqual(hpMax, state.players[0].hpMax);
assert.strictEqual(hpMax, state.players[1].hp);
assert.strictEqual(hpMax, state.players[1].hpMax);
console.log('Step 5: setRoundHp test passed');
