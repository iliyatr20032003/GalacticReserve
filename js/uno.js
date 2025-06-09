document.addEventListener('DOMContentLoaded', () => {
    const aiHandEl = document.getElementById('aiHand');
    const playerHandEl = document.getElementById('playerHand');
    const deckEl = document.getElementById('deck');
    const discardEl = document.getElementById('discard');
    const deckCountEl = document.getElementById('deckCount');
    const statusEl = document.getElementById('status');
    const newGameBtn = document.getElementById('newGame');
    const drawBtn = document.getElementById('draw');

    let deck = [];
    let discardPile = [];
    let playerHand = [];
    let aiHand = [];
    let currentPlayer = 'player';
    let currentColor = null;
    let currentValue = null;
    let currentType = null;
    let skipNext = false;
    let pendingDraw = 0;

    function createDeck() {
        const colors = ['red', 'green', 'blue', 'yellow'];
        deck = [];
        for (const color of colors) {
            deck.push({color, type: 'number', value: 0});
            for (let i = 1; i <= 9; i++) {
                deck.push({color, type: 'number', value: i});
                deck.push({color, type: 'number', value: i});
            }
            for (let i = 0; i < 2; i++) {
                deck.push({color, type: 'skip'});
                deck.push({color, type: 'reverse'});
                deck.push({color, type: 'draw2'});
            }
        }
        for (let i = 0; i < 4; i++) {
            deck.push({color: 'wild', type: 'wild'});
            deck.push({color: 'wild', type: 'wild4'});
        }
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function drawCard(toHand) {
        if (deck.length === 0) {
            if (discardPile.length <= 1) return null;
            const top = discardPile.pop();
            deck = discardPile;
            discardPile = [top];
            shuffle(deck);
        }
        const card = deck.pop();
        toHand.push(card);
        updateDeckCount();
        return card;
    }

    function updateDeckCount() {
        deckCountEl.textContent = deck.length;
    }

    function displayValue(card) {
        switch(card.type) {
            case 'number': return card.value;
            case 'skip': return 'Skip';
            case 'reverse': return 'Rev';
            case 'draw2': return '+2';
            case 'wild': return 'Wild';
            case 'wild4': return 'Wild+4';
        }
    }

    function renderHand(el, hand, hide) {
        el.innerHTML = '';
        hand.forEach((card, idx) => {
            const div = document.createElement('div');
            div.className = 'card ' + (hide ? 'back' : card.color);
            if (!hide) {
                div.textContent = displayValue(card);
                if (currentPlayer === 'player') {
                    div.addEventListener('click', () => playerPlay(idx));
                }
            }
            el.appendChild(div);
        });
    }

    function updateDiscard() {
        const top = discardPile[discardPile.length - 1];
        discardEl.className = 'card ' + top.color;
        discardEl.textContent = displayValue(top);
    }

    function updateView() {
        renderHand(playerHandEl, playerHand, false);
        renderHand(aiHandEl, aiHand, true);
        updateDiscard();
        updateDeckCount();
    }

    function isPlayable(card) {
        if (pendingDraw > 0 && card.type !== 'draw2' && card.type !== 'wild4') {
            return false;
        }
        if (card.color === 'wild') return true;
        return card.color === currentColor ||
               (card.type === 'number' && currentType === 'number' && card.value === currentValue) ||
               (card.type !== 'number' && card.type === currentType);
    }

    function promptColor() {
        const c = prompt('Choose color: red, green, blue, yellow', 'red');
        const color = (c || '').toLowerCase();
        if (['red','green','blue','yellow'].includes(color)) return color;
        return 'red';
    }

    function chooseColorAI() {
        const counts = {red:0,green:0,blue:0,yellow:0};
        aiHand.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
        return Object.keys(counts).reduce((a,b) => counts[a] > counts[b] ? a : b);
    }

    function applyCardEffect(card, who) {
        if (card.type === 'wild') {
            currentColor = (who === 'player') ? promptColor() : chooseColorAI();
            currentValue = null;
            currentType = 'wild';
        } else if (card.type === 'wild4') {
            currentColor = (who === 'player') ? promptColor() : chooseColorAI();
            currentValue = null;
            currentType = 'wild4';
            pendingDraw += 4;
            skipNext = true;
        } else {
            currentColor = card.color;
            currentValue = card.value || null;
            currentType = card.type;
            if (card.type === 'draw2') {
                pendingDraw += 2;
                skipNext = true;
            } else if (card.type === 'skip' || card.type === 'reverse') {
                skipNext = true;
            }
        }
        updateDiscard();
    }

    function playerPlay(index) {
        if (currentPlayer !== 'player') return;
        const card = playerHand[index];
        if (!isPlayable(card)) return;
        playerHand.splice(index, 1);
        discardPile.push(card);
        applyCardEffect(card, 'player');
        if (playerHand.length === 0) {
            statusEl.textContent = 'You win!';
            endGame();
            return;
        }
        currentPlayer = skipNext ? 'player' : 'ai';
        skipNext = false;
        nextTurn();
    }

    function playerDraw() {
        if (currentPlayer !== 'player') return;
        if (pendingDraw > 0) {
            for (let i = 0; i < pendingDraw; i++) drawCard(playerHand);
            pendingDraw = 0;
            currentPlayer = 'ai';
            nextTurn();
            return;
        }
        const card = drawCard(playerHand);
        if (isPlayable(card)) {
            // auto play if possible
            playerPlay(playerHand.length - 1);
        } else {
            currentPlayer = 'ai';
            nextTurn();
        }
    }

    function aiMove() {
        if (skipNext) {
            skipNext = false;
            currentPlayer = 'player';
            nextTurn();
            return;
        }
        if (pendingDraw > 0) {
            for (let i = 0; i < pendingDraw; i++) drawCard(aiHand);
            pendingDraw = 0;
            currentPlayer = 'player';
            nextTurn();
            return;
        }
        const playable = aiHand.filter(isPlayable);
        if (playable.length === 0) {
            const card = drawCard(aiHand);
            if (isPlayable(card)) {
                aiHand.pop();
                discardPile.push(card);
                applyCardEffect(card, 'ai');
                if (aiHand.length === 0) {
                    statusEl.textContent = 'AI wins!';
                    endGame();
                    return;
                }
                currentPlayer = skipNext ? 'ai' : 'player';
                skipNext = false;
                nextTurn();
            } else {
                currentPlayer = 'player';
                nextTurn();
            }
            return;
        }
        const card = playable[Math.floor(Math.random() * playable.length)];
        aiHand.splice(aiHand.indexOf(card), 1);
        discardPile.push(card);
        applyCardEffect(card, 'ai');
        if (aiHand.length === 0) {
            statusEl.textContent = 'AI wins!';
            endGame();
            return;
        }
        currentPlayer = skipNext ? 'ai' : 'player';
        skipNext = false;
        nextTurn();
    }

    function nextTurn() {
        updateView();
        if (currentPlayer === 'player') {
            statusEl.textContent = 'Your turn';
            drawBtn.disabled = false;
        } else {
            statusEl.textContent = "AI's turn";
            drawBtn.disabled = true;
            setTimeout(aiMove, 800);
        }
    }

    function endGame() {
        drawBtn.disabled = true;
        updateView();
    }

    newGameBtn.addEventListener('click', startGame);
    drawBtn.addEventListener('click', playerDraw);

    function startGame() {
        createDeck();
        shuffle(deck);
        playerHand = [];
        aiHand = [];
        discardPile = [];
        for (let i = 0; i < 7; i++) {
            drawCard(playerHand);
            drawCard(aiHand);
        }
        // initial discard
        let first;
        do {
            first = drawCard(discardPile);
        } while (first.color === 'wild');
        currentColor = first.color;
        currentValue = first.value || null;
        currentType = first.type;
        updateDiscard();
        currentPlayer = 'player';
        skipNext = false;
        pendingDraw = 0;
        nextTurn();
    }

    startGame();
});
