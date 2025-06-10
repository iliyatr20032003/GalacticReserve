const assert = require('assert');
const { GameState, Shotgun, Shell, ShellType,
  Handcuffs, Adrenaline, MagnifyingGlass, Burner, Inverter, Beer, Handsaw,
  dealerUseItems } = require('../js/buckshotCore');

const state = new GameState({ players: [{hp:1,hpMax:2}, {hp:1,hpMax:2, items:[]}], shotgun: new Shotgun() });
const dealer = state.players[1];

// Handcuffs over Beer
dealer.items = [new Beer(), new Handcuffs()];
dealerUseItems(state);
assert.ok(dealer.cuffed);
assert.strictEqual(dealer.items.length, 1);
assert.ok(dealer.items[0] instanceof Beer);

dealer.cuffed = false;
// Adrenaline over Inverter
dealer.items = [new Inverter(), new Adrenaline()];
dealerUseItems(state);
assert.ok(dealer.adrenaline);
assert.strictEqual(dealer.items.length, 1);
assert.ok(dealer.items[0] instanceof Inverter);

// Magnify over Beer and Handsaw
state.shotgun.magazine = [new Shell(ShellType.LIVE)];
dealer.adrenaline = false;
dealer.items = [new Handsaw(), new MagnifyingGlass(), new Beer()];
dealerUseItems(state);
assert.strictEqual(dealer.lastRevealed, ShellType.LIVE);
assert.strictEqual(dealer.items.length, 2);
assert.ok(dealer.items.some(it => it instanceof Handsaw));
assert.ok(dealer.items.some(it => it instanceof Beer));

// Beer over Handsaw
dealer.hp = 1;
dealer.items = [new Handsaw(), new Beer()];
dealerUseItems(state);
assert.strictEqual(dealer.hp, 2);
assert.strictEqual(dealer.items.length, 1);
assert.ok(dealer.items[0] instanceof Handsaw);

console.log('Step 10: dealer item priority test passed');
