const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType } = require('../js/buckshotCore');

const state = new GameState({ players: [{}, {}], shotgun: new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.LIVE)];

state.resolveRound(state.players[0]);
assert.strictEqual(state.streak, 1);
assert.strictEqual(state.shotgun.magazine.length, 0);
assert.strictEqual(state.finished, false);

state.resolveRound(state.players[0]);
state.resolveRound(state.players[0]);
assert.strictEqual(state.finished, true);
console.log('Step 11: resolveRound test passed');
