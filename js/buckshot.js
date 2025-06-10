let playerCharges = 3;
let dealerCharges = 3;
let magazine = [];
let turn = 'player';
let position = 0;

function setupGame() {
    playerCharges = 3;
    dealerCharges = 3;
    magazine = [];
    const total = 6;
    const liveCount = 2;
    for (let i = 0; i < total; i++) {
        magazine.push(i < liveCount);
    }
    // shuffle magazine
    for (let i = magazine.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [magazine[i], magazine[j]] = [magazine[j], magazine[i]];
    }
    position = 0;
    turn = 'player';
    updateDisplay('Game start!');
}

function updateDisplay(msg) {
    document.getElementById('playerCharges').textContent = playerCharges;
    document.getElementById('dealerCharges').textContent = dealerCharges;
    document.getElementById('status').textContent = msg;
    const magEl = document.getElementById('magazine');
    magEl.innerHTML = '';
    for (let i = position; i < magazine.length; i++) {
        const shell = document.createElement('div');
        shell.className = 'shell';
        shell.dataset.index = i;
        magEl.appendChild(shell);
    }
}

function resolveShot(target) {
    if (position >= magazine.length) {
        updateDisplay('No shells left.');
        return endRound();
    }
    const isLive = magazine[position];
    position++;
    const shellEl = document.querySelector(`#magazine .shell`);
    if (shellEl) {
        shellEl.classList.add(isLive ? 'live' : 'blank', 'revealed');
    }
    if (isLive) {
        if (target === 'player') playerCharges--; else dealerCharges--;
        updateDisplay(`${target === 'player' ? 'Player' : 'Dealer'} shot!`);
        turn = turn === 'player' ? 'dealer' : 'player';
    } else {
        updateDisplay('Click again, it was blank.');
    }
    checkGameOver();
}

function checkGameOver() {
    if (playerCharges <= 0 || dealerCharges <= 0) {
        endRound();
    }
}

function shootSelf() {
    if (turn !== 'player') return;
    resolveShot('player');
    if (turn === 'dealer') dealerTurn();
}

function shootDealer() {
    if (turn !== 'player') return;
    resolveShot('dealer');
    if (turn === 'dealer') dealerTurn();
}

function passTurn() {
    if (turn !== 'player') return;
    turn = 'dealer';
    updateDisplay('Player passed.');
    dealerTurn();
}

function dealerTurn() {
    if (position >= magazine.length) return endRound();
    if (dealerCharges <= 0 || playerCharges <= 0) return;
    setTimeout(() => {
        const choice = Math.random() < 0.5 ? 'self' : 'player';
        if (choice === 'self') {
            resolveShot('dealer');
        } else {
            resolveShot('player');
        }
        if (turn === 'dealer') dealerTurn();
    }, 800);
}

function endRound() {
    let msg = 'Round over. ';
    if (playerCharges <= 0 && dealerCharges <= 0) msg += 'Draw!';
    else if (playerCharges <= 0) msg += 'Dealer wins!';
    else if (dealerCharges <= 0) msg += 'Player wins!';
    else msg += 'No more shells.';
    updateDisplay(msg);
    document.getElementById('shootSelf').disabled = true;
    document.getElementById('shootDealer').disabled = true;
    document.getElementById('passBtn').disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('shootSelf').addEventListener('click', shootSelf);
    document.getElementById('shootDealer').addEventListener('click', shootDealer);
    document.getElementById('passBtn').addEventListener('click', passTurn);
    setupGame();
});
