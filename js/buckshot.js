document.addEventListener('DOMContentLoaded', () => {
    const newBtn = document.getElementById('newGame');
    const status = document.getElementById('status');
    const area = document.getElementById('gameArea');
    const shootBtn = document.getElementById('shoot');
    const playerHp = document.getElementById('playerHp');
    const dealerHp = document.getElementById('dealerHp');
    const magCount = document.getElementById('magCount');

    let state = null;

    function updateDisplay() {
        if (!state) return;
        const p1 = state.players[0];
        const p2 = state.players[1];
        playerHp.textContent = `You HP: ${p1.hp}/${p1.hpMax}`;
        dealerHp.textContent = `Dealer HP: ${p2.hp}/${p2.hpMax}`;
        const live = state.shotgun.magazine.filter(s => s.type === window.ShellType.LIVE).length;
        const blank = state.shotgun.magazine.filter(s => s.type === window.ShellType.BLANK).length;
        magCount.textContent = `Shells - live: ${live}, blank: ${blank}`;
    }

    function checkWinner() {
        const p1 = state.players[0];
        const p2 = state.players[1];
        if (p1.hp <= 0 && p2.hp <= 0) return null;
        if (p1.hp <= 0) return p2;
        if (p2.hp <= 0) return p1;
        if (!state.shotgun.magazine.length) return p1.hp >= p2.hp ? p1 : p2;
        return null;
    }

    function dealerTurn() {
        const actor = state.players[1];
        const shell = state.shotgun.magazine[0];
        state.takeTurn(actor);
        status.textContent = `Dealer fired ${shell ? shell.type : ''}`;
        updateDisplay();
        const winner = checkWinner();
        if (winner) {
            status.textContent += ` - ${winner.name} wins!`;
            shootBtn.disabled = true;
        }
    }

    if (!newBtn) return;

    newBtn.addEventListener('click', () => {
        state = new window.GameState({
            players: [{name: 'You'}, {name: 'Dealer'}],
            shotgun: new window.Shotgun()
        });
        window.setRoundHp(state);
        window.loadShotgun(state);
        area.style.display = 'block';
        shootBtn.disabled = false;
        updateDisplay();
        status.textContent = 'Game started!';
    });

    shootBtn.addEventListener('click', () => {
        if (!state || shootBtn.disabled) return;
        const actor = state.players[0];
        const shell = state.shotgun.magazine[0];
        state.takeTurn(actor);
        status.textContent = `You fired ${shell ? shell.type : ''}`;
        updateDisplay();
        let winner = checkWinner();
        if (winner) {
            status.textContent += ` - ${winner.name} wins!`;
            shootBtn.disabled = true;
            return;
        }
        if (state.turn === 1) {
            setTimeout(dealerTurn, 500);
        }
    });
});
