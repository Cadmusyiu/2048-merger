class Game {
    constructor(size = 4) {
        this.size = size;
        this.board = Array(size).fill().map(() => Array(size).fill(0));
        this.score = 0;
        this.initializeBoard();
    }

    // Initialize the game board with two starting tiles
    initializeBoard() {
        this.addRandomTile();
        this.addRandomTile();
        this.updateBoard();
    }

    // Add a random tile (2 or 4) to an empty cell
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
            this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    // Update the visual game board
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

        document.getElementById('score').textContent = this.score;
    }

    // Move tiles in a specific direction
    move(direction) {
        let moved = false;

        // Helper function to rotate the grid
        const rotateGrid = (grid) => {
            return grid[0].map((val, index) => 
                grid.map(row => row[index]).reverse()
            );
        };

        // Core merge and slide logic
        const slide = (row) => {
            // Remove zeros
            row = row.filter(val => val !== 0);
            
            // Merge adjacent equal tiles
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;  // Merge tiles
                    row.splice(i + 1, 1);  // Remove the merged tile
                    this.score += row[i];  // Update score
                    moved = true;
                }
            }
            
            // Pad with zeros to maintain grid size
            while (row.length < this.size) {
                row.push(0);
            }
            
            return row;
        };

        // Process grid based on direction
        switch(direction) {
            case 'left':
                this.board = this.board.map(row => slide(row));
                break;
            case 'right':
                this.board = this.board.map(row => slide(row.reverse()).reverse());
                break;
            case 'up':
                // Rotate, slide, then rotate back
                this.board = rotateGrid(rotateGrid(rotateGrid(
                    rotateGrid(this.board).map(row => slide(row))
                )));
                break;
            case 'down':
                // Rotate, slide, then rotate back
                this.board = rotateGrid(
                    rotateGrid(this.board).map(row => slide(row.reverse()).reverse())
                );
                break;
        }

        // Add a new tile if the grid changed
        if (moved) {
            this.addRandomTile();
            this.updateBoard();
            this.checkGameOver();
        }

        return moved;
    }

    // Check if game is over
    checkGameOver() {
        // Check if any empty cells exist
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) return false;
            }
        }

        // Check if any adjacent cells can merge
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                // Check right
                if (c < this.size - 1 && this.board[r][c] === this.board[r][c+1]) return false;
                // Check down
                if (r < this.size - 1 && this.board[r][c] === this.board[r+1][c]) return false;
            }
        }

        alert('Game Over! Your score: ' + this.score);
        return true;
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

// Touch controls for mobile
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

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    game = new Game();
});
