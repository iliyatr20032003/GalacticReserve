const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType, Phase } = require('../js/buckshotCore');

const state = new GameState({
  phase: Phase.MAIN,
  players: [{hp:1,hpMax:1}, {hp:1,hpMax:1}],
  shotgun: new Shotgun()
});
state.shotgun.magazine = [new Shell(ShellType.BLANK), new Shell(ShellType.BLANK)];

state.takeTurn(state.players[state.turn]);
assert.strictEqual(state.turn, 1);
assert.strictEqual(state.shotgun.magazine.length, 1);
assert.strictEqual(state.phase, Phase.MAIN);

state.takeTurn(state.players[state.turn]);
assert.strictEqual(state.turn, 0);
assert.strictEqual(state.shotgun.magazine.length, 0);
assert.strictEqual(state.phase, Phase.ITEMS);
console.log('Step 7: takeTurn basic test passed');
