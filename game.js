// PENGTAL MVP (난이도 선택 + 자동 생성 + 힌트 + 실패 재시작)

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const uiMoves = document.getElementById('moves');
const uiGoal = document.getElementById('goal');
const uiDifficulty = document.getElementById('difficultyPill');

const btnHint = document.getElementById('btnHint');
const btnRestart = document.getElementById('btnRestart');
const btnMenu = document.getElementById('btnMenu');

const startOverlay = document.getElementById('startOverlay');
const diffOverlay = document.getElementById('diffOverlay');
const failOverlay = document.getElementById('failOverlay');

const msgWrap = document.getElementById('msg');
const msgText = document.getElementById('msgText');

function toast(text){
  msgText.textContent = text;
  msgWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>msgWrap.classList.remove('show'), 1100);
}

function show(el){ el.classList.add('show'); }
function hide(el){ el.classList.remove('show'); }

// --------------------
// Difficulty spec
// --------------------
const DIFFS = {
  1: { name: "1단계", W: 5, goalMinMovesMax: 3 },
  2: { name: "2단계", W: 5, goalMinMovesMax: 5 },
  3: { name: "3단계", W: 7, goalMinMovesMax: 10 },
};

// --------------------
// Core Game State
// --------------------
let W = 5;
let home = {x:2,y:2};
let blocks = [];
let penguins = []; // {x,y}
let moves = 0;
let busy = false;
let gameOver = false;
let cleared = false;

let pointerDown = false;
let selected = -1;
let downPos = {x:0,y:0};
let lastPointer = {x:0,y:0};

// 현재 퍼즐(재시작을 위해 저장)
let currentPuzzle = null; // { W, blocks:[[x,y]...], penguins:[[x,y]...] , diffLevel, goalMax }
let currentDiffLevel = null;

// --------------------
// Helpers
// --------------------
function inBounds(x,y){ return x>=0 && y>=0 && x<W && y<W; }
function cellBlocked(x,y){
  for(const b of blocks) if(b.x===x && b.y===y) return true;
  return false;
}
function penguinAt(x,y, except=-1){
  for(let i=0;i<penguins.length;i++){
    if(i===except) continue;
    if(penguins[i].x===x && penguins[i].y===y) return i;
  }
  return -1;
}
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function resetRuntimeState(){
  moves = 0;
  busy = false;
  gameOver = false;
  cleared = false;
  pointerDown = false;
  selected = -1;
  uiMoves.textContent = moves;
  btnHint.disabled = false;
  btnRestart.disabled = false;
}

// --------------------
// Solver (for hint & difficulty target)
// --------------------
const DIRS = [
  {x: 1, y: 0}, // R
  {x:-1, y: 0}, // L
  {x: 0, y: 1}, // D
  {x: 0, y:-1}, // U
];
const DIR_NAMES = ["R","L","D","U"];

function stateKey(posArr){
  return posArr.map(p => `${p.x},${p.y}`).join("|");
}
function clonePosArr(posArr){
  return posArr.map(p => ({x:p.x, y:p.y}));
}
function isBlockedStatic(x,y, blocksStatic){
  for(const b of blocksStatic) if(b.x===x && b.y===y) return true;
  return false;
}
function penguinAtInState(posArr, x, y, exceptIdx){
  for (let i=0;i<posArr.length;i++){
    if (i===exceptIdx) continue;
    if (posArr[i].x===x && posArr[i].y===y) return i;
  }
  return -1;
}
function inBoundsStage(W0, x, y){
  return x>=0 && y>=0 && x<W0 && y<W0;
}

function slideOnce(posArr, W0, blocksStatic, penguinIdx, dir){
  const cur = posArr[penguinIdx];
  let x = cur.x, y = cur.y;
  let moved = false;

  while(true){
    const nx = x + dir.x;
    const ny = y + dir.y;

    if(!inBoundsStage(W0, nx, ny)){
      return { nextPosArr: null, fellOff: true };
    }
    if(isBlockedStatic(nx, ny, blocksStatic) || penguinAtInState(posArr, nx, ny, penguinIdx) !== -1){
      break;
    }
    x = nx; y = ny;
    moved = true;
  }

  if(!moved) return null;

  const next = clonePosArr(posArr);
  next[penguinIdx] = {x,y};
  return { nextPosArr: next, fellOff: false };
}

