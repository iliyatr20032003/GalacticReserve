const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType,
  Adrenaline, Burner, Inverter, ExpiredMedicine } = require('../js/buckshotCore');

// Adrenaline steals item and applies it
let state = new GameState({ players: [{hp:1,hpMax:2, items:[new Adrenaline()]}, {items:[new Burner()], hp:1,hpMax:2}] });
const player = state.players[0];
const opponent = state.players[1];
player.items[0].apply(state, player);
assert.strictEqual(opponent.items.length, 0);
assert.strictEqual(player.items.length, 2);
assert.ok(player.burnerUsed);

// Inverter flips current shell
state = new GameState({ players:[{}], shotgun:new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.LIVE)];
new Inverter().apply(state, state.players[0]);
assert.strictEqual(state.shotgun.magazine[0].type, ShellType.BLANK);

// Burner reveals last shell
state = new GameState({ players:[{}], shotgun:new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.BLANK), new Shell(ShellType.LIVE)];
new Burner().apply(state, state.players[0]);
assert.strictEqual(state.players[0].peeked, ShellType.LIVE);

// Expired medicine random effect
let rngVals = [0.3, 0.7];
state = new GameState({ players:[{hp:1,hpMax:3}], rng: () => rngVals.shift() });
new ExpiredMedicine().apply(state, state.players[0]);
assert.strictEqual(state.players[0].hp, 3);
new ExpiredMedicine().apply(state, state.players[0]);
assert.strictEqual(state.players[0].hp, 2);
console.log('Step 13: DoN items test passed');
