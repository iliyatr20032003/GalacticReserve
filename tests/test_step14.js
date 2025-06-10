const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType, Phase, nextPlayer } = require('../js/buckshotCore');

const state = new GameState({
  phase: Phase.MAIN,
  players: [{hp:1},{hp:1},{hp:1}],
  shotgun: new Shotgun(),
  turnOrder: [0,1,2]
});
state.shotgun.magazine = [new Shell(ShellType.BLANK), new Shell(ShellType.BLANK)];
state.takeTurn(state.players[state.turn]);
assert.strictEqual(state.turn, 1);
state.takeTurn(state.players[state.turn]);
assert.strictEqual(state.turn, 2);
state.nextPlayer();
assert.strictEqual(state.turn, 0);
console.log('Step 14: multiplayer turn order test passed');
