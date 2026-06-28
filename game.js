// 2048 Grip — game logic + rendering
// Logic is kept DOM-free (pure) so it can be unit-tested in Node.

class Game {
    constructor(size = 4) {
        this.size = size;
        this.grid = this.emptyGrid();   // size×size of tile|null
        this.tiles = [];                // all live tile objects
        this.score = 0;
        this.best = this.getBest();
        this.highScores = this.getHighScores();
        this.over = false;
        this.won = false;
        this.keepPlaying = false;
        this.nextId = 1;
        this._pendingRemoval = null;    // merged-away tiles awaiting DOM cleanup
        this.addRandomTile();
        this.addRandomTile();
    }

    emptyGrid() {
        return Array.from({ length: this.size }, () => Array(this.size).fill(null));
    }

    // ---------- spawn ----------
    addRandomTile() {
        const empties = [];
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++)
                if (!this.grid[r][c]) empties.push({ r, c });
        if (!empties.length) return null;
        const { r, c } = empties[Math.floor(Math.random() * empties.length)];
        const tile = {
            id: this.nextId++,
            value: Math.random() < 0.9 ? 2 : 4,   // standard 2048 spawn
            row: r, col: c,
            isNew: true,
            merged: false,
            toBeRemoved: false,
            el: null,
        };
        this.grid[r][c] = tile;
        this.tiles.push(tile);
        return tile;
    }

    // ---------- move ----------
    move(direction) {
        if (this.over) return false;
        if (this.won && !this.keepPlaying) return false;

        const vectors = {
            up:    { r: -1, c: 0 },
            down:  { r: 1, c: 0 },
            left:  { r: 0, c: -1 },
            right: { r: 0, c: 1 },
        };
        const vec = vectors[direction];
        if (!vec) return false;

        // reset per-move flags
        for (const t of this.tiles) { t.isNew = false; t.merged = false; }
        const removed = [];

        const trav = this.buildTraversals(vec);
        let moved = false;

        for (const r of trav.r) {
            for (const c of trav.c) {
                const tile = this.grid[r][c];
                if (!tile) continue;
                const { farthest, next } = this.findFarthest({ r, c }, vec);
                const nextTile = this.inBounds(next) ? this.grid[next.r][next.c] : null;

                if (nextTile && nextTile.value === tile.value && !nextTile.merged) {
                    // merge `tile` into `nextTile`
                    this.grid[r][c] = null;
                    nextTile.value *= 2;
                    nextTile.merged = true;
                    this.score += nextTile.value;
                    if (nextTile.value === 2048 && !this.won) this.won = true;
                    // `tile` slides to nextTile's cell then is retired
                    tile.row = nextTile.row;
                    tile.col = nextTile.col;
                    tile.toBeRemoved = true;
                    removed.push(tile);
                    moved = true;
                } else if (farthest.r !== r || farthest.c !== c) {
                    this.grid[r][c] = null;
                    this.grid[farthest.r][farthest.c] = tile;
                    tile.row = farthest.r;
                    tile.col = farthest.c;
                    moved = true;
                }
            }
        }

        if (moved) {
            this._pendingRemoval = removed;
            this.addRandomTile();
            if (this.score > this.best) { this.best = this.score; this.saveBest(); }
            if (!this.hasMoves()) { this.over = true; this.recordHighScore(); }
        }
        return moved;
    }

    buildTraversals(vec) {
        const r = Array.from({ length: this.size }, (_, i) => i);
        const c = Array.from({ length: this.size }, (_, i) => i);
        if (vec.r === 1) r.reverse();   // down  → process bottom-up
        if (vec.c === 1) c.reverse();   // right → process right-to-left
        return { r, c };
    }

    findFarthest(cell, vec) {
        let prev, cur = cell;
        do {
            prev = cur;
            cur = { r: prev.r + vec.r, c: prev.c + vec.c };
        } while (this.inBounds(cur) && !this.grid[cur.r][cur.c]);
        return { farthest: prev, next: cur };
    }

    inBounds(cell) {
        return cell.r >= 0 && cell.r < this.size && cell.c >= 0 && cell.c < this.size;
    }

    // CORRECT move-availability: any empty cell OR any adjacent equal pair
    hasMoves() {
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++)
                if (!this.grid[r][c]) return true;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const v = this.grid[r][c].value;
                if (c < this.size - 1 && this.grid[r][c + 1].value === v) return true;
                if (r < this.size - 1 && this.grid[r + 1][c].value === v) return true;
            }
        }
        return false;
    }

    // ---------- persistence ----------
    getBest() { return +(this._store().getItem('2048GripBest') || 0); }
    saveBest() { this._store().setItem('2048GripBest', String(this.best)); }
    getHighScores() {
        try { return JSON.parse(this._store().getItem('2048GripHighScores') || '[]'); }
        catch { return []; }
    }
    recordHighScore() {
        this.highScores.push(this.score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5);
        this._store().setItem('2048GripHighScores', JSON.stringify(this.highScores));
    }
    _store() {
        return (typeof localStorage !== 'undefined')
            ? localStorage
            : { getItem: () => null, setItem: () => {} };
    }
}

