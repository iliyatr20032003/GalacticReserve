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

    // Physics related variables
    let engine;
    let physicsCells = [];
    let physicsActive = false;
    let physicsTimer = null;

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
        clearPhysics();
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
        const cell = boardEl.children[index];
        cell.textContent = symbol;
        cell.classList.remove('player-cell', 'ai-cell');
        cell.classList.add(symbol === aiSymbol ? 'ai-cell' : 'player-cell');
        const winner = checkWinner(board);
        if (winner) {
            statusEl.textContent = winner === 'draw' ? 'Draw!' : `${winner} wins!`;
            gameOver = true;
            if (winner === aiSymbol) {
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
                    const fromCell = boardEl.children[from];
                    fromCell.textContent = aiSymbol;
                    fromCell.classList.remove('player-cell', 'ai-cell');
                    fromCell.classList.add('ai-cell');

                    board[to] = playerSymbol;
                    const toCell = boardEl.children[to];
                    toCell.textContent = playerSymbol;
                    toCell.classList.remove('player-cell', 'ai-cell');
                    toCell.classList.add('player-cell');
                    let result;
                    if (aiWin && playerWin) {
                        result = 'draw';
                    } else {
                        result = aiSymbol;
                    }
                    if (result) {
                        statusEl.textContent = result === 'draw' ? 'Draw!' : `${result} wins!`;
                        gameOver = true;
                        if (result === aiSymbol) {
                            explodeBoard();
                        }
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

    function clearPhysics() {
        if (!physicsActive) return;
        if (physicsTimer) {
            clearTimeout(physicsTimer);
            physicsTimer = null;
        }
        physicsActive = false;
        physicsCells.forEach(cell => {
            if (cell._body) {
                Matter.World.remove(engine.world, cell._body);
                delete cell._body;
            }
            cell.remove();
        });
        physicsCells = [];
        engine = null;
    }

    function explodeBoard() {
        if (physicsActive) return;
        physicsActive = true;
        physicsTimer = setTimeout(startPhysics, 1000);
    }

    function startPhysics() {
        physicsTimer = null;
        engine = Matter.Engine.create();
        const world = engine.world;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const thickness = 100;

        const boundaries = [
            Matter.Bodies.rectangle(width/2, -thickness/2, width, thickness, { isStatic: true }),
            Matter.Bodies.rectangle(width/2, height + thickness/2, width, thickness, {
                isStatic: true,
                friction: 0
            }),
            Matter.Bodies.rectangle(-thickness/2, height/2, thickness, height, { isStatic: true }),
            Matter.Bodies.rectangle(width + thickness/2, height/2, thickness, height, { isStatic: true })
        ];
        Matter.World.add(world, boundaries);

        const boardRect = boardEl.getBoundingClientRect();
        const center = {
            x: boardRect.left + boardRect.width / 2,
            y: boardRect.top + boardRect.height / 2
        };

        const cells = Array.from(boardEl.children);
        // Capture the original positions of the cells before removing them from
        // the grid so that they start falling from their correct spots
        const rects = cells.map(cell => cell.getBoundingClientRect());
        cells.forEach((cell, i) => {
            const rect = rects[i];
            cell.style.position = 'absolute';
            cell.style.left = rect.left + 'px';
            cell.style.top = rect.top + 'px';
            cell.style.margin = '0';
            cell.style.pointerEvents = 'none';
            document.body.appendChild(cell);

            const radius = rect.width / 2;
            const body = Matter.Bodies.circle(rect.left + radius, rect.top + radius, radius, {
                restitution: 0.4
            });
            Matter.World.add(world, body);

            const dirX = body.position.x - center.x;
            const dirY = body.position.y - center.y;
            const len = Math.hypot(dirX, dirY) || 1;
            const forceScale = 0.002;
            Matter.Body.applyForce(body, body.position, {
                x: (dirX / len) * forceScale,
                y: (dirY / len) * forceScale
            });

            cell._body = body;
            cell._width = rect.width;
            cell._height = rect.height;
            physicsCells.push(cell);
        });

        (function update() {
            if (!physicsActive) return;
            Matter.Engine.update(engine, 1000/60);
            physicsCells.forEach(cell => {
                const pos = cell._body.position;
                cell.style.left = (pos.x - cell._width/2) + 'px';
                cell.style.top = (pos.y - cell._height/2) + 'px';
            });
            requestAnimationFrame(update);
        })();
    }

    restartBtn.addEventListener('click', restartGame);
    restartGame();
});
