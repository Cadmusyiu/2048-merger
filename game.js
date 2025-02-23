class Game {
    constructor(size = 4) {
        this.size = size;
        this.board = this.createEmptyBoard();
        this.score = 0;
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
            this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
            console.log(`Added tile ${this.board[r][c]} at [${r},${c}]`);
        } else {
            console.log('No empty cells to add new tile');
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

        document.getElementById('score').textContent = this.score;
    }

    move(direction) {
        console.log(`Moving ${direction}`);
        console.log('Initial board:', this.board);

        // Create a deep copy of the current board
        const previousBoard = this.board.map(row => [...row]);
        let moved = false;

        // Slide and merge logic
        const slide = (row) => {
            // Remove zeros
            row = row.filter(val => val !== 0);
            
            // Merge adjacent equal tiles
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    this.score += row[i];
                    row.splice(i + 1, 1);
                    moved = true;
                }
            }
            
            // Pad with zeros
            while (row.length < this.size) {
                row.push(0);
            }
            
            return row;
        };

        // Movement logic for different directions
        switch(direction) {
            case 'left':
                this.board = this.board.map(row => slide(row));
                break;
            case 'right':
                this.board = this.board.map(row => slide([...row].reverse()).reverse());
                break;
            case 'up':
                // Transpose and slide
                const upTransposed = this.board[0].map((_, colIndex) => 
                    this.board.map(row => row[colIndex])
                );
                const slidUpTransposed = upTransposed.map(row => slide(row));
                this.board = slidUpTransposed[0].map((_, colIndex) => 
                    slidUpTransposed.map(row => row[colIndex])
                );
                break;
            case 'down':
                // Transpose and slide
                const downTransposed = this.board[0].map((_, colIndex) => 
                    this.board.map(row => row[colIndex])
                );
                const slidDownTransposed = downTransposed.map(row => slide([...row].reverse()).reverse());
                this.board = slidDownTransposed[0].map((_, colIndex) => 
                    slidDownTransposed.map(row => row[colIndex])
                );
                break;
        }

        console.log('Board after move:', this.board);

        // Check for empty cells
        const emptyCell = this.hasEmptyCell();
        console.log('Has empty cell:', emptyCell);

        // Check if the board actually changed
        const boardChanged = !this.board.every((row, rowIndex) => 
            row.every((cell, colIndex) => cell === previousBoard[rowIndex][colIndex])
        );
        console.log('Board changed:', boardChanged);

        // Always try to add a new tile if there's an empty cell
        if (emptyCell) {
            this.addRandomTile();
        }
        
        this.updateBoard();
        return boardChanged;
    }

    hasEmptyCell() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    return true;
                }
            }
        }
        return false;
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

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
    game = new Game();
});
