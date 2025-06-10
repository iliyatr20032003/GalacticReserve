const assert = require('assert');
const fs = require('fs');
const { GameState, Shotgun, saveState, loadState } = require('../js/buckshotCore');

const file = 'tests/tmp_state.json';
const state = new GameState({ players:[{hp:2,hpMax:2}], shotgun:new Shotgun() });
state.players[0].hp = 1;
saveState(state, file);
const loaded = loadState(file);
assert.strictEqual(JSON.stringify(loaded.toJSON()), JSON.stringify(state.toJSON()));
fs.unlinkSync(file);
console.log('Step 16: save/load CLI test passed');