// BFS: 최단해 + 경로(힌트용)
function solveBFS(puzzle, startPosOverride = null, maxDepth = 60){
  const W0 = puzzle.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };
  const blocksStatic = puzzle.blocks.map(([x,y]) => ({x,y}));
  const startPosArr = (startPosOverride ?? puzzle.penguins).map(([x,y]) => ({x,y}));

  // 집 위 블록이면 불가 (생성에서 막는 용도)
  if(isBlockedStatic(home0.x, home0.y, blocksStatic)){
    return { solvable:false, reason:"집 위에 블록" };
  }

  // start 중복/범위/블록 위
  const seen = new Set();
  for(const p of startPosArr){
    if(!inBoundsStage(W0, p.x, p.y)) return { solvable:false, reason:"펭귄 보드 밖" };
    const k = `${p.x},${p.y}`;
    if(seen.has(k)) return { solvable:false, reason:"펭귄 겹침" };
    seen.add(k);
    if(isBlockedStatic(p.x, p.y, blocksStatic)) return { solvable:false, reason:"블록 위 펭귄" };
  }

  const startKey = stateKey(startPosArr);
  const q = [startPosArr];
  const dist = new Map([[startKey, 0]]);
  const parent = new Map();
  let qi = 0;

  while(qi < q.length){
    const cur = q[qi++];
    const curKey = stateKey(cur);
    const d0 = dist.get(curKey);

    if(cur[0].x === home0.x && cur[0].y === home0.y){
      const path = [];
      let k = curKey;
      while(k !== startKey){
        const p = parent.get(k);
        path.push(p.move);
        k = p.prevKey;
      }
      path.reverse();
      return { solvable:true, minMoves:d0, path };
    }

    if(d0 >= maxDepth) continue;

    for(let i=0;i<cur.length;i++){
      for(let di=0; di<DIRS.length; di++){
        const r = slideOnce(cur, W0, blocksStatic, i, DIRS[di]);
        if(!r) continue;
        if(r.fellOff) continue;
        const nk = stateKey(r.nextPosArr);
        if(dist.has(nk)) continue;
        dist.set(nk, d0+1);
        parent.set(nk, { prevKey: curKey, move: { penguin:i, dir: DIR_NAMES[di] } });
        q.push(r.nextPosArr);
      }
    }
  }
  return { solvable:false, reason:"해 없음/깊이 제한" };
}

// --------------------
// Puzzle Generator (난이도 조건 만족)
// --------------------
function generatePuzzleForDifficulty(level){
  const spec = DIFFS[level];
  const W0 = spec.W;
  const goalMax = spec.goalMinMovesMax;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };

  // 블록 개수 대충: 5x5는 2~4, 7x7은 4~8
  const blockMin = (W0===5) ? 2 : 4;
  const blockMax = (W0===5) ? 4 : 8;

  // 무한루프 방지: 시도 횟수 제한
  const MAX_TRIES = 800;

  for(let t=0; t<MAX_TRIES; t++){
    const blocksArr = [];
    const blockCount = randInt(blockMin, blockMax);
    const used = new Set([`${home0.x},${home0.y}`]); // 집에는 블록 금지

    while(blocksArr.length < blockCount){
      const x = randInt(0, W0-1);
      const y = randInt(0, W0-1);
      const k = `${x},${y}`;
      if(used.has(k)) continue;
      used.add(k);
      blocksArr.push([x,y]);
    }

    // 펭귄 4마리: 집 위 금지, 블록 위 금지, 겹치기 금지
    const pengArr = [];
    const used2 = new Set(used);

    while(pengArr.length < 4){
      const x = randInt(0, W0-1);
      const y = randInt(0, W0-1);
      const k = `${x},${y}`;
      if(used2.has(k)) continue;
      used2.add(k);
      pengArr.push([x,y]);
    }

    // 시작부터 주인공이 집이면 재미없으니 제외
    if(pengArr[0][0] === home0.x && pengArr[0][1] === home0.y) continue;

    const puzzle = { W: W0, blocks: blocksArr, penguins: pengArr, diffLevel: level, goalMax };
    // 난이도 조건: "최소해 <= 목표"
    const res = solveBFS(puzzle, null, Math.max(goalMax, 12));
    if(res.solvable && res.minMoves <= goalMax && res.minMoves >= 1){
      return { puzzle, minMoves: res.minMoves, examplePath: res.path };
    }
  }

  // 실패 시: 그래도 하나 반환(아예 막히면 UX 박살나서)
  // (이 경우 힌트는 "생성 실패" 안내)
  return { puzzle: { W: spec.W, blocks: [], penguins: [[0,spec.W-1],[spec.W-1,0],[1,1],[spec.W-2,spec.W-2]], diffLevel: level, goalMax }, minMoves: null, examplePath: null };
}

