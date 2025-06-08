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

    function createDeck() {
        deck = [];
        for (let i = 1; i <= 13; i++) {
            for (let j = 0; j < 4; j++) {
                deck.push(i);
            }
        }
    }

    function drawCard() {
        const idx = Math.floor(Math.random() * deck.length);
        return deck.splice(idx, 1)[0];
    }

    function cardValue(card) {
        if (card > 10) return 10;
        return card;
    }

    function handValue(hand) {
        let total = 0;
        let aces = 0;
        hand.forEach(c => {
            if (c === 1) aces++; else total += cardValue(c);
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
        return labels[card-1];
    }

    function updateView() {
        playerEl.textContent = `Player: ${playerHand.map(cardLabel).join(' ')} (${handValue(playerHand)})`;
        if (gameOver) {
            dealerEl.textContent = `Dealer: ${dealerHand.map(cardLabel).join(' ')} (${handValue(dealerHand)})`;
        } else {
            dealerEl.textContent = `Dealer: ${dealerHand.map(cardLabel).join(' ')}`;
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
    });

    hitBtn.addEventListener('click', () => {
        if (gameOver) return;
        playerHand.push(drawCard());
        if (handValue(playerHand) > 21) {
            endGame('Bust! Dealer wins');
        } else {
            updateView();
        }
    });

    standBtn.addEventListener('click', () => {
        if (gameOver) return;
        dealerPlay();
    });
});
