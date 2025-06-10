const assert = require('assert');
const { Shell, ShellType } = require('../js/buckshotCore');

for (let i = 0; i < 10; i++) {
  const type = i % 2 === 0 ? ShellType.LIVE : ShellType.BLANK;
  const shell = new Shell(type);
  assert.strictEqual(shell.type, type);
}
console.log('Step 1: Shell type test passed');
