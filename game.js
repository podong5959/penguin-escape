// PENGTAL MVP (Canvas)
// - 5 Difficulty labels + colors
// - Undo
// - Time line gauge for star thresholds
// - User ID personalization (required)
// - Personal ranking (clears per difficulty)
// - First-time tutorial

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const uiMoves = document.getElementById('moves');
const uiTime = document.getElementById('time');
const uiDifficulty = document.getElementById('difficultyPill');
const uiTotalStars = document.getElementById('totalStars');
const uiDiffDot = document.getElementById('diffDot');
const uiUserNameText = document.getElementById('userNameText');
const uiRankPill = document.getElementById('rankPill');

const btnUndo = document.getElementById('btnUndo');
const btnHint = document.getElementById('btnHint');
const btnRestart = document.getElementById('btnRestart');
const btnMenu = document.getElementById('btnMenu');

const startOverlay = document.getElementById('startOverlay');
const diffOverlay = document.getElementById('diffOverlay');
const failOverlay = document.getElementById('failOverlay');
const clearOverlay = document.getElementById('clearOverlay');
const tutorialOverlay = document.getElementById('tutorialOverlay');

const msgWrap = document.getElementById('msg');
const msgText = document.getElementById('msgText');

const nameInput = document.getElementById('nameInput');
const btnStart = document.getElementById('btnStart');
const diffGrid = document.getElementById('diffGrid');

const timeFill = document.getElementById('timeFill');
const mark3 = document.getElementById('mark3');
const mark2 = document.getElementById('mark2');
const mark1 = document.getElementById('mark1');
const mark3Text = document.getElementById('mark3Text');
const mark2Text = document.getElementById('mark2Text');
const mark1Text = document.getElementById('mark1Text');

function toast(text){
  msgText.textContent = text;
  msgWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>msgWrap.classList.remove('show'), 1100);
}
function show(el){ el.classList.add('show'); }
function hide(el){ el.classList.remove('show'); }

// --------------------
// Profile Save (User + ranking + stars)
// --------------------
const PROFILE_KEY = "pengtal_profile_v2";
const LEGACY_STARS_KEY = "pengtal_stars_v1";

function loadProfile(){
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { p = null; }

  if(!p){
    // migrate legacy stars if exists
    let legacyStars = 0;
    try { legacyStars = Number(localStorage.getItem(LEGACY_STARS_KEY) || "0"); } catch {}
    if(!Number.isFinite(legacyStars)) legacyStars = 0;

    p = {
      name: "",
      totalStars: legacyStars,
      clearsByDiff: { 1:0, 2:0, 3:0, 4:0, 5:0 },
      tutorialSeen: false
    };
    saveProfile(p);
  }

  // normalize
  if(typeof p.totalStars !== "number") p.totalStars = 0;
  if(!p.clearsByDiff) p.clearsByDiff = { 1:0,2:0,3:0,4:0,5:0 };
  for(const k of [1,2,3,4,5]){
    if(typeof p.clearsByDiff[k] !== "number") p.clearsByDiff[k] = 0;
  }
  if(typeof p.tutorialSeen !== "boolean") p.tutorialSeen = false;
  if(typeof p.name !== "string") p.name = "";

  return p;
}