// =====================================================================
// Rendering + input (browser only)
// =====================================================================
function init() {
    const BOARD_PADDING = 10;
    const BOARD_GAP = 10;
    const SLIDE_MS = 120;

    const boardEl = document.getElementById('game-board');
    const bgEl = document.getElementById('grid-bg');
    const tileLayer = document.getElementById('tile-layer');
    const scoreEl = document.getElementById('score-value');
    const bestEl = document.getElementById('best-value');
    const gameOverModal = document.getElementById('game-over-modal');
    const winModal = document.getElementById('win-modal');
    const finalScoreEl = document.getElementById('final-score');
    const rankingEl = document.getElementById('ranking-list');

    let game;
    let cellSize = 0;
    let winShown = false;

    // ---- layout ----
    function measureCell() {
        const w = boardEl.clientWidth;
        cellSize = (w - 2 * BOARD_PADDING - 3 * BOARD_GAP) / game.size;
        for (const t of game.tiles) positionTile(t, false);
        for (const cell of bgEl.children) {
            cell.style.width = cellSize + 'px';
            cell.style.height = cellSize + 'px';
        }
    }

    function cellPixel(r, c) {
        return {
            x: BOARD_PADDING + c * (cellSize + BOARD_GAP),
            y: BOARD_PADDING + r * (cellSize + BOARD_GAP),
        };
    }

    function fontSizeFor(value) {
        const len = String(value).length;
        let factor = 0.46;
        if (len === 3) factor = 0.36;
        else if (len === 4) factor = 0.30;
        else if (len >= 5) factor = 0.24;
        return Math.max(8, cellSize * factor);
    }

    function ensureEl(tile) {
        if (tile.el) return tile.el;
        const el = document.createElement('div');
        el.className = 'tile';
        tileLayer.appendChild(el);
        tile.el = el;
        return el;
    }

    function positionTile(tile, animateNew) {
        const el = ensureEl(tile);
        const { x, y } = cellPixel(tile.row, tile.col);
        el.style.width = cellSize + 'px';
        el.style.height = cellSize + 'px';
        // position via left/top so transform stays free for spawn/pop scale animations
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.fontSize = fontSizeFor(tile.value) + 'px';
        el.textContent = tile.value;
        let cls = 'tile tile-' + (tile.value <= 2048 ? tile.value : 'super');
        if (animateNew && tile.isNew) cls += ' tile-new';
        if (tile.merged) cls += ' tile-merged';
        el.className = cls;
    }

    function render() {
        scoreEl.textContent = game.score;
        bestEl.textContent = game.best;

        for (const t of game.tiles) positionTile(t, true);

        // retire merged-away tiles after the slide finishes
        const pending = game._pendingRemoval;
        if (pending && pending.length) {
            game._pendingRemoval = null;
            setTimeout(() => {
                for (const t of pending) if (t.el) { t.el.remove(); t.el = null; }
                game.tiles = game.tiles.filter(t => !t.toBeRemoved);
            }, SLIDE_MS + 20);
        }

        if (game.won && !winShown) { winShown = true; showWin(); }
        if (game.over) showGameOver();
    }

    function showWin() {
        document.getElementById('win-score').textContent = game.score;
        winModal.style.display = 'flex';
    }

    function showGameOver() {
        finalScoreEl.textContent = game.score;
        rankingEl.innerHTML = '';
        const scores = game.highScores.length ? game.highScores : [game.score];
        scores.forEach((score, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Rank ${index + 1}</span><span>${score}</span>`;
            rankingEl.appendChild(li);
        });
        gameOverModal.style.display = 'flex';
    }

    function newGame() {
        tileLayer.innerHTML = '';
        game = new Game();
        winShown = false;
        gameOverModal.style.display = 'none';
        winModal.style.display = 'none';
        measureCell();
        render();
    }

    function handleMove(direction) {
        const moved = game.move(direction);
        if (moved) render();
    }

    // ---- input ----
    const keyMap = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
        A: 'left', D: 'right', W: 'up', S: 'down',
    };
    document.addEventListener('keydown', (e) => {
        const dir = keyMap[e.key];
        if (dir) { e.preventDefault(); handleMove(dir); }
    });

    let sx = 0, sy = 0, tracking = false;
    boardEl.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    boardEl.addEventListener('touchend', (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        const TH = 30;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TH) return;
        if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
        else handleMove(dy > 0 ? 'down' : 'up');
    }, { passive: true });

    // ---- buttons ----
    document.getElementById('restart-btn').addEventListener('click', newGame);
    document.getElementById('close-modal').addEventListener('click', newGame);
    document.getElementById('keep-playing-btn').addEventListener('click', () => {
        game.keepPlaying = true;
        winModal.style.display = 'none';
    });
    document.getElementById('win-new-btn').addEventListener('click', newGame);

    window.addEventListener('resize', () => { if (game) measureCell(); });

    newGame();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}