// --------------------
// Load Puzzle into runtime
// --------------------
function loadPuzzle(puz){
  currentPuzzle = JSON.parse(JSON.stringify(puz)); // deep copy
  currentDiffLevel = puz.diffLevel;

  W = puz.W;
  home = { x: Math.floor(W/2), y: Math.floor(W/2) };
  blocks = puz.blocks.map(([x,y]) => ({x,y}));
  penguins = puz.penguins.map(([x,y]) => ({x,y}));

  uiDifficulty.textContent = DIFFS[puz.diffLevel].name;
  uiGoal.textContent = `최소해 ≤ ${puz.goalMax}`;

  resetRuntimeState();
  hide(failOverlay);
  draw();
}

// --------------------
// Movement + Animation
// --------------------
function dirFromDrag(dx,dy){
  const adx = Math.abs(dx), ady = Math.abs(dy);
  const dead = 12;
  if(adx < dead && ady < dead) return null;
  if(adx > ady){
    return dx > 0 ? {x:1,y:0} : {x:-1,y:0};
  } else {
    return dy > 0 ? {x:0,y:1} : {x:0,y:-1};
  }
}

function tryMovePenguin(index, dir){
  if(busy || gameOver || cleared) return;
  if(!dir) return;

  const p = penguins[index];
  let x = p.x, y = p.y;
  let moved = false;

  while(true){
    const nx = x + dir.x;
    const ny = y + dir.y;

    if(!inBounds(nx,ny)){
      busy = true;
      moved = true;
      animateSlide(index, {x, y}, {x:nx, y:ny}, true);
      return;
    }

    if(cellBlocked(nx,ny) || penguinAt(nx,ny,index) !== -1){
      break;
    }

    x = nx; y = ny;
    moved = true;
  }

  if(!moved){
    toast("못 움직여!");
    return;
  }

  busy = true;
  animateSlide(index, {x:p.x, y:p.y}, {x, y}, false);
}

function animateSlide(index, from, to, fellOff){
  const start = performance.now();
  const dur = 180;
  const p = penguins[index];

  const fx = from.x, fy = from.y;
  const tx = to.x, ty = to.y;

  function tick(t){
    const k = Math.min(1, (t - start)/dur);
    const e = 1 - Math.pow(1-k, 3);

    p._rx = fx + (tx - fx) * e;
    p._ry = fy + (ty - fy) * e;
    draw();

    if(k < 1){
      requestAnimationFrame(tick);
    } else {
      delete p._rx; delete p._ry;

      if(fellOff){
        gameOver = true;
        btnHint.disabled = true;
        toast("풍덩!");
        show(failOverlay);
      } else {
        p.x = tx; p.y = ty;
        moves++;
        uiMoves.textContent = moves;

        if(index === 0 && p.x === home.x && p.y === home.y){
          cleared = true;
          btnHint.disabled = true;
          toast(`클리어! (${moves} moves)`);
        }
      }

      busy = false;
      draw();
    }
  }
  requestAnimationFrame(tick);
}

// --------------------
// Hint: 최단해 기준 "다음 한 수" 제안
// --------------------
function currentPositionsAsArray(){
  return penguins.map(p => [p.x, p.y]);
}

function showHint(){
  if(!currentPuzzle) return;
  if(gameOver || cleared || busy) return;

  const startOverride = currentPositionsAsArray();
  const puz = currentPuzzle;

  const res = solveBFS(puz, startOverride, 60);
  if(!res.solvable || !res.path || res.path.length === 0){
    toast("힌트를 만들 수 없어요");
    return;
  }

  const m = res.path[0];
  const who = (m.penguin === 0) ? "주인공" : `${m.penguin+1}번`;
  const dirKor = ({R:"오른쪽", L:"왼쪽", U:"위", D:"아래"})[m.dir] ?? m.dir;
  toast(`힌트: ${who} 펭귄을 ${dirKor}으로!`);
}