function saveProfile(p){
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

let profile = loadProfile();

function setUserName(name){
  profile.name = name;
  saveProfile(profile);
  uiUserNameText.textContent = name || "—";
  updateRankUI();
}

function totalClears(){
  const c = profile.clearsByDiff;
  return (c[1]||0) + (c[2]||0) + (c[3]||0) + (c[4]||0) + (c[5]||0);
}

function updateRankUI(){
  if(profile.name){
    uiRankPill.textContent = `${profile.name}님은 지금 ${totalClears()}개의 라운드를 클리어했습니다.`;
  } else {
    uiRankPill.textContent = `아이디를 입력하면 기록이 저장돼요.`;
  }
}

function updateStarsUI(){
  uiTotalStars.textContent = profile.totalStars;
}

// --------------------
// Difficulty spec (요청 반영)
// 1) 초보: 5x5, 최단해 1~2
// 2) 중수: 5x5, 최단해 3~4
// 3) 고수: 5x5, 최단해 5~7
// 4) 초고수: 7x7, 최단해 7~8
// 5) 신: 7x7, 최단해 10~12
//
// starRules: three/two, and oneLineLimit(게이지 끝) = two + (two-three)
// ex) 30/60 => 90, 45/90 => 135
// --------------------
const DIFFS = {
  1: { key:1, name:"초보",  W:5, targetMinMovesMin:1, targetMinMovesMax:2,  color:"#23c55e", starRules:{ three:30, two:60 } },
  2: { key:2, name:"중수",  W:5, targetMinMovesMin:3, targetMinMovesMax:4,  color:"#facc15", starRules:{ three:30, two:60 } },
  3: { key:3, name:"고수",  W:5, targetMinMovesMin:5, targetMinMovesMax:7,  color:"#fb923c", starRules:{ three:30, two:60 } },
  4: { key:4, name:"초고수",W:7, targetMinMovesMin:7, targetMinMovesMax:8,  color:"#ef4444", starRules:{ three:45, two:90 } },
  5: { key:5, name:"신",    W:7, targetMinMovesMin:10,targetMinMovesMax:12, color:"#111111", starRules:{ three:60, two:120 } },
};

function diffOneLimit(level){
  const { three, two } = DIFFS[level].starRules;
  return two + (two - three); // simple extension for gauge (1★ line)
}

// --------------------
// Runtime Game State
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

// timer
let startTimeMs = 0;
let timerRAF = 0;

// hint
let hintPenguinIndex = null;
let hintUntilMs = 0;

// current puzzle
let currentPuzzle = null; // { W, blocks:[[x,y]...], penguins:[[x,y]...], diffLevel }
let currentDiffLevel = null;

// Undo history (stack)
let undoStack = []; // each: { penguins:[{x,y}...], moves:number }
function canUndo(){
  return !!currentPuzzle && !busy && !gameOver && !cleared && undoStack.length > 0;
}
function updateUndoUI(){
  btnUndo.disabled = !canUndo();
}

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

function stopTimer(){
  if(timerRAF) cancelAnimationFrame(timerRAF);
  timerRAF = 0;
}
function elapsedSec(){
  return Math.floor((performance.now() - startTimeMs) / 1000);
}
function startTimer(){
  stopTimer();
  const tick = () => {
    if(!currentPuzzle || cleared || gameOver) return;

    const sec = elapsedSec();
    uiTime.textContent = `${sec}s`;

    // update time line gauge
    updateTimeLine(sec);

    timerRAF = requestAnimationFrame(tick);
  };
  timerRAF = requestAnimationFrame(tick);
}

function resetRuntimeState(){
  moves = 0;
  busy = false;
  gameOver = false;
  cleared = false;
  pointerDown = false;
  selected = -1;

  hintPenguinIndex = null;
  hintUntilMs = 0;

  undoStack = [];
  uiMoves.textContent = moves;
  uiTime.textContent = `0s`;
  updateUndoUI();

  btnHint.disabled = false;
  btnRestart.disabled = false;

  startTimeMs = performance.now();
  startTimer();
}

function setDifficultyPill(level){
  const d = DIFFS[level];
  uiDifficulty.textContent = d ? d.name : "—";
  uiDiffDot.style.background = d ? d.color : "transparent";
  uiDiffDot.style.borderColor = "rgba(255,255,255,.28)";
}

// --------------------
// Time line (stars)
// --------------------
function calcStarsByTime(diffLevel, elapsedSec){
  const { three, two } = DIFFS[diffLevel].starRules;
  if(elapsedSec <= three) return 3;
  if(elapsedSec <= two) return 2;
  return 1;
}
function thresholdText(diffLevel){
  const { three, two } = DIFFS[diffLevel].starRules;
  const one = diffOneLimit(diffLevel);
  return `⭐⭐⭐ ${three}s · ⭐⭐ ${two}s · ⭐ ${one}s(게이지 끝)`;
}
function setupTimeLine(diffLevel){
  const { three, two } = DIFFS[diffLevel].starRules;
  const one = diffOneLimit(diffLevel);

  // positions as percentage of oneLimit
  const p3 = Math.max(0, Math.min(1, three / one));
  const p2 = Math.max(0, Math.min(1, two / one));
  const p1 = 1;

  mark3.style.left = `${p3 * 100}%`;
  mark2.style.left = `${p2 * 100}%`;
  mark1.style.left = `${p1 * 100}%`;

  mark3Text.textContent = `⭐⭐⭐(${three}s)`;
  mark2Text.textContent = `⭐⭐(${two}s)`;
  mark1Text.textContent = `⭐(${one}s)`;

  updateTimeLine(0);
}
function updateTimeLine(sec){
  if(!currentDiffLevel) return;
  const one = diffOneLimit(currentDiffLevel);
  const ratio = Math.max(0, Math.min(1, 1 - (sec / one)));
  timeFill.style.transform = `scaleX(${ratio})`;
}

// --------------------
// Solver (BFS) - for hint & generation constraint
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

function solveBFS(puzzle, startPosOverride = null, maxDepth = 60){
  const W0 = puzzle.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };
  const blocksStatic = puzzle.blocks.map(([x,y]) => ({x,y}));
  const startPosArr = (startPosOverride ?? puzzle.penguins).map(([x,y]) => ({x,y}));

  if(isBlockedStatic(home0.x, home0.y, blocksStatic)){
    return { solvable:false, reason:"home blocked" };
  }

  const seen = new Set();
  for(const p of startPosArr){
    if(!inBoundsStage(W0, p.x, p.y)) return { solvable:false, reason:"out of bounds" };
    const k = `${p.x},${p.y}`;
    if(seen.has(k)) return { solvable:false, reason:"overlap" };
    seen.add(k);
    if(isBlockedStatic(p.x, p.y, blocksStatic)) return { solvable:false, reason:"penguin on block" };
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

    // hero (index 0) must STOP on home
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
  return { solvable:false, reason:"no solution (depth limit)" };
}

// --------------------
// Puzzle Generator (auto)
// --------------------
function generatePuzzleForDifficulty(level){
  const spec = DIFFS[level];
  const W0 = spec.W;
  const goalMin = spec.targetMinMovesMin;
  const goalMax = spec.targetMinMovesMax;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };

  const blockMin = (W0===5) ? 1 : 3;
  const blockMax = (W0===5) ? 4 : 8;

  const MAX_TRIES = 1600;

  for(let t=0; t<MAX_TRIES; t++){
    const blocksArr = [];
    const blockCount = randInt(blockMin, blockMax);
    const used = new Set([`${home0.x},${home0.y}`]);

    while(blocksArr.length < blockCount){
      const x = randInt(0, W0-1);
      const y = randInt(0, W0-1);
      const k = `${x},${y}`;
      if(used.has(k)) continue;
      used.add(k);
      blocksArr.push([x,y]);
    }

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

    if(pengArr[0][0] === home0.x && pengArr[0][1] === home0.y) continue;

    const puzzle = { W: W0, blocks: blocksArr, penguins: pengArr, diffLevel: level };
    const res = solveBFS(puzzle, null, goalMax + 10);

    if(res.solvable && res.minMoves >= goalMin && res.minMoves <= goalMax){
      return { puzzle, minMoves: res.minMoves };
    }
  }

  return {
    puzzle: {
      W: spec.W,
      blocks: [],
      penguins: [[0,spec.W-1],[spec.W-1,0],[1,1],[spec.W-2,spec.W-2]],
      diffLevel: level
    },
    minMoves: null
  };
}

