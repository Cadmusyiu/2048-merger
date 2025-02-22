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
        console.log('Initial Board:', this.board); // Debug log
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
            console.log(`Added tile ${this.board[r][c]} at [${r},${c}]`); // Debug log
        }
    }

    // Move tiles in a specific direction
    move(direction) {
        console.log(`Moving ${direction}`); // Debug log
        let moved = false;

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
                this.board = this.board.map(row => slide([...row]));
                break;
            case 'right':
                this.board = this.board.map(row => slide([...row].reverse()).reverse());
                break;
            case 'up':
                // Transpose and slide
                const upTransposed = this.board[0].map((_, colIndex) => 
                    this.board.map(row => row[colIndex])
                );
                const slidUpTransposed = upTransposed.map(row => slide([...row]));
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

        console.log(`Board after ${direction} move:`, this.board); // Debug log

        // Add a new tile if the grid changed
        if (moved) {
            this.addRandomTile();
            this.updateBoard();
            this.checkGameOver();
        }

        return moved;
    }

    // Rest of the class remains the same...
}

// Touch controls
document.getElementById('game-board').addEventListener('touchstart', (e) => {
    console.log('Touch started'); // Debug log
    e.preventDefault();
    window.touchStartX = e.touches[0].clientX;
    window.touchStartY = e.touches[0].clientY;
}, { passive: false });

document.getElementById('game-board').addEventListener('touchend', (e) => {
    console.log('Touch ended'); // Debug log
    e.preventDefault();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - window.touchStartX;
    const diffY = touchEndY - window.touchStartY;

    console.log(`Swipe detected: diffX=${diffX}, diffY=${diffY}`); // Debug log

    const SWIPE_THRESHOLD = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) {
                console.log('Swiping right'); // Debug log
                game.move('right');
            } else {
                console.log('Swiping left'); // Debug log
                game.move('left');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > SWIPE_THRESHOLD) {
            if (diffY > 0) {
                console.log('Swiping down'); // Debug log
                game.move('down');
            } else {
                console.log('Swiping up'); // Debug log
                game.move('up');
            }
        }
    }
}, { passive: false });