// --------------------
// Render
// --------------------
function roundRect(ctx,x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const pad = 40;
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;

  // board bg
  roundRect(ctx, ox-10, oy-10, size+20, size+20, 18);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for(let i=0;i<=W;i++){
    const x = ox + i*cell;
    const y = oy + i*cell;
    ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+size,y); ctx.stroke();
  }

  // home
  const hx = ox + home.x*cell;
  const hy = oy + home.y*cell;
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  roundRect(ctx, hx+4, hy+4, cell-8, cell-8, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(232,241,255,0.85)";
  const cx = hx + cell/2, cy = hy + cell/2;
  ctx.beginPath();
  ctx.moveTo(cx, cy-10);
  ctx.lineTo(cx-12, cy+2);
  ctx.lineTo(cx-12, cy+14);
  ctx.lineTo(cx+12, cy+14);
  ctx.lineTo(cx+12, cy+2);
  ctx.closePath();
  ctx.fill();

  // blocks
  for(const b of blocks){
    const x = ox + b.x*cell;
    const y = oy + b.y*cell;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, x+6, y+6, cell-12, cell-12, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.stroke();
  }

  // penguins
  for(let i=0;i<penguins.length;i++){
    const p = penguins[i];
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);
    const x = ox + rx*cell;
    const y = oy + ry*cell;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(x+cell/2, y+cell*0.70, cell*0.23, cell*0.10, 0, 0, Math.PI*2);
    ctx.fill();

    const isHero = (i===0);
    ctx.fillStyle = isHero ? "rgba(255,255,255,0.92)" : "rgba(220,235,255,0.70)";
    roundRect(ctx, x+cell*0.22, y+cell*0.18, cell*0.56, cell*0.62, cell*0.22);
    ctx.fill();

    ctx.fillStyle = "rgba(15,25,40,0.35)";
    roundRect(ctx, x+cell*0.30, y+cell*0.34, cell*0.40, cell*0.38, cell*0.18);
    ctx.fill();

    // eyes
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(x+cell*0.40, y+cell*0.34, cell*0.045, 0, Math.PI*2);
    ctx.arc(x+cell*0.60, y+cell*0.34, cell*0.045, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(x+cell*0.40, y+cell*0.34, cell*0.020, 0, Math.PI*2);
    ctx.arc(x+cell*0.60, y+cell*0.34, cell*0.020, 0, Math.PI*2);
    ctx.fill();

    if(i===selected && pointerDown && !busy){
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      roundRect(ctx, x+5, y+5, cell-10, cell-10, 14);
      ctx.stroke();
    }

    if(isHero){
      ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
      ctx.beginPath();
      ctx.arc(x+cell*0.76, y+cell*0.22, cell*0.06, 0, Math.PI*2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "rgba(232,241,255,0.70)";
  ctx.font = "14px system-ui";
  const status = cleared ? "CLEAR" : (gameOver ? "FAIL" : "PLAY");
  ctx.fillText(status, 14, 22);
}

// --------------------
// Input
// --------------------
function getCanvasPos(e){
  const rect = canvas.getBoundingClientRect();
  const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
  const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

function cellFromPos(p){
  const pad = 40;
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;
  const gx = Math.floor((p.x - ox)/cell);
  const gy = Math.floor((p.y - oy)/cell);
  return {gx, gy};
}

function onDown(e){
  if(busy || gameOver || cleared) return;
  pointerDown = true;
  const p = getCanvasPos(e);
  lastPointer = p;
  downPos = p;

  const {gx,gy} = cellFromPos(p);
  selected = penguinAt(gx,gy,-1);
  draw();
}

function onMove(e){
  if(!pointerDown) return;
  lastPointer = getCanvasPos(e);
  draw();
}

function onUp(){
  if(!pointerDown) return;
  pointerDown = false;

  if(selected === -1){
    draw();
    return;
  }

  const dx = lastPointer.x - downPos.x;
  const dy = lastPointer.y - downPos.y;
  const dir = dirFromDrag(dx,dy);

  tryMovePenguin(selected, dir);
  selected = -1;
  draw();
}

canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);

// iOS fallback
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); onDown(e); }, {passive:false});
canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); onMove(e); }, {passive:false});
canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); onUp(e); }, {passive:false});

// --------------------
// UI Wiring
// --------------------
document.getElementById('btnStart').onclick = () => {
  hide(startOverlay);
  show(diffOverlay);
};

document.getElementById('btnDiffBack').onclick = () => {
  hide(diffOverlay);
  show(startOverlay);
};

document.getElementById('diff1').onclick = () => startDifficulty(1);
document.getElementById('diff2').onclick = () => startDifficulty(2);
document.getElementById('diff3').onclick = () => startDifficulty(3);

btnMenu.onclick = () => {
  show(diffOverlay);
};

btnHint.onclick = () => showHint();

btnRestart.onclick = () => {
  if(!currentPuzzle) return;
  loadPuzzle(currentPuzzle);
  toast("다시 시작!");
};

document.getElementById('btnFailRestart').onclick = () => {
  if(!currentPuzzle) return;
  loadPuzzle(currentPuzzle);
  toast("재도전!");
};

function startDifficulty(level){
  hide(diffOverlay);

  toast("퍼즐 생성 중...");
  // 생성은 가벼운데, UX 위해 1프레임 양보
  setTimeout(() => {
    const { puzzle, minMoves } = generatePuzzleForDifficulty(level);
    loadPuzzle(puzzle);

    if(minMoves == null){
      toast("생성 난이도 맞추기 실패(임시 퍼즐)");
    } else {
      toast(`${DIFFS[level].name} 시작! (최소해 ${minMoves}수)`);
    }
  }, 30);
}

// Boot: 시작 화면에서 대기
btnHint.disabled = true;
btnRestart.disabled = true;
draw();