// --------------------
// Load Puzzle
// --------------------
function loadPuzzle(puz){
  currentPuzzle = JSON.parse(JSON.stringify(puz));
  currentDiffLevel = puz.diffLevel;

  W = puz.W;
  home = { x: Math.floor(W/2), y: Math.floor(W/2) };
  blocks = puz.blocks.map(([x,y]) => ({x,y}));
  penguins = puz.penguins.map(([x,y]) => ({x,y}));

  setDifficultyPill(puz.diffLevel);
  setupTimeLine(puz.diffLevel);

  hide(failOverlay);
  hide(clearOverlay);

  resetRuntimeState();
  draw();
}

// --------------------
// Movement + Animation + Undo
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

function pushUndoSnapshot(){
  // only positions + moves are needed (time keeps flowing)
  undoStack.push({
    penguins: penguins.map(p => ({x:p.x, y:p.y})),
    moves
  });
  updateUndoUI();
}

function doUndo(){
  if(!canUndo()) return;
  const s = undoStack.pop();
  penguins = s.penguins.map(p => ({x:p.x, y:p.y}));
  moves = s.moves;
  uiMoves.textContent = moves;

  hintPenguinIndex = null;
  hintUntilMs = 0;

  updateUndoUI();
  toast("무르기!");
  draw();
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
      // fell off (counts as move)
      pushUndoSnapshot(); // allow undo before falling too
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

  // push snapshot BEFORE applying move
  pushUndoSnapshot();

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
        updateUndoUI();
        stopTimer();
        toast("풍덩!");
        show(failOverlay);
      } else {
        p.x = tx; p.y = ty;
        moves++;
        uiMoves.textContent = moves;

        // clear condition: hero must STOP on home
        if(index === 0 && p.x === home.x && p.y === home.y){
          cleared = true;
          btnHint.disabled = true;
          updateUndoUI();
          stopTimer();

          const sec = elapsedSec();
          const stars = calcStarsByTime(currentDiffLevel, sec);

          // save rewards & ranking
          profile.totalStars += stars;
          profile.clearsByDiff[currentDiffLevel] = (profile.clearsByDiff[currentDiffLevel] || 0) + 1;
          saveProfile(profile);
          updateStarsUI();
          updateRankUI();

          document.getElementById("clearTimeText").textContent =
            `⏱ ${sec}초 · ⭐${stars}개 획득`;
          document.getElementById("starDisplay").textContent = "⭐".repeat(stars);
          document.getElementById("thresholdText").textContent = thresholdText(currentDiffLevel);

          show(clearOverlay);
        }
      }

      busy = false;
      draw();
    }
  }
  requestAnimationFrame(tick);
}

