// Node test for the pure Game logic in game.js
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/game.js', 'utf8');
const Game = new Function(code + '\n;return Game;')();

let pass = 0, fail = 0;
function ok(name, cond, extra = '') {
    if (cond) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}  ${extra}`); }
}

// Build a game with a deterministic grid; disable random spawn during move.
function setup(rows) {
    const g = new Game();
    g.grid = g.emptyGrid();
    g.tiles = [];
    g.nextId = 1;
    g.score = 0;
    g.won = false;
    g.over = false;
    g.keepPlaying = true;            // allow moves even after a win, for testing
    g.addRandomTile = () => null;    // deterministic: no spawn
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const v = rows[r][c];
        if (v) {
            const t = { id: g.nextId++, value: v, row: r, col: c, isNew: false, merged: false, toBeRemoved: false, el: null };
            g.grid[r][c] = t; g.tiles.push(t);
        }
    }
    return g;
}
const vals = (g) => g.grid.map(row => row.map(t => t ? t.value : 0));

// 1. Basic left merge
let g = setup([[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
ok('left: [2,2,0,0] -> [4,0,0,0], score 4',
    vals(g)[0].join(',') === '4,0,0,0' && g.score === 4, 'got ' + vals(g)[0]);

// 2. Double merge in one row
g = setup([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
ok('left: [2,2,2,2] -> [4,4,0,0], score 8',
    vals(g)[0].join(',') === '4,4,0,0' && g.score === 8, 'got ' + vals(g)[0]);

// 3. No triple merge (each tile merges once)
g = setup([[4,4,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
ok('left: [4,4,2,2] -> [8,4,0,0], score 12',
    vals(g)[0].join(',') === '8,4,0,0' && g.score === 12, 'got ' + vals(g)[0]);

// 4. Right merge
g = setup([[0,0,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('right');
ok('right: [0,0,2,2] -> [0,0,0,4], score 4',
    vals(g)[0].join(',') === '0,0,0,4' && g.score === 4, 'got ' + vals(g)[0]);

// 5. Up merge (column)
g = setup([[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('up');
ok('up: col [2,2,0,0] -> [4,0,0,0], score 4',
    vals(g)[0].join(',') === '4,0,0,0' && g.score === 4, 'got row0 ' + vals(g)[0]);

// 6. Down merge (column)
g = setup([[2,0,0,0],[2,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('down');
ok('down: col [2,2,0,0] -> [0,0,0,4], score 4',
    vals(g)[3].join(',') === '4,0,0,0' && g.score === 4, 'got row3 ' + vals(g)[3]);

// 7. moved=false when nothing changes
g = setup([[2,4,2,4],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
const moved = g.move('left');
ok('left on [2,4,2,4] -> moved=false (no change)', moved === false, 'moved=' + moved);

// 8. THE BUG FIX: full board, adjacent equal pair (sum != 24) => hasMoves must be TRUE
g = setup([[2,2,4,8],[16,32,64,128],[2,4,8,16],[32,64,128,256]]);
// board is full; row0 has [2,2,...] adjacent equal -> a real merge exists
ok('hasMoves TRUE with adjacent equal (old sum=24 bug would say FALSE)', g.hasMoves() === true,
   'hasMoves=' + g.hasMoves());

// 9. Truly stuck full board => hasMoves FALSE
g = setup([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]);
ok('hasMoves FALSE when board full & no adjacent equal', g.hasMoves() === false,
   'hasMoves=' + g.hasMoves());

// 10. Win detection at 2048
g = setup([[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
ok('merging 1024+1024 sets won=true', g.won === true, 'won=' + g.won);

// 11. game.over set when a move locks the board (real move that fills last cell)
//     Row0 [2,2,8,16] merges -> frees (0,3); spawn value 2 there; result is locked.
g = setup([[2,2,8,16],[32,64,128,256],[4,8,16,32],[64,128,256,512]]);
g.addRandomTile = Game.prototype.addRandomTile;   // restore real spawn for this test
const _r = Math.random; Math.random = () => 0;     // deterministic: value 2 at the only empty cell
const m11 = g.move('left');
Math.random = _r;
ok('move that locks the board sets over=true', m11 === true && g.over === true,
   'moved=' + m11 + ' over=' + g.over + ' board=' + JSON.stringify(vals(g)));

// 12. Undo restores the exact pre-move board and score
g = setup([[2,2,4,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.score = 100;
g.move('left');
ok('undo 前提：move 有效且改變盤面', vals(g)[0].join(',') === '4,4,0,0' && g.score === 104);
ok('undo 回傳 true 並還原盤面與分數',
    g.undo() === true && vals(g)[0].join(',') === '2,2,4,0' && g.score === 100,
    'got ' + vals(g)[0] + ' score=' + g.score);

// 13. Double undo blocked（一步為限）
ok('連續 undo 第二次被擋', g.undo() === false);

// 14. Unmoved move does not overwrite the undo snapshot
g = setup([[2,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');                 // no-op：已靠左且無可合併
ok('無效移動不建立 undo snapshot', g.prevState === null);

// 15. Undo out of game over（死局救回）
g = setup([[2,2,8,16],[32,64,128,256],[4,8,16,32],[64,128,256,512]]);
g.addRandomTile = Game.prototype.addRandomTile;
const _r2 = Math.random; Math.random = () => 0;
g.move('left');                 // 這步導致鎖盤 game over（同 test 11）
Math.random = _r2;
ok('undo 前提：盤面已 game over', g.over === true);
ok('game over 後 undo 救回（over=false、盤面還原）',
    g.undo() === true && g.over === false && vals(g)[0].join(',') === '2,2,8,16',
    'over=' + g.over + ' row0=' + vals(g)[0]);

// 16. lastGain 累計該步合併得分（雙合併 = 4+4）
g = setup([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
ok('lastGain = 該步合併總分 (8)', g.lastGain === 8, 'lastGain=' + g.lastGain);
g2 = setup([[2,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
g2.move('right');               // 純滑動無合併
ok('純滑動 lastGain = 0', g2.lastGain === 0, 'lastGain=' + g2.lastGain);

// 17. Undo 後 tiles/grid 一致性（每格 tile 的 row/col 與位置相符）
g = setup([[2,2,0,0],[4,0,4,0],[0,0,0,0],[0,0,0,0]]);
g.move('left');
g.undo();
let consistent = g.tiles.length === 4;
for (const t of g.tiles) if (g.grid[t.row][t.col] !== t) consistent = false;
ok('undo 後 grid ↔ tiles 完全一致', consistent);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
