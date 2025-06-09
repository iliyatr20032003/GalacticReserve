document.addEventListener('DOMContentLoaded', () => {
    const newGameBtn = document.getElementById('newGame');
    const hitBtn = document.getElementById('hit');
    const standBtn = document.getElementById('stand');
    const statusEl = document.getElementById('status');
    const playerEl = document.getElementById('player');
    const dealerEl = document.getElementById('dealer');

    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let gameOver = false;

    const suits = ['\u2660', '\u2665', '\u2666', '\u2663']; // spade, heart, diamond, club

    function createDeck() {
        deck = [];
        for (let i = 1; i <= 13; i++) {
            for (let j = 0; j < 4; j++) {
                deck.push({ value: i, suit: suits[j] });
            }
        }
    }

    function drawCard() {
        const idx = Math.floor(Math.random() * deck.length);
        return deck.splice(idx, 1)[0];
    }

    function cardValue(card) {
        if (card.value > 10) return 10;
        return card.value;
    }

    function handValue(hand) {
        let total = 0;
        let aces = 0;
        hand.forEach(c => {
            if (c.value === 1) aces++; else total += cardValue(c);
        });
        for (let i = 0; i < aces; i++) {
            if (total + 11 <= 21) {
                total += 11;
            } else {
                total += 1;
            }
        }
        return total;
    }

    function cardLabel(card) {
        const labels = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        return labels[card.value - 1] + card.suit;
    }

    function createCardElement(card) {
        const div = document.createElement('div');
        div.className = 'card ' + ((card.suit === '\u2665' || card.suit === '\u2666') ? 'red' : 'black');
        div.textContent = cardLabel(card);
        return div;
    }

    function renderHand(el, hand, revealScore) {
        el.innerHTML = '';
        hand.forEach(c => el.appendChild(createCardElement(c)));
        if (revealScore) {
            const score = document.createElement('span');
            score.className = 'hand-score';
            score.textContent = `(${handValue(hand)})`;
            el.appendChild(score);
        }
    }

    function updateView() {
        renderHand(playerEl, playerHand, true);
        renderHand(dealerEl, dealerHand, gameOver);
    }

    function checkAutoStand() {
        if (!gameOver && handValue(playerHand) === 21) {
            dealerPlay();
        }
    }

    function endGame(message) {
        gameOver = true;
        statusEl.textContent = message;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        updateView();
    }

    function dealerPlay() {
        while (handValue(dealerHand) < 17) {
            dealerHand.push(drawCard());
        }
        const playerScore = handValue(playerHand);
        const dealerScore = handValue(dealerHand);
        if (dealerScore > 21 || playerScore > dealerScore) {
            endGame('You win!');
        } else if (dealerScore === playerScore) {
            endGame('Draw!');
        } else {
            endGame('Dealer wins!');
        }
    }

    newGameBtn.addEventListener('click', () => {
        createDeck();
        playerHand = [drawCard(), drawCard()];
        dealerHand = [drawCard()];
        gameOver = false;
        hitBtn.disabled = false;
        standBtn.disabled = false;
        statusEl.textContent = 'Your move';
        updateView();
        checkAutoStand();
    });

    hitBtn.addEventListener('click', () => {
        if (gameOver) return;
        playerHand.push(drawCard());
        if (handValue(playerHand) > 21) {
            endGame('Bust! Dealer wins');
        } else {
            updateView();
            checkAutoStand();
        }
    });

    standBtn.addEventListener('click', () => {
        if (gameOver) return;
        dealerPlay();
    });
});
