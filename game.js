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
        while (row.length < this.gridSize) {
            row.push(0);
        }
        
        return row;
    };

    // Process grid based on direction
    switch(direction) {
        case 'left':
            this.grid = this.grid.map(row => slide(row));
            break;
        case 'right':
            this.grid = this.grid.map(row => slide(row.reverse()).reverse());
            break;
        case 'up':
            // Rotate, slide, then rotate back
            this.grid = rotateGrid(rotateGrid(rotateGrid(
                rotateGrid(this.grid).map(row => slide(row))
            )));
            break;
        case 'down':
            // Rotate, slide, then rotate back
            this.grid = rotateGrid(
                rotateGrid(this.grid).map(row => slide(row.reverse()).reverse())
            );
            break;
    }

    // Add a new tile if the grid changed
    if (moved) {
        this.addRandomTile();
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
const game = new Game();

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
    // Prevent default scroll behavior
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

document.getElementById('game-board').addEventListener('touchend', (e) => {
    // Prevent default browser behavior
    e.preventDefault();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Determine swipe direction with a minimum threshold
    const SWIPE_THRESHOLD = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) {
                console.log('Swiping right');
                game.move('right');
            } else {
                console.log('Swiping left');
                game.move('left');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > SWIPE_THRESHOLD) {
            if (diffY > 0) {
                console.log('Swiping down');
                game.move('down');
            } else {
                console.log('Swiping up');
                game.move('up');
            }
        }
    }
}, { passive: false });

// Restart button code with this
let game = new Game(); // Declare game as a let instead of const

document.getElementById('restart-btn').addEventListener('click', () => {
    // Reinitialize the game
    game = new Game();
});

// Add this at the end of game.js
document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    
    // Log when event listeners are added
    console.log('Touch event listeners being set up');

    gameBoard.addEventListener('touchstart', (e) => {
        console.log('Touch start:', e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault(); // Prevent default touch behavior
    }, { passive: false });

    gameBoard.addEventListener('touchmove', (e) => {
        console.log('Touch move:', e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault(); // Prevent scrolling
    }, { passive: false });

    gameBoard.addEventListener('touchend', (e) => {
        console.log('Touch end detected');
        
        // Ensure a global game object exists
        if (typeof game === 'undefined') {
            console.error('Game object not found');
            return;
        }

        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;

        console.log('Touch end coordinates:', endX, endY);

        // Simplified swipe detection
        const swipeThreshold = 50;
        const swipeDirection = Math.abs(endX - startX) > Math.abs(endY - startY)
            ? (endX > startX ? 'right' : 'left')
            : (endY > startY ? 'down' : 'up');

        console.log('Detected swipe direction:', swipeDirection);

        // Attempt to move
        try {
            game.move(swipeDirection);
            console.log('Move attempted:', swipeDirection);
        } catch (error) {
            console.error('Error moving:', error);
        }
    }, { passive: false });

    // Track start coordinates globally
    let startX, startY;
    gameBoard.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        console.log('Start coordinates:', startX, startY);
    });
});
