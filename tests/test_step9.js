const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType, dealerChooseTarget } = require('../js/buckshotCore');

let state = new GameState({ players: [{name:'P'}, {name:'D'}], shotgun: new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.LIVE)];
let target = dealerChooseTarget(state);
assert.strictEqual(target, state.players[0]);

state = new GameState({ players: [{name:'P'}, {name:'D'}], shotgun: new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.BLANK)];
target = dealerChooseTarget(state);
assert.strictEqual(target, state.players[1]);

console.log('Step 9: dealerChooseTarget test passed');
