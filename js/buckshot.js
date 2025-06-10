document.addEventListener('DOMContentLoaded', () => {
    const newBtn = document.getElementById('newGame');
    const status = document.getElementById('status');
    if (!newBtn) return;
    newBtn.addEventListener('click', () => {
        const state = new window.GameState({
            players: [{name: 'You'}, {name: 'Dealer'}],
            shotgun: new window.Shotgun()
        });
        window.setRoundHp(state);
        window.loadShotgun(state);
        status.textContent = `Game started! You HP: ${state.players[0].hp}/${state.players[0].hpMax}`;
    });
});