// --------------------
// Hint: highlight WHO to move (no direction)
// --------------------
function currentPositionsAsArray(){
  return penguins.map(p => [p.x, p.y]);
}
function showHint(){
  if(!currentPuzzle || gameOver || cleared || busy) return;

  const res = solveBFS(currentPuzzle, currentPositionsAsArray(), 60);
  if(!res.solvable || !res.path || res.path.length === 0){
    toast("힌트를 만들 수 없어요");
    return;
  }

  hintPenguinIndex = res.path[0].penguin;
  hintUntilMs = performance.now() + 1500;
  toast("힌트: 이 펭귄!");
  draw();
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

  // hint animation params
  const now = performance.now();
  const hintActive = (hintPenguinIndex !== null && now <= hintUntilMs);
  if(hintActive === false){
    hintPenguinIndex = null;
  }
  const pulse = hintActive ? (0.5 + 0.5*Math.sin(now/80)) : 0;

  // penguins
  for(let i=0;i<penguins.length;i++){
    const p = penguins[i];
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);
    const x = ox + rx*cell;
    const y = oy + ry*cell;

    // hint sparkle ring
    if(hintActive && i === hintPenguinIndex){
      ctx.strokeStyle = `rgba(255, 245, 140, ${0.25 + 0.55*pulse})`;
      ctx.lineWidth = 5;
      roundRect(ctx, x+2, y+2, cell-4, cell-4, 18);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 245, 140, ${0.20 + 0.35*pulse})`;
      ctx.beginPath();
      ctx.arc(x+cell*0.20, y+cell*0.18, cell*0.05, 0, Math.PI*2);
      ctx.arc(x+cell*0.82, y+cell*0.25, cell*0.035, 0, Math.PI*2);
      ctx.arc(x+cell*0.74, y+cell*0.80, cell*0.03, 0, Math.PI*2);
      ctx.fill();
    }

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

  // status
  ctx.fillStyle = "rgba(232,241,255,0.70)";
  ctx.font = "14px system-ui";
  const status = cleared ? "CLEAR" : (gameOver ? "FAIL" : "PLAY");
  ctx.fillText(status, 14, 22);

  // keep animating while hint active
  if(hintPenguinIndex !== null){
    requestAnimationFrame(draw);
  }
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
// Tutorial
// --------------------
const tTitle = document.getElementById('tTitle');
const tDesc = document.getElementById('tDesc');
const tLegend = document.getElementById('tLegend');
const tSteps = document.getElementById('tSteps');
const tSkip = document.getElementById('tSkip');
const tPrev = document.getElementById('tPrev');
const tNext = document.getElementById('tNext');

const TUTORIAL = [
  {
    key:"6-1",
    title:"환영 👋",
    desc:`어서와 여기는 펭귄들이 살고있는 빙판이야.\n주인공 펭귄이 집에 가기 위해 도움이 필요해!`,
    legend:[]
  },
  {
    key:"6-2",
    title:"기물 설명",
    desc:`세 가지가 있어!\n- 🐧 펭귄(주인공은 금색 뱃지)\n- ⬛ 벽/장애물(막혀서 못 지나가)\n- 🏠 집(가야 하는 목표)`,
    legend:[
      ["🐧", "펭귄(주인공 포함)"],
      ["⬛", "벽/장애물"],
      ["🏠", "집(목표)"]
    ]
  },
  {
    key:"6-3",
    title:"움직임 설명",
    desc:`펭귄을 눌러 드래그하면 그 방향으로 미끄러져!\n주인공이 아니어도 다른 펭귄들도 움직일 수 있어.`,
    legend:[["👉", "펭귄을 드래그해서 이동"]]
  },
  {
    key:"6-4",
    title:"클리어 조건",
    desc:`주인공 펭귄이 집을 '지나가기'만 하면 안 돼.\n집 칸에서 '멈춰야' 클리어야!`,
    legend:[["✅", "집 칸에서 멈추기"]]
  },
  {
    key:"6-5",
    title:"별(⭐) 획득 조건",
    desc:`시간이 빠를수록 별을 더 많이 받아!\n상단의 시간 라인(게이지)에서 ⭐⭐⭐/⭐⭐/⭐ 기준을 확인해봐.`,
    legend:[["⏳", "게이지가 줄어들수록 별이 감소"]]
  }
];

let tIndex = 0;

function renderTutorial(){
  const step = TUTORIAL[tIndex];
  tTitle.textContent = `튜토리얼 · ${step.title}`;
  tDesc.textContent = step.desc;

  tLegend.innerHTML = "";
  for(const [icon, text] of step.legend){
    const el = document.createElement("div");
    el.className = "legendItem";
    el.textContent = `${icon} ${text}`;
    tLegend.appendChild(el);
  }

  tSteps.innerHTML = "";
  for(let i=0;i<TUTORIAL.length;i++){
    const p = document.createElement("div");
    p.className = "stepPill";
    p.textContent = (i===tIndex) ? `● ${TUTORIAL[i].key}` : `${TUTORIAL[i].key}`;
    tSteps.appendChild(p);
  }

  tPrev.disabled = (tIndex === 0);
  tNext.textContent = (tIndex === TUTORIAL.length - 1) ? "완료" : "다음";
}

function openTutorial(fromMenu=false){
  tIndex = 0;
  renderTutorial();
  show(tutorialOverlay);
}

function closeTutorial(markSeen=true){
  hide(tutorialOverlay);
  if(markSeen){
    profile.tutorialSeen = true;
    saveProfile(profile);
  }
}

tSkip.onclick = () => closeTutorial(true);
tPrev.onclick = () => { if(tIndex>0){ tIndex--; renderTutorial(); } };
tNext.onclick = () => {
  if(tIndex < TUTORIAL.length - 1){
    tIndex++;
    renderTutorial();
  } else {
    closeTutorial(true);
  }
};

// --------------------
// UI Wiring
// --------------------
document.getElementById('btnDiffBack').onclick = () => {
  hide(diffOverlay);
  show(startOverlay);
};

document.getElementById('btnTutorial').onclick = () => openTutorial(true);

btnMenu.onclick = () => {
  show(diffOverlay);
  updateDifficultyButtons();
};

btnHint.onclick = () => showHint();

btnUndo.onclick = () => doUndo();

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

document.getElementById('btnClearHome').onclick = () => {
  hide(clearOverlay);
  show(diffOverlay);
  updateDifficultyButtons();
};

document.getElementById('btnClearNext').onclick = () => {
  hide(clearOverlay);
  startDifficulty(currentDiffLevel);
};

// start overlay name gating
function normalizeName(s){
  return (s || "").trim().replace(/\s+/g, " ").slice(0, 16);
}
function updateStartBtn(){
  const v = normalizeName(nameInput.value);
  btnStart.disabled = (v.length === 0);
}
nameInput.addEventListener("input", updateStartBtn);

btnStart.onclick = () => {
  const v = normalizeName(nameInput.value);
  if(!v){
    toast("아이디를 입력해주세요!");
    return;
  }
  setUserName(v);

  hide(startOverlay);
  show(diffOverlay);
  updateDifficultyButtons();

  // first time tutorial
  if(!profile.tutorialSeen){
    openTutorial(false);
  }
};

function updateDifficultyButtons(){
  updateStarsUI();
  updateRankUI();

  diffGrid.innerHTML = "";

  const entries = [1,2,3,4,5].map(k => DIFFS[k]);

  for(const d of entries){
    const btn = document.createElement("button");
    btn.className = "bigBtn";

    const one = diffOneLimit(d.key);
    btn.innerHTML =
      `<div style="display:flex; align-items:center; gap:10px;">
         <span class="dot" style="background:${d.color}; border-color: rgba(255,255,255,.28)"></span>
         <div style="display:flex; flex-direction:column; gap:4px;">
           <div style="font-size:15px;">${d.name}</div>
           <div class="tiny">${d.W}×${d.W} · 최단해 ${d.targetMinMovesMin}~${d.targetMinMovesMax}</div>
           <div class="tiny">⭐⭐⭐ ${d.starRules.three}s · ⭐⭐ ${d.starRules.two}s · ⭐ ${one}s</div>
           <div class="tiny">클리어: ${profile.clearsByDiff[d.key] || 0}회</div>
         </div>
       </div>`;

    btn.onclick = () => startDifficulty(d.key);
    diffGrid.appendChild(btn);
  }

  // desc
  const unlockDesc = document.getElementById('unlockDesc');
  unlockDesc.textContent = `${profile.name}님 · 총 클리어 ${totalClears()}회 · 총 ⭐${profile.totalStars}개`;
}

function startDifficulty(level){
  hide(diffOverlay);
  toast("퍼즐 생성 중...");

  setTimeout(() => {
    const { puzzle, minMoves } = generatePuzzleForDifficulty(level);
    loadPuzzle(puzzle);

    if(minMoves == null){
      toast("생성 실패(임시 퍼즐)");
    } else {
      toast(`${DIFFS[level].name} 시작! (최단해 ${minMoves}수)`);
    }
  }, 20);
}

// --------------------
// Boot
// --------------------
updateStarsUI();
uiUserNameText.textContent = profile.name || "—";
updateRankUI();

nameInput.value = profile.name || "";
updateStartBtn();

btnHint.disabled = true;
btnRestart.disabled = true;
btnUndo.disabled = true;

setDifficultyPill(null);
setupTimeLine(1); // placeholder layout
draw();
