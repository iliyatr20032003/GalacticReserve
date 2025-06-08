document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');
    const restartBtn = document.getElementById('restart');
    const difficultyEl = document.getElementById('difficulty');
    let board;
    let currentPlayer;
    let playerSymbol;
    let aiSymbol;
    let gameOver;
    let physicsOverlay;
    let physicsTimer;

    function createBoard() {
        boardEl.innerHTML = '';
        board = Array(9).fill(null);
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', playerMove);
            boardEl.appendChild(cell);
        }
    }

    function restartGame() {
        if (physicsOverlay) {
            clearInterval(physicsTimer);
            physicsOverlay.remove();
            physicsOverlay = null;
            physicsTimer = null;
        }
        boardEl.classList.remove('physics');
        boardEl.style.visibility = '';
        boardEl.removeAttribute('style');
        createBoard();
        gameOver = false;
        if (Math.random() < 0.5) {
            playerSymbol = 'X';
            aiSymbol = 'O';
            currentPlayer = playerSymbol;
            statusEl.textContent = 'Your move';
        } else {
            playerSymbol = 'O';
            aiSymbol = 'X';
            currentPlayer = aiSymbol;
            statusEl.textContent = 'AI starts';
            setTimeout(aiMove, 300);
        }
    }

    function playerMove(e) {
        if (gameOver || currentPlayer !== playerSymbol) return;
        const index = e.target.dataset.index;
        if (!board[index]) {
            makeMove(index, playerSymbol);
            if (!gameOver) {
                currentPlayer = aiSymbol;
                setTimeout(aiMove, 300);
            }
        }
    }

    function aiMove() {
        if (gameOver) return;
        if (difficultyEl.value === 'cheater' && tryCheat()) {
            if (!gameOver) {
                currentPlayer = playerSymbol;
                statusEl.textContent = 'Your move';
            }
            return;
        }
        const index = chooseAIMove();
        if (index != null) {
            makeMove(index, aiSymbol);
        }
        if (!gameOver) {
            currentPlayer = playerSymbol;
            statusEl.textContent = 'Your move';
        }
    }

    function makeMove(index, symbol) {
        board[index] = symbol;
        boardEl.children[index].textContent = symbol;
        const winner = checkWinner(board);
        if (winner) {
            statusEl.textContent = winner === 'draw' ? 'Draw!' : `${winner} wins!`;
            gameOver = true;
            if (winner === aiSymbol && playerSymbol) {
                explodeBoard();
            }
        }
    }

    function getAvailableMoves() {
        return board.map((v, i) => v ? null : i).filter(v => v !== null);
    }

    function hasWin(bd, symbol) {
        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        return wins.some(([a, b, c]) => bd[a] === symbol && bd[b] === symbol && bd[c] === symbol);
    }

    function tryCheat() {
        const playerCells = board
            .map((v, i) => (v === playerSymbol ? i : null))
            .filter(v => v !== null);
        const empty = getAvailableMoves();
        for (const from of playerCells) {
            for (const to of empty) {
                const copy = board.slice();
                copy[from] = aiSymbol;
                copy[to] = playerSymbol;
                const aiWin = hasWin(copy, aiSymbol);
                if (aiWin) {
                    const playerWin = hasWin(copy, playerSymbol);
                    board[from] = aiSymbol;
                    boardEl.children[from].textContent = aiSymbol;
                    board[to] = playerSymbol;
                    boardEl.children[to].textContent = playerSymbol;
                    let result;
                    if (aiWin && playerWin) {
                        result = 'draw';
                    } else {
                        result = aiSymbol;
                    }
                    if (result) {
                        statusEl.textContent = result === 'draw' ? 'Draw!' : `${result} wins!`;
                        gameOver = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    function chooseAIMove() {
        const moves = getAvailableMoves();
        const diff = difficultyEl.value;
        function bestMove() {
            let bestScore = -Infinity;
            let move;
            for (const i of moves) {
                board[i] = aiSymbol;
                const score = minimax(board, 0, false);
                board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
            return move;
        }
        if (diff === 'impossible' || diff === 'cheater') {
            return bestMove();
        }
        const rand = Math.random();
        if (diff === 'hard') {
            if (rand < 0.8) return bestMove();
        } else if (diff === 'normal') {
            if (rand < 0.5) return bestMove();
        } else if (diff === 'easy') {
            if (rand < 0.2) return bestMove();
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    function minimax(newBoard, depth, isMaximizing) {
        const winner = checkWinner(newBoard);
        if (winner === aiSymbol) return 10 - depth;
        if (winner === playerSymbol) return depth - 10;
        if (winner === 'draw') return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (const i of getAvailableMoves()) {
                newBoard[i] = aiSymbol;
                const score = minimax(newBoard, depth + 1, false);
                newBoard[i] = null;
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (const i of getAvailableMoves()) {
                newBoard[i] = playerSymbol;
                const score = minimax(newBoard, depth + 1, true);
                newBoard[i] = null;
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    function checkWinner(bd) {
        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (const [a,b,c] of wins) {
            if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) return bd[a];
        }
        if (bd.every(v => v)) return 'draw';
        return null;
    }

    function explodeBoard() {
        const rect = boardEl.getBoundingClientRect();
        boardEl.classList.add('physics');
        boardEl.style.visibility = 'hidden';

        physicsOverlay = document.createElement('div');
        physicsOverlay.className = 'physics-overlay';
        const floorEl = document.createElement('div');
        floorEl.className = 'floor';
        physicsOverlay.appendChild(floorEl);
        document.body.appendChild(physicsOverlay);

        const overlayWidth = physicsOverlay.clientWidth;
        const overlayHeight = physicsOverlay.clientHeight;
        const floorHeight = floorEl.offsetHeight;

        const cells = Array.from(boardEl.children);
        if (!cells.length) return;
        const cellSize = cells[0].offsetWidth;

        const pieces = cells.map(cell => {
            const r = cell.getBoundingClientRect();
            const x = r.left;
            const y = r.top;
            cell.style.position = 'absolute';
            cell.style.left = x + 'px';
            cell.style.top = y + 'px';
            physicsOverlay.appendChild(cell);
            return {
                el: cell,
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                rot: 0,
                vr: (Math.random() - 0.5) * 10
            };
        });

        let stillFrames = 0;
        function step() {
            let allStill = true;
            pieces.forEach(p => {
                p.vy += 0.3; // gravity
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                if (p.x < 0) { p.x = 0; p.vx *= -0.7; }
                if (p.x > overlayWidth - cellSize) { p.x = overlayWidth - cellSize; p.vx *= -0.7; }
                const floorY = overlayHeight - floorHeight - cellSize;
                if (p.y >= floorY) {
                    p.y = floorY;
                    if (Math.abs(p.vy) < 0.5) {
                        p.vy = 0;
                        p.vx *= 0.98;
                        p.vr *= 0.95;
                    } else {
                        p.vy *= -0.5;
                    }
                } else {
                    allStill = false;
                }
                if (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1) allStill = false;
                p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
            });
            if (allStill) {
                stillFrames++;
                if (stillFrames > 60) {
                    clearInterval(physicsTimer);
                }
            } else {
                stillFrames = 0;
            }
        }

        physicsTimer = setInterval(step, 16);
    }

    restartBtn.addEventListener('click', restartGame);
    restartGame();
});
