document.addEventListener('DOMContentLoaded', () => {
    const playerHandEl = document.getElementById('playerHand');
    const aiHandEl = document.getElementById('aiHand');
    const tableEl = document.getElementById('table');
    const stockEl = document.getElementById('stock');
    const statusEl = document.getElementById('status');
    const newGameBtn = document.getElementById('newGame');
    const takeBtn = document.getElementById('take');
    const beatBtn = document.getElementById('beat');
    const difficultyEl = document.getElementById('difficulty');
    const rulesBtn = document.getElementById('rulesButton');
    const rulesModal = document.getElementById('rulesModal');

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

    // Sort cards by suit and rank with trump cards on the far right
    function sortHand(hand, trump) {
        const ranks = ['6','7','8','9','10','J','Q','K','A'];
        const suits = ['\u2660','\u2665','\u2666','\u2663'];
        const suitOrder = suits.filter(s => s !== trump);
        suitOrder.push(trump);
        return hand.slice().sort((a, b) => {
            const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            if (suitDiff !== 0) return suitDiff;
            return ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
        });
    }

    function renderHand(el, hand, hide) {
        el.innerHTML = '';
        const sorted = sortHand(hand, state.trump);
        sorted.forEach(c => {
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
        } else {
            const indicator = createCardElement({rank: '', suit: state.trump});
            indicator.classList.add('trump-indicator');
            stockEl.appendChild(indicator);
        }
    }

    function updateView() {
        renderHand(playerHandEl, state.players[0].hand, false);
        renderHand(aiHandEl, state.players[1].hand, true);
        renderTable();
        renderStock();
        if (beatBtn) {
            beatBtn.style.display = state.attacker === 0 ? 'inline-block' : 'none';
            beatBtn.disabled = awaitingDefence || state.table.length === 0 || state.table.some(p => !p.defence);
        }
    }

    function playerAttack(card) {
        if (state.attacker !== 0 || awaitingDefence) return;
        const legal = DurakEngine.getLegalAttacks(state.players[0].hand, state.table);
        if (!legal.includes(card)) return;
        const maxPairs = DurakEngine.getAttackLimit(state);
        if (state.table.length >= maxPairs || state.table.length >= state.defenderStartHandSize) return;
        const idx = state.players[0].hand.indexOf(card);
        if (idx === -1) return;
        state.players[0].hand.splice(idx,1);
        state.table.push({attack: card});
        awaitingDefence = true;
        updateView();
        setTimeout(()=>aiDefend(card, state.table.length-1),500);
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
        setTimeout(aiAttack, 600);
    }

    function aiAttack() {
        const maxPairs = DurakEngine.getAttackLimit(state);
        if (state.table.length >= maxPairs || state.table.length >= state.defenderStartHandSize) {
            endTurn(true);
            return;
        }
        const card = DurakAI.chooseAttack(state,1);
        if (!card) { endTurn(true); return; }
        const idx = state.players[1].hand.indexOf(card);
        state.players[1].hand.splice(idx,1);
        state.table.push({attack: card});
        awaitingDefence = true;
        updateView();
        statusEl.textContent = 'Defend!';
    }

    function aiDefend(attackCard, pairIndex) {
        const card = DurakAI.chooseDefence(state, attackCard, 1);
        if (!card) {
            // AI picks up
            awaitingDefence = false;
            statusEl.textContent = 'AI picked up';
            setTimeout(() => endTurn(false), 600);
            return;
        }
        const idx = state.players[1].hand.indexOf(card);
        state.players[1].hand.splice(idx,1);
        state.table[pairIndex].defence = card;
        awaitingDefence = false;
        updateView();
        statusEl.textContent = 'Your attack';
        // Automatically end the round if the AI has no cards left, the deck is
        // empty, and the player cannot legally continue the attack. Without
        // this check the status would misleadingly remain "Your attack" even
        // though the AI has effectively won.
        if (state.players[1].hand.length === 0 && state.stock.length === 0 && !state.trumpCard) {
            const legal = DurakEngine.getLegalAttacks(state.players[0].hand, state.table);
            if (legal.length === 0) {
                setTimeout(() => endTurn(true), 300);
            }
        }
    }

    function endTurn(success) {
        DurakEngine.endTurn(state, success);
        updateView();
        if (state.players[0].hand.length === 0 && state.players[1].hand.length === 0 &&
            state.stock.length === 0 && !state.trumpCard) {
            statusEl.textContent = 'Draw!';
            return;
        }
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
        statusEl.textContent = 'You picked up';
        setTimeout(() => endTurn(false), 600);
    });

    if (beatBtn) {
        beatBtn.addEventListener('click', () => {
            if (state.attacker !== 0) return;
            if (awaitingDefence) return;
            if (state.table.length === 0) return;
            if (state.table.some(p => !p.defence)) return;
            endTurn(true);
        });
    }

    newGameBtn.addEventListener('click', startGame);
    if (difficultyEl) {
        difficultyEl.addEventListener('change', () => {
            DurakAI.setDifficulty(difficultyEl.value);
        });
    }
    if (rulesBtn) {
        rulesBtn.addEventListener('click', () => {
            if (rulesModal) rulesModal.style.display = 'flex';
        });
    }
    startGame();
});
