class Game {
    constructor(size = 4) {
        this.size = size;
        this.board = this.createEmptyBoard();
        this.score = 0;
        this.highScores = this.getHighScores();
        this.initializeBoard();
    }

    createEmptyBoard() {
        return Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    initializeBoard() {
        this.addRandomTile();
        this.addRandomTile();
        this.updateBoard();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({r, c});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[r][c] = Math.random() < 0.9 ? 2 : 8;
        }
    }

    updateBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                
                if (this.board[r][c] !== 0) {
                    tile.textContent = this.board[r][c];
                    tile.classList.add(`tile-${this.board[r][c]}`);
                }

                gameBoard.appendChild(tile);
            }
        }

        document.getElementById('score-value').textContent = this.score;
    }

    move(direction) {
        const previousBoard = this.board.map(row => [...row]);
        let moved = false;

        const slide = (row) => {
            // Remove zeros
            row = row.filter(val => val !== 0);
            
            // Merge tiles that can create 24
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] + row[i + 1] === 24) {
                    row[i] = 24;
                    row.splice(i + 1, 1);
                    this.score += 24;
                    moved = true;
                    break;
                }
            }
            
            // Pad with zeros
            while (row.length < this.size) {
                row.push(0);
            }
            
            return row;
        };

        switch(direction) {
            case 'left':
                this.board = this.board.map(row => slide(row));
                break;
            case 'right':
                this.board = this.board.map(row => slide([...row].reverse()).reverse());
                break;
            case 'up':
                const upTransposed = this.board[0].map((_, colIndex) => 
                    this.board.map(row => row[colIndex])
                );
                const slidUpTransposed = upTransposed.map(row => slide(row));
                this.board = slidUpTransposed[0].map((_, colIndex) => 
                    slidUpTransposed.map(row => row[colIndex])
                );
                break;
            case 'down':
                const downTransposed = this.board[0].map((_, colIndex) => 
                    this.board.map(row => row[colIndex])
                );
                const slidDownTransposed = downTransposed.map(row => slide([...row].reverse()).reverse());
                this.board = slidDownTransposed[0].map((_, colIndex) => 
                    slidDownTransposed.map(row => row[colIndex])
                );
                break;
        }

        // Check if board changed
        const boardChanged = !this.board.every((row, rowIndex) => 
            row.every((cell, colIndex) => cell === previousBoard[rowIndex][colIndex])
        );

        if (boardChanged) {
            this.addRandomTile();
            this.updateBoard();
            
            // Check if no more moves are possible
            if (!this.hasPossibleMoves()) {
                this.gameOver();
            }
        }

        return boardChanged;
    }

    hasPossibleMoves() {
        // Check if any empty cells exist
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) return true;
            }
        }

        // Check if any adjacent cells can merge to 24
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                // Check right
                if (c < this.size - 1 && 
                    this.board[r][c] + this.board[r][c+1] === 24) return true;
                // Check down
                if (r < this.size - 1 && 
                    this.board[r][c] + this.board[r+1][c] === 24) return true;
            }
        }

        return false;
    }

    gameOver() {
        // Update high scores
        this.highScores.push(this.score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5);
        this.saveHighScores();

        // Show game over modal
        const modal = document.getElementById('game-over-modal');
        const finalScoreElem = document.getElementById('final-score');
        const rankingList = document.getElementById('ranking-list');

        finalScoreElem.textContent = this.score;

        // Populate high scores
        rankingList.innerHTML = '';
        this.highScores.forEach((score, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Rank ${index + 1}</span>
                <span>${score}</span>
            `;
            rankingList.appendChild(li);
        });

        modal.style.display = 'flex';
    }

    getHighScores() {
        const scores = localStorage.getItem('24GripHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScores() {
        localStorage.setItem('24GripHighScores', JSON.stringify(this.highScores));
    }
}

// Initialize the game
let game = new Game();

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            game.move('left');
            break;
        case 'ArrowRight':
            game.move('right');
            break;
        case 'ArrowUp':
            game.move('up');
            break;
        case 'ArrowDown':
            game.move('down');
            break;
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

document.getElementById('game-board').addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

document.getElementById('game-board').addEventListener('touchend', (e) => {
    e.preventDefault();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    const SWIPE_THRESHOLD = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) {
                game.move('right');
            } else {
                game.move('left');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > SWIPE_THRESHOLD) {
            if (diffY > 0) {
                game.move('down');
            } else {
                game.move('up');
            }
        }
    }
}, { passive: false });

// Close game over modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('game-over-modal').style.display = 'none';
    game = new Game();
});

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    game = new Game();
});
