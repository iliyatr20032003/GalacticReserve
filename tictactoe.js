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
        }
    }

    function getAvailableMoves() {
        return board.map((v, i) => v ? null : i).filter(v => v !== null);
    }

    function tryCheat() {
        const playerCells = board
            .map((v, i) => (v === playerSymbol ? i : null))
            .filter(v => v !== null);
        const empty = getAvailableMoves();
        for (const from of playerCells) {
            for (const to of empty) {
                if (board[to]) continue;
                const copy = board.slice();
                copy[from] = aiSymbol;
                copy[to] = playerSymbol;
                if (checkWinner(copy) === aiSymbol) {
                    board[from] = aiSymbol;
                    boardEl.children[from].textContent = aiSymbol;
                    board[to] = playerSymbol;
                    boardEl.children[to].textContent = playerSymbol;
                    const winner = checkWinner(board);
                    if (winner) {
                        statusEl.textContent = `${winner} wins!`;
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

    restartBtn.addEventListener('click', restartGame);
    restartGame();
});
