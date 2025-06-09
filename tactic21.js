document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('board');
    const hand1El = document.getElementById('player1Hand');
    const hand2El = document.getElementById('player2Hand');
    const statusEl = document.getElementById('status');
    const restartBtn = document.getElementById('restart');

    let board;
    let deck;
    let hands;
    let currentPlayer;
    let selectedCardIndex = null;
    let gameOver = false;

    function initDeck() {
        deck = [];
        for (let i = 1; i <= 11; i++) {
            for (let j = 0; j < 4; j++) {
                deck.push(i);
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function drawCard(player) {
        if (deck.length > 0) {
            hands[player].push(deck.pop());
        }
    }

    function dealHands() {
        hands = {1: [], 2: []};
        for (let p = 1; p <= 2; p++) {
            for (let i = 0; i < 5; i++) {
                drawCard(p);
            }
        }
    }

    function createBoard() {
        board = Array(9).fill(null);
        boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => placeCard(i));
            boardEl.appendChild(cell);
        }
    }

    function renderHands() {
        renderHand(hand1El, hands[1], 1);
        renderHand(hand2El, hands[2], 2);
    }

    function renderHand(el, hand, player) {
        el.innerHTML = '';
        hand.forEach((value, idx) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = value;
            card.dataset.index = idx;
            card.addEventListener('click', () => {
                if (gameOver || currentPlayer !== player) return;
                selectedCardIndex = idx;
                Array.from(el.children).forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
            el.appendChild(card);
        });
    }

    function placeCard(index) {
        if (gameOver || board[index] || selectedCardIndex === null) return;
        const value = hands[currentPlayer][selectedCardIndex];
        hands[currentPlayer].splice(selectedCardIndex, 1);
        board[index] = { owner: currentPlayer, value };
        boardEl.children[index].textContent = value;
        selectedCardIndex = null;
        drawCard(currentPlayer);
        renderHands();
        if (checkWin(currentPlayer)) {
            statusEl.textContent = `Player ${currentPlayer} wins!`;
            gameOver = true;
            return;
        }
        if (board.every(c => c)) {
            finalizeGame();
            return;
        }
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        statusEl.textContent = `Player ${currentPlayer}'s turn`;
    }

    function eachLine(cb) {
        const lines = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        lines.forEach(cb);
    }

    function checkWin(player) {
        let win = false;
        eachLine(line => {
            if (line.every(i => board[i] && board[i].owner === player)) {
                const sum = line.reduce((s, i) => s + board[i].value, 0);
                if (sum === 21) win = true;
            }
        });
        return win;
    }

    function finalizeGame() {
        const scores = {1: 0, 2: 0};
        eachLine(line => {
            const cells = line.map(i => board[i]);
            if (cells.every(c => c && c.owner === cells[0].owner)) {
                const sum = cells.reduce((s, c) => s + c.value, 0);
                const p = cells[0].owner;
                if (sum === 21) {
                    scores[p] += 100; // should not happen as win checked before
                } else if (sum === 20) {
                    scores[p] += 1;
                } else if (sum === 19) {
                    scores[p] += 0.5;
                }
            }
        });
        if (scores[1] > scores[2]) {
            statusEl.textContent = 'Player 1 wins by score!';
        } else if (scores[2] > scores[1]) {
            statusEl.textContent = 'Player 2 wins by score!';
        } else {
            statusEl.textContent = 'Draw!';
        }
        gameOver = true;
    }

    function restart() {
        initDeck();
        dealHands();
        createBoard();
        renderHands();
        selectedCardIndex = null;
        gameOver = false;
        currentPlayer = 1;
        statusEl.textContent = "Player 1's turn";
    }

    restartBtn.addEventListener('click', restart);
    restart();
});
