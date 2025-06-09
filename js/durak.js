document.addEventListener('DOMContentLoaded', () => {
    const playerHandEl = document.getElementById('playerHand');
    const aiHandEl = document.getElementById('aiHand');
    const tableEl = document.getElementById('table');
    const stockEl = document.getElementById('stock');
    const statusEl = document.getElementById('status');
    const newGameBtn = document.getElementById('newGame');
    const takeBtn = document.getElementById('take');
    const difficultyEl = document.getElementById('difficulty');

    let state;
    let awaitingDefence = false;

    function startGame() {
        state = DurakEngine.createGame();
        DurakAI.setDifficulty(difficultyEl ? difficultyEl.value : 'normal');
        awaitingDefence = false;
        updateView();
        statusEl.textContent = state.attacker === 0 ? 'Your attack' : 'AI attacks';
        if (state.attacker === 1) {
            setTimeout(aiAttack, 600);
        }
    }

    function createCardElement(card, onClick) {
        const div = document.createElement('div');
        div.className = 'card ' + ((card.suit === '\u2665' || card.suit === '\u2666') ? 'red' : 'black');
        div.textContent = card.rank + card.suit;
        if (onClick) div.addEventListener('click', () => onClick(card));
        return div;
    }

    function renderHand(el, hand, hide) {
        el.innerHTML = '';
        hand.forEach(c => {
            if (hide) {
                const back = document.createElement('div');
                back.className = 'card back';
                el.appendChild(back);
            } else {
                el.appendChild(createCardElement(c, state.attacker===0 && !awaitingDefence ? playerAttack : playerDefend));
            }
        });
    }

    function renderTable() {
        tableEl.innerHTML = '';
        state.table.forEach(p => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'pair';
            pairDiv.appendChild(createCardElement(p.attack));
            if (p.defence) pairDiv.appendChild(createCardElement(p.defence));
            tableEl.appendChild(pairDiv);
        });
    }

    function renderStock() {
        if (!stockEl) return;
        stockEl.innerHTML = '';
        const remaining = state.stock.length + (state.trumpCard ? 1 : 0);
        if (remaining > 0) {
            const back = document.createElement('div');
            back.className = 'card back';
            const count = document.createElement('span');
            count.className = 'deck-count';
            count.textContent = remaining;
            stockEl.appendChild(back);
            stockEl.appendChild(count);
            if (state.trumpCard) {
                const trumpEl = createCardElement(state.trumpCard);
                trumpEl.classList.add('trump-card');
                stockEl.appendChild(trumpEl);
            }
        }
    }

    function updateView() {
        renderHand(playerHandEl, state.players[0].hand, false);
        renderHand(aiHandEl, state.players[1].hand, true);
        renderTable();
        renderStock();
    }

    function playerAttack(card) {
        if (state.attacker !== 0 || awaitingDefence) return;
        const idx = state.players[0].hand.indexOf(card);
        if (idx === -1) return;
        state.players[0].hand.splice(idx,1);
        state.table.push({attack: card});
        awaitingDefence = true;
        updateView();
        setTimeout(()=>aiDefend(card),500);
    }

    function playerDefend(card) {
        if (state.defender !== 0 || !awaitingDefence) return;
        const idx = state.players[0].hand.indexOf(card);
        if (idx === -1) return;
        const attackCard = state.table[state.table.length-1].attack;
        if (!DurakEngine.beats(card, attackCard, state.trump)) return;
        state.players[0].hand.splice(idx,1);
        state.table[state.table.length-1].defence = card;
        awaitingDefence = false;
        updateView();
        endTurn(true);
    }

    function aiAttack() {
        const card = DurakAI.chooseAttack(state,1);
        if (!card) { endTurn(true); return; }
        const idx = state.players[1].hand.indexOf(card);
        state.players[1].hand.splice(idx,1);
        state.table.push({attack: card});
        awaitingDefence = true;
        updateView();
        statusEl.textContent = 'Defend!';
    }

    function aiDefend(attackCard) {
        const card = DurakAI.chooseDefence(state, attackCard, 1);
        if (!card) {
            // AI picks up
            state.players[1].hand.push(attackCard);
            state.table = [];
            awaitingDefence = false;
            DurakEngine.draw(state,0);
            DurakEngine.draw(state,1);
            statusEl.textContent = 'AI picked up';
            DurakEngine.rotateRoles(state,false);
            updateView();
            if (state.attacker === 1) setTimeout(aiAttack,600);
            return;
        }
        const idx = state.players[1].hand.indexOf(card);
        state.players[1].hand.splice(idx,1);
        state.table[0].defence = card;
        awaitingDefence = false;
        updateView();
        setTimeout(() => endTurn(true), 1000);
    }

    function endTurn(success) {
        DurakEngine.endTurn(state, success);
        updateView();
        if (state.players[0].hand.length === 0 && state.stock.length === 0 && !state.trumpCard) {
            statusEl.textContent = 'You win!';
            return;
        }
        if (state.players[1].hand.length === 0 && state.stock.length === 0 && !state.trumpCard) {
            statusEl.textContent = 'AI wins!';
            return;
        }
        statusEl.textContent = state.attacker === 0 ? 'Your attack' : 'AI attacks';
        if (state.attacker === 1) setTimeout(aiAttack,600);
    }

    takeBtn.addEventListener('click', () => {
        if (state.defender !== 0 || !awaitingDefence) return;
        awaitingDefence = false;
        DurakEngine.endTurn(state, false);
        updateView();
        statusEl.textContent = 'You picked up';
        if (state.attacker === 1) setTimeout(aiAttack, 600);
    });

    newGameBtn.addEventListener('click', startGame);
    if (difficultyEl) {
        difficultyEl.addEventListener('change', () => {
            DurakAI.setDifficulty(difficultyEl.value);
        });
    }
    startGame();
});
