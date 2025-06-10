const assert = require('assert');
const { GameState, Shotgun, loadShotgun, ShellType } = require('../js/buckshotCore');

let nums = [0.3, 0.7, 0.2, 0.9, 0.1, 0.4, 0.8];
let idx = 0;
const rng = () => nums[idx++ % nums.length];

const state = new GameState({ shotgun: new Shotgun(), players: [] });
loadShotgun(state, rng);
const mag = state.shotgun.magazine;
assert.ok(mag.length >= 2 && mag.length <= 8 && mag.length % 2 === 0);
const hasLive = mag.some(s => s.type === ShellType.LIVE);
const hasBlank = mag.some(s => s.type === ShellType.BLANK);
assert.ok(hasLive && hasBlank);
console.log('Step 6: loadShotgun test passed');
