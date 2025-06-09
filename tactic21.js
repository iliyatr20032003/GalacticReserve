document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('board');
    const hand1El = document.getElementById('player1Hand');
    const hand2El = document.getElementById('player2Hand');
    const statusEl = document.getElementById('status');
    const restartBtn = document.getElementById('restart');
    const rulesBtn = document.getElementById('rulesButton');
    const rulesModal = document.getElementById('rulesModal');

    let board;
    let deck;
    let hands;
    let currentPlayer;
    let selectedCardIndex = null;
    let gameOver = false;

    const LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]            // diagonals
    ];

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
            for (let i = 0; i < 4; i++) {
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
            if (player === 2) {
                card.classList.add('ai-card');
            }
            card.textContent = player === 2 ? '?' : value;
            card.dataset.index = idx;
            if (player === 1) {
                card.addEventListener('click', () => {
                    if (gameOver || currentPlayer !== player) return;
                    selectedCardIndex = idx;
                    Array.from(el.children).forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                });
            }
            el.appendChild(card);
        });
    }

    function placeCard(index) {
        if (gameOver || board[index] || selectedCardIndex === null) return;
        const value = hands[currentPlayer][selectedCardIndex];
        hands[currentPlayer].splice(selectedCardIndex, 1);
        board[index] = { owner: currentPlayer, value };
        boardEl.children[index].textContent = value;
        boardEl.children[index].classList.add('player1');
        selectedCardIndex = null;
        drawCard(currentPlayer);
        renderHands();
        if (checkWinAfterMove(currentPlayer, index)) {
            statusEl.textContent = `Player 1 wins!`;
            gameOver = true;
            return;
        }
        if (board.every(c => c)) {
            finalizeGame();
            return;
        }
        currentPlayer = 2;
        statusEl.textContent = "AI's turn";
        setTimeout(aiMove, 500);
    }

    function eachLine(cb) {
        LINES.forEach(cb);
    }

    function checkWinAfterMove(player, index) {
        for (const line of LINES) {
            if (line.includes(index)) {
                const cells = line.map(i => board[i]);
                if (cells.every(c => c)) {
                    const sum = cells.reduce((s, c) => s + c.value, 0);
                    if (sum === 21) {
                        return true;
                    }
                }
            }
        }
        return false;
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
            statusEl.textContent = 'AI wins by score!';
        } else {
            statusEl.textContent = 'Draw!';
        }
        gameOver = true;
    }

    function findWinningMove(player, cards) {
        for (let cardIdx = 0; cardIdx < cards.length; cardIdx++) {
            const value = cards[cardIdx];
            for (const line of LINES) {
                let sum = value;
                let empty = null;
                let valid = true;
                for (const i of line) {
                    const cell = board[i];
                    if (cell) {
                        if (cell.owner !== player) { valid = false; break; }
                        sum += cell.value;
                    } else {
                        if (empty === null) empty = i; else { valid = false; break; }
                    }
                }
                if (valid && empty !== null && sum === 21) {
                    return { index: empty, cardIdx };
                }
            }
        }
        return null;
    }

    function chooseAIMove() {
        let move = findWinningMove(2, hands[2]);
        if (move) return move;

        move = findWinningMove(1, Array.from({ length: 11 }, (_, i) => i + 1));
        if (move) return { index: move.index, cardIdx: 0 };

        const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
        const index = empty[Math.floor(Math.random() * empty.length)];
        const cardIdx = Math.floor(Math.random() * hands[2].length);
        return { index, cardIdx };
    }

    function placeCardAI(index, cardIdx) {
        if (gameOver || board[index]) return;
        const value = hands[2][cardIdx];
        hands[2].splice(cardIdx, 1);
        board[index] = { owner: 2, value };
        boardEl.children[index].textContent = value;
        boardEl.children[index].classList.add("player2");
        drawCard(2);
        renderHands();
        if (checkWinAfterMove(2, index)) {
            statusEl.textContent = 'AI wins!';
            gameOver = true;
            return;
        }
        if (board.every(c => c)) { finalizeGame(); return; }
        currentPlayer = 1;
        statusEl.textContent = "Player 1's turn";
    }

    function aiMove() {
        if (gameOver) return;
        const { index, cardIdx } = chooseAIMove();
        placeCardAI(index, cardIdx);
    }

    function restart() {
        initDeck();
        dealHands();
        createBoard();
        renderHands();
        selectedCardIndex = null;
        gameOver = false;
        currentPlayer = Math.random() < 0.5 ? 1 : 2;
        statusEl.textContent = currentPlayer === 1 ? "Player 1's turn" : "AI's turn";
        if (currentPlayer === 2) {
            setTimeout(aiMove, 500);
        }
    }

    restartBtn.addEventListener('click', restart);
    rulesBtn.addEventListener('click', () => { rulesModal.style.display = 'flex'; });
    restart();
});
