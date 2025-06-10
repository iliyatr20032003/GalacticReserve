const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType,
  CigarettePack, MagnifyingGlass, Beer, Handcuffs, Handsaw, useItems } = require('../js/buckshotCore');

const state = new GameState({ shotgun: new Shotgun() });
state.shotgun.magazine = [new Shell(ShellType.LIVE)];
const player = { hp:1, hpMax:2, items: [] };

player.items = [new CigarettePack()];
useItems(state, player);
assert.strictEqual(player.hp, 2);

player.items = [new MagnifyingGlass()];
useItems(state, player);
assert.strictEqual(player.lastRevealed, ShellType.LIVE);

player.hp = 1;
player.hpMax = 3;
player.items = [new Beer()];
useItems(state, player);
assert.strictEqual(player.hp, 2);

player.items = [new Handcuffs()];
useItems(state, player);
assert.ok(player.cuffed);

player.items = [new Handsaw()];
useItems(state, player);
assert.ok(!player.cuffed);
assert.strictEqual(player.hp, 1);

console.log('Step 8: item effects test passed');
