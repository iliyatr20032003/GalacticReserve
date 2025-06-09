document.addEventListener('DOMContentLoaded', () => {
    const aiHandEl = document.getElementById('aiHand');
    const playerHandEl = document.getElementById('playerHand');
    const deckEl = document.getElementById('deck');
    const discardEl = document.getElementById('discard');
    const deckCountEl = document.getElementById('deckCount');
    const statusEl = document.getElementById('status');
    const newGameBtn = document.getElementById('newGame');
    const drawBtn = document.getElementById('draw');
    const colorSelectEl = document.getElementById('colorSelect');
    const drawSelectEl = document.getElementById('drawSelect');
    const stackSelectEl = document.getElementById('stackSelect');

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
            // reset any chosen colors on wild cards before shuffling back
            deck.forEach(c => delete c.chosenColor);
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
        const color = top.chosenColor || top.color;
        discardEl.className = 'card ' + color;
        discardEl.textContent = displayValue(top);
    }

    function updateView() {
        renderHand(playerHandEl, playerHand, false);
        renderHand(aiHandEl, aiHand, true);
        updateDiscard();
        updateDeckCount();
    }

    function isPlayable(card) {
        if (pendingDraw > 0) {
            if (currentType === 'draw2' && card.type !== 'draw2') return false;
            if (currentType === 'wild4' && card.type !== 'wild4') return false;
        }
        if (card.color === 'wild') return true;
        return card.color === currentColor ||
               (card.type === 'number' && currentType === 'number' && card.value === currentValue) ||
               (card.type !== 'number' && card.type === currentType);
    }

    function promptColor() {
        return new Promise(resolve => {
            colorSelectEl.classList.remove('hidden');
            const options = colorSelectEl.querySelectorAll('.card');
            function choose(e) {
                const color = e.currentTarget.dataset.color;
                options.forEach(o => o.removeEventListener('click', choose));
                colorSelectEl.classList.add('hidden');
                resolve(color);
            }
            options.forEach(o => o.addEventListener('click', choose));
        });
    }

    function promptPlay(card) {
        return new Promise(resolve => {
            const cardEl = drawSelectEl.querySelector('.drawn-card');
            cardEl.className = 'card drawn-card ' + card.color;
            cardEl.textContent = displayValue(card);
            drawSelectEl.classList.remove('hidden');
            const options = drawSelectEl.querySelectorAll('.option');
            function choose(e) {
                const play = e.currentTarget.dataset.choice === 'yes';
                options.forEach(o => o.removeEventListener('click', choose));
                drawSelectEl.classList.add('hidden');
                resolve(play);
            }
            options.forEach(o => o.addEventListener('click', choose));
        });
    }

    function promptStack(indexes, total, type) {
        return new Promise(resolve => {
            const container = stackSelectEl.querySelector('.options');
            container.innerHTML = '';
            indexes.forEach(i => {
                const c = playerHand[i];
                const div = document.createElement('div');
                div.className = 'card ' + (c.color === 'wild' ? 'wild' : c.color);
                div.textContent = displayValue(c);
                div.addEventListener('click', () => {
                    cleanup();
                    resolve(i);
                });
                container.appendChild(div);
            });
            const take = document.createElement('div');
            take.className = 'card black take-option';
            take.textContent = 'Take +' + total;
            take.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            stackSelectEl.appendChild(take);
            stackSelectEl.classList.remove('hidden');
            function cleanup() {
                stackSelectEl.classList.add('hidden');
                container.innerHTML = '';
                stackSelectEl.removeChild(take);
            }
        });
    }

    function chooseColorAI() {
        const counts = {red:0,green:0,blue:0,yellow:0};
        aiHand.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
        return Object.keys(counts).reduce((a,b) => counts[a] > counts[b] ? a : b);
    }

    async function applyCardEffect(card, who) {
        if (card.type === 'wild') {
            currentColor = (who === 'player') ? await promptColor() : chooseColorAI();
            card.chosenColor = currentColor;
            currentValue = null;
            currentType = 'wild';
        } else if (card.type === 'wild4') {
            currentColor = (who === 'player') ? await promptColor() : chooseColorAI();
            card.chosenColor = currentColor;
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

    async function playerPlay(index) {
        if (currentPlayer !== 'player') return;
        const card = playerHand[index];
        if (!isPlayable(card)) return;
        playerHand.splice(index, 1);
        discardPile.push(card);
        await applyCardEffect(card, 'player');
        if (playerHand.length === 0) {
            statusEl.textContent = 'You win!';
            endGame();
            return;
        }
        currentPlayer = 'ai';
        nextTurn();
    }

    async function handlePlayerStack() {
        const indexes = [];
        playerHand.forEach((c, i) => { if (c.type === currentType) indexes.push(i); });
        if (indexes.length === 0) {
            for (let i = 0; i < pendingDraw; i++) drawCard(playerHand);
            pendingDraw = 0;
            if (skipNext) skipNext = false;
            currentPlayer = 'ai';
            nextTurn();
            return;
        }
        drawBtn.disabled = true;
        statusEl.textContent = 'Stack or draw';
        const choice = await promptStack(indexes, pendingDraw, currentType);
        if (choice !== null) {
            await playerPlay(choice);
        } else {
            for (let i = 0; i < pendingDraw; i++) drawCard(playerHand);
            pendingDraw = 0;
            if (skipNext) skipNext = false;
            currentPlayer = 'ai';
            nextTurn();
        }
    }

    async function playerDraw() {
        if (currentPlayer !== 'player') return;
        if (pendingDraw > 0) {
            for (let i = 0; i < pendingDraw; i++) drawCard(playerHand);
            pendingDraw = 0;
            currentPlayer = 'ai';
            nextTurn();
            return;
        }
        const card = drawCard(playerHand);
        updateView();
        if (isPlayable(card)) {
            const play = await promptPlay(card);
            if (play) {
                await playerPlay(playerHand.length - 1);
            } else {
                currentPlayer = 'ai';
                nextTurn();
            }
        } else {
            currentPlayer = 'ai';
            nextTurn();
        }
    }

    async function aiMove() {
        if (pendingDraw > 0) {
            if (currentType === 'draw2' || currentType === 'wild4') {
                const idx = aiHand.findIndex(c => c.type === currentType);
                if (idx !== -1) {
                    const card = aiHand[idx];
                    aiHand.splice(idx, 1);
                    discardPile.push(card);
                    await applyCardEffect(card, 'ai');
                    if (aiHand.length === 0) {
                        statusEl.textContent = 'AI wins!';
                        endGame();
                        return;
                    }
                    currentPlayer = 'player';
                    nextTurn();
                    return;
                }
            }
            for (let i = 0; i < pendingDraw; i++) drawCard(aiHand);
            pendingDraw = 0;
            if (skipNext) skipNext = false;
            currentPlayer = 'player';
            nextTurn();
            return;
        }
        if (skipNext) {
            skipNext = false;
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
                await applyCardEffect(card, 'ai');
                if (aiHand.length === 0) {
                    statusEl.textContent = 'AI wins!';
                    endGame();
                    return;
                }
                currentPlayer = 'player';
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
        await applyCardEffect(card, 'ai');
        if (aiHand.length === 0) {
            statusEl.textContent = 'AI wins!';
            endGame();
            return;
        }
        currentPlayer = 'player';
        nextTurn();
    }

    function nextTurn() {
        updateView();
        if (currentPlayer === 'player') {
            if (pendingDraw > 0 && (currentType === 'draw2' || currentType === 'wild4')) {
                handlePlayerStack();
                return;
            } else if (pendingDraw > 0) {
                for (let i = 0; i < pendingDraw; i++) drawCard(playerHand);
                pendingDraw = 0;
                if (skipNext) skipNext = false;
                currentPlayer = 'ai';
                nextTurn();
                return;
            }
            if (skipNext) {
                skipNext = false;
                currentPlayer = 'ai';
                nextTurn();
                return;
            }
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
