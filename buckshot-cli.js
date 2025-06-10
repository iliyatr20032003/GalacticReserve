// Buckshot Roulette minimal CLI
const readline = require('readline');
const {
  GameState, Shotgun, ShellType, Phase,
  setRoundHp, loadShotgun,
  saveState, loadState,
  CigarettePack, Beer, MagnifyingGlass, Handcuffs, Handsaw,
  dealerUseItems
} = require('./js/buckshotCore');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(res => rl.question(q, res)); }

function startRound(state) {
  setRoundHp(state);
  loadShotgun(state);
  state.turnOrder = [0,1];
  state.turn = 0;
  state.players[0].items = state.players[0].items || [];
  state.players[1].items = state.players[1].items || [];
}

function printStatus(state) {
  const p1 = state.players[0];
  const p2 = state.players[1];
  console.log(`You HP: ${p1.hp}/${p1.hpMax}`);
  console.log(`Dealer HP: ${p2.hp}/${p2.hpMax}`);
  const live = state.shotgun.magazine.filter(s => s.type === ShellType.LIVE).length;
  const blank = state.shotgun.magazine.filter(s => s.type === ShellType.BLANK).length;
  console.log(`Magazine -> live:${live} blank:${blank}`);
  console.log('Inventory:', (p1.items||[]).map((it,i)=>`${i}:${it.constructor.name}`).join(' ')||'none');
}

function getOpponent(state, idx) {
  return state.players[(idx+1)%2];
}

async function humanTurn(state) {
  const player = state.players[0];
  printStatus(state);
  const input = await ask('Command (shoot/use N/save F/load F/quit)> ');
  const [cmd,arg] = input.trim().split(/\s+/);
  if (cmd === 'quit') return false;
  if (cmd === 'save') { saveState(state, arg || 'save.json'); console.log('Saved'); return true; }
  if (cmd === 'load') { Object.assign(state, loadState(arg || 'save.json')); console.log('Loaded'); return true; }
  if (cmd === 'use') {
    const idx = parseInt(arg,10);
    if (!isNaN(idx) && player.items && player.items[idx]) {
      const [item] = player.items.splice(idx,1);
      item.apply(state, player);
    } else {
      console.log('No such item');
    }
    return true;
  }
  // default shoot
  state.takeTurn(player);
  return true;
}

function aiTurn(state) {
  dealerUseItems(state);
  state.takeTurn(state.players[1]);
  console.log('Dealer takes a turn.');
}

function roundWinner(state) {
  const p1 = state.players[0];
  const p2 = state.players[1];
  if (p1.hp <=0 && p2.hp <=0) return null;
  if (p1.hp <=0) return p2;
  if (p2.hp <=0) return p1;
  if (!state.shotgun.magazine.length) return p1.hp >= p2.hp ? p1 : p2;
  return null;
}

async function main() {
  let state = new GameState({ players:[{name:'You', items:[new CigarettePack(), new Beer()]},{name:'Dealer', items:[new MagnifyingGlass()]}], shotgun:new Shotgun() });
  startRound(state);
  while (!state.finished) {
    if (state.turn === 0) {
      const cont = await humanTurn(state);
      if (!cont) break;
    } else {
      aiTurn(state);
    }
    const winner = roundWinner(state);
    if (winner) {
      console.log(`Round winner: ${winner.name}`);
      state.resolveRound(winner);
      if (state.finished) break;
      startRound(state);
    }
  }
  console.log('Game over!');
  rl.close();
}

main();
