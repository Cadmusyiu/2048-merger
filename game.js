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

        // Add new tile if board changed and there's an empty cell
        if (this.hasEmptyCell() && moved) {
            this.addRandomTile();
        }
        
        this.updateBoard();
        return moved;
    }

    // Check if there are any empty cells
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

// Rest of the code remains the same...
