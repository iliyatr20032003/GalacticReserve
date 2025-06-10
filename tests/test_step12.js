const assert = require('assert');
const { GameState, Shotgun, doubleOrNothing } = require('../js/buckshotCore');

const state = new GameState({ players: [{}, {}], shotgun: new Shotgun() });

// first win, choose to continue
state.resolveRound(state.players[0]);
doubleOrNothing(state, () => true);
assert.strictEqual(state.bank, 0);
assert.strictEqual(state.streak, 1);

// second win, take money
state.resolveRound(state.players[0]);
doubleOrNothing(state, () => false);
assert.strictEqual(state.bank, 4);
assert.strictEqual(state.streak, 0);

// losing resets bank
state.resolveRound(state.players[1]);
assert.strictEqual(state.bank, 0);
console.log('Step 12: double or nothing test passed');
