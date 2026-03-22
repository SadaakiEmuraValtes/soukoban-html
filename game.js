'use strict';

// セル種別
const CELL = {
  EMPTY:     0,
  WALL:      1,
  FLOOR:     2,
  GOAL:      3,
  BOX:       4,
  BOX_GOAL:  5,
  PLAYER:    6,
  PLAYER_GOAL: 7,
};

const TILE = 52; // ピクセル

// 色パレット
const COLOR = {
  bg:        '#16213e',
  wall:      '#4a4a6a',
  wallEdge:  '#6a6a9a',
  floor:     '#1e2d4d',
  goal:      '#d4700040',
  goalMark:  '#d47000',
  box:       '#c8862a',
  boxEdge:   '#e8a640',
  boxGoal:   '#4caf50',
  boxGoalEdge: '#81c784',
  player:    '#5b9cf6',
  playerEdge: '#82b1ff',
};

class Sokoban {
  constructor() {
    this.canvas  = document.getElementById('game-canvas');
    this.ctx     = this.canvas.getContext('2d');
    this.stageIndex = 0;
    this.moves   = 0;
    this.history = [];
    this.cleared = false;

    this.bindUI();
    this.loadStage(0);
    this.bindKeys();
  }

  // ---- ステージ読み込み ----

  loadStage(idx) {
    this.stageIndex = idx;
    this.moves = 0;
    this.history = [];
    this.cleared = false;

    const raw = LEVELS[idx];
    const rows = raw.length;
    const cols = Math.max(...raw.map(r => r.length));

    this.grid = raw.map(row => {
      const cells = [];
      for (let c = 0; c < cols; c++) {
        cells.push(this.charToCell(row[c] || ' '));
      }
      return cells;
    });
    this.rows = rows;
    this.cols = cols;

    // プレイヤー初期位置
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = this.grid[r][c];
        if (v === CELL.PLAYER || v === CELL.PLAYER_GOAL) {
          this.py = r; this.px = c;
        }
      }
    }

    // キャンバスサイズ
    this.canvas.width  = cols * TILE;
    this.canvas.height = rows * TILE;

    this.updateUI();
    this.draw();
  }

  charToCell(ch) {
    switch (ch) {
      case '#': return CELL.WALL;
      case '@': return CELL.PLAYER;
      case '+': return CELL.PLAYER_GOAL;
      case '$': return CELL.BOX;
      case '*': return CELL.BOX_GOAL;
      case '.': return CELL.GOAL;
      case ' ': return CELL.FLOOR;
      default:  return CELL.EMPTY;
    }
  }

  // ---- 移動 ----

  move(dr, dc) {
    if (this.cleared) return;
    const nr = this.py + dr;
    const nc = this.px + dc;
    if (!this.inBounds(nr, nc)) return;

    const dest = this.grid[nr][nc];

    if (dest === CELL.WALL || dest === CELL.EMPTY) return;

    const snapshot = {
      py: this.py, px: this.px,
      grid: this.grid.map(row => [...row]),
    };

    if (dest === CELL.BOX || dest === CELL.BOX_GOAL) {
      // 箱を押せるか
      const br = nr + dr;
      const bc = nc + dc;
      if (!this.inBounds(br, bc)) return;
      const beyond = this.grid[br][bc];
      if (beyond === CELL.WALL || beyond === CELL.EMPTY ||
          beyond === CELL.BOX  || beyond === CELL.BOX_GOAL) return;

      // 箱移動
      this.setCell(br, bc, beyond === CELL.GOAL ? CELL.BOX_GOAL : CELL.BOX);
      this.setCell(nr, nc, dest === CELL.BOX_GOAL ? CELL.PLAYER_GOAL : CELL.PLAYER);
    } else {
      this.setCell(nr, nc, dest === CELL.GOAL ? CELL.PLAYER_GOAL : CELL.PLAYER);
    }

    // プレイヤー元位置を床/ゴールに
    const was = snapshot.grid[this.py][this.px];
    this.setCell(this.py, this.px, was === CELL.PLAYER_GOAL ? CELL.GOAL : CELL.FLOOR);

    this.py = nr; this.px = nc;
    this.moves++;
    this.history.push(snapshot);

    this.updateUI();
    this.draw();

    if (this.isClear()) {
      this.cleared = true;
      setTimeout(() => this.showClear(), 300);
    }
  }

  undo() {
    if (this.history.length === 0 || this.cleared) return;
    const snap = this.history.pop();
    this.py = snap.py;
    this.px = snap.px;
    this.grid = snap.grid.map(row => [...row]);
    this.moves = Math.max(0, this.moves - 1);
    this.updateUI();
    this.draw();
  }

  setCell(r, c, v) {
    this.grid[r][c] = v;
  }

  inBounds(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  isClear() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === CELL.BOX) return false;
        if (this.grid[r][c] === CELL.GOAL) return false;
        if (this.grid[r][c] === CELL.PLAYER_GOAL) return false;
      }
    }
    return true;
  }

  // ---- 描画 ----

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * TILE, y = r * TILE;
        this.drawCell(ctx, this.grid[r][c], x, y);
      }
    }
  }

  drawCell(ctx, cell, x, y) {
    const T = TILE, P = 4; // padding

    if (cell === CELL.EMPTY) return;

    // 床
    if (cell !== CELL.WALL) {
      ctx.fillStyle = COLOR.floor;
      ctx.fillRect(x, y, T, T);
    }

    switch (cell) {
      case CELL.WALL:
        this.drawWall(ctx, x, y);
        break;

      case CELL.GOAL:
        this.drawGoalMark(ctx, x, y);
        break;

      case CELL.BOX:
        this.drawBox(ctx, x, y, COLOR.box, COLOR.boxEdge, false);
        break;

      case CELL.BOX_GOAL:
        this.drawBox(ctx, x, y, COLOR.boxGoal, COLOR.boxGoalEdge, true);
        break;

      case CELL.PLAYER:
        this.drawPlayer(ctx, x, y);
        break;

      case CELL.PLAYER_GOAL:
        this.drawGoalMark(ctx, x, y);
        this.drawPlayer(ctx, x, y);
        break;
    }
  }

  drawWall(ctx, x, y) {
    const T = TILE;
    ctx.fillStyle = COLOR.wall;
    ctx.fillRect(x, y, T, T);

    // ハイライト・シャドウ
    ctx.fillStyle = COLOR.wallEdge;
    ctx.fillRect(x, y, T, 3);
    ctx.fillRect(x, y, 3, T);

    ctx.fillStyle = '#333355';
    ctx.fillRect(x + T - 3, y, 3, T);
    ctx.fillRect(x, y + T - 3, T, 3);

    // れんが模様
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(x + 4, y + T / 2 - 1, T - 8, 2);
    ctx.fillRect(x + T / 2 - 1, y + 4, 2, T / 2 - 6);
    ctx.fillRect(x + 4, y + 4, T / 2 - 8, 2);
    ctx.fillRect(x + T / 2 + 4, y + T / 2 + 4, T / 2 - 8, 2);
  }

  drawGoalMark(ctx, x, y) {
    const cx = x + TILE / 2, cy = y + TILE / 2, r = TILE / 2 - 10;
    ctx.strokeStyle = COLOR.goalMark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  drawBox(ctx, x, y, fill, edge, onGoal) {
    const T = TILE, P = 6;
    ctx.fillStyle = fill;
    this.roundRect(ctx, x + P, y + P, T - P * 2, T - P * 2, 6);
    ctx.fill();

    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    this.roundRect(ctx, x + P, y + P, T - P * 2, T - P * 2, 6);
    ctx.stroke();

    // 斜線 or チェックマーク
    if (onGoal) {
      ctx.strokeStyle = '#fff8';
      ctx.lineWidth = 2.5;
      const cx = x + T / 2, cy = y + T / 2, s = 9;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy);
      ctx.lineTo(cx - 3, cy + s - 2);
      ctx.lineTo(cx + s, cy - s + 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#fff3';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + P + 4, y + P + 4);
      ctx.lineTo(x + T - P - 4, y + T - P - 4);
      ctx.moveTo(x + T - P - 4, y + P + 4);
      ctx.lineTo(x + P + 4, y + T - P - 4);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  drawPlayer(ctx, x, y) {
    const cx = x + TILE / 2, cy = y + TILE / 2;

    // 体
    ctx.fillStyle = COLOR.player;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 頭
    ctx.fillStyle = COLOR.playerEdge;
    ctx.beginPath();
    ctx.arc(cx, cy - 9, 10, 0, Math.PI * 2);
    ctx.fill();

    // 目
    ctx.fillStyle = COLOR.bg;
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 10, 2, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ---- UI ----

  updateUI() {
    document.getElementById('stage-num').textContent  = this.stageIndex + 1;
    document.getElementById('move-count').textContent = this.moves;
    document.getElementById('btn-prev').disabled = this.stageIndex <= 0;
    document.getElementById('btn-next').disabled = this.stageIndex >= LEVELS.length - 1;
  }

  showClear() {
    const isLast = this.stageIndex >= LEVELS.length - 1;
    if (isLast) {
      document.getElementById('all-clear-modal').classList.remove('hidden');
    } else {
      document.getElementById('clear-moves').textContent = this.moves;
      document.getElementById('clear-modal').classList.remove('hidden');
    }
  }

  // ---- イベント ----

  bindKeys() {
    document.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); this.move(-1,  0); break;
        case 'ArrowDown':  e.preventDefault(); this.move( 1,  0); break;
        case 'ArrowLeft':  e.preventDefault(); this.move( 0, -1); break;
        case 'ArrowRight': e.preventDefault(); this.move( 0,  1); break;
        case 'r': case 'R': this.loadStage(this.stageIndex); break;
        case 'z': case 'Z': this.undo(); break;
      }
    });
  }

  bindUI() {
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.loadStage(this.stageIndex);
    });
    document.getElementById('btn-prev').addEventListener('click', () => {
      if (this.stageIndex > 0) this.loadStage(this.stageIndex - 1);
    });
    document.getElementById('btn-next').addEventListener('click', () => {
      if (this.stageIndex < LEVELS.length - 1) this.loadStage(this.stageIndex + 1);
    });

    // クリアモーダル
    document.getElementById('btn-modal-next').addEventListener('click', () => {
      document.getElementById('clear-modal').classList.add('hidden');
      this.loadStage(this.stageIndex + 1);
    });
    document.getElementById('btn-modal-restart').addEventListener('click', () => {
      document.getElementById('clear-modal').classList.add('hidden');
      this.loadStage(this.stageIndex);
    });

    // 全クリアモーダル
    document.getElementById('btn-all-restart').addEventListener('click', () => {
      document.getElementById('all-clear-modal').classList.add('hidden');
      this.loadStage(0);
    });
  }
}

// 起動
window.addEventListener('DOMContentLoaded', () => {
  new Sokoban();
});
