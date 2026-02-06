// PENGTAL v2
// - Progress bug fix: progressStage vs currentStage 분리
// - Stage puzzle caching (versioned)
// - Session resume (optional but enabled): last in-play stage + puzzle + state
// - Real preload pipeline for images (illustration-ready) + fallback drawing
// - Home full background via ./assets/home_bg.png (없으면 CSS gradient만)

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const hud = document.getElementById('hud');
const bottomBar = document.getElementById('bottomBar');

const timeBar = document.getElementById('timeBar');
const goldText = document.getElementById('goldText');
const stageText = document.getElementById('stageText');

const splashOverlay = document.getElementById('splashOverlay');
const homeOverlay = document.getElementById('homeOverlay');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');
const preStageOverlay = document.getElementById('preStageOverlay');
const preStageText = document.getElementById('preStageText');

const failOverlay = document.getElementById('failOverlay');
const clearOverlay = document.getElementById('clearOverlay');
const gearOverlay = document.getElementById('gearOverlay');
const profileOverlay = document.getElementById('profileOverlay');
const shopOverlay = document.getElementById('shopOverlay');

const msgWrap = document.getElementById('msg');
const msgText = document.getElementById('msgText');

const btnGear = document.getElementById('btnGear');
const btnSound = document.getElementById('btnSound');

const btnUndo = document.getElementById('btnUndo');
const btnHint = document.getElementById('btnHint');
const undoCnt = document.getElementById('undoCnt');
const hintCnt = document.getElementById('hintCnt');

const homeGold = document.getElementById('homeGold');
const btnPlay = document.getElementById('btnPlay');
const btnShop = document.getElementById('btnShop');
const btnHomeGear = document.getElementById('btnHomeGear');

const btnFailHome = document.getElementById('btnFailHome');
const btnFailRetry = document.getElementById('btnFailRetry');

const btnClearHome = document.getElementById('btnClearHome');
const btnClearNext = document.getElementById('btnClearNext');
const clearTitle = document.getElementById('clearTitle');
const clearReward = document.getElementById('clearReward');
const clearMeta = document.getElementById('clearMeta');

const btnGearHome = document.getElementById('btnGearHome');
const btnGearRestart = document.getElementById('btnGearRestart');
const btnGearProfile = document.getElementById('btnGearProfile');
const btnGearClose = document.getElementById('btnGearClose');

const profileText = document.getElementById('profileText');
const btnProfileClose = document.getElementById('btnProfileClose');

const buyUndo = document.getElementById('buyUndo');
const buyHint = document.getElementById('buyHint');
const btnShopClose = document.getElementById('btnShopClose');

const bgm = document.getElementById('bgm');

function toast(text){
  msgText.textContent = text;
  msgWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>msgWrap.classList.remove('show'), 1100);
}
function show(el){ el.classList.add('show'); }
function hide(el){ el.classList.remove('show'); }

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function nowMs(){ return performance.now(); }

// --------------------
// Storage keys + versioning
// --------------------
const CACHE_VERSION = 2; // 생성 로직/UI 바꾸면 올려서 캐시 자동 초기화

const SAVE = {
  v: "pengtal_v",
  gold: "pengtal_gold",
  progressStage: "pengtal_progress_stage",   // 다음에 시작할 스테이지(진행도)
  undo: "pengtal_undo",
  hint: "pengtal_hint",
  sound: "pengtal_sound",

  // stage puzzle cache
  puzzleCachePrefix: "pengtal_puz_",         // + stage
  puzzleIndex: "pengtal_puz_index",          // 저장된 stage 목록(간단 인덱스)

  // in-play session resume
  session: "pengtal_session",                // currentStage + puzzle + positions + moves + timerStart
};

function loadInt(key, fallback){
  try{
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : fallback;
  }catch{ return fallback; }
}
function loadJSON(key, fallback){
  try{
    const t = localStorage.getItem(key);
    if(!t) return fallback;
    return JSON.parse(t);
  }catch{ return fallback; }
}
function saveJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch{}
}
function saveInt(key, value){
  try{ localStorage.setItem(key, String(value)); }catch{}
}
function resetCacheIfNeeded(){
  const v = loadInt(SAVE.v, 0);
  if(v !== CACHE_VERSION){
    // 전 버전 캐시/세션 정리
    try{
      const idx = loadJSON(SAVE.puzzleIndex, []);
      for(const st of idx){
        localStorage.removeItem(SAVE.puzzleCachePrefix + st);
      }
      localStorage.removeItem(SAVE.puzzleIndex);
      localStorage.removeItem(SAVE.session);
      localStorage.setItem(SAVE.v, String(CACHE_VERSION));
    }catch{
      localStorage.setItem(SAVE.v, String(CACHE_VERSION));
    }
  }
}

// --------------------
// Player
// --------------------
resetCacheIfNeeded();

let player = {
  gold: loadInt(SAVE.gold, 0),
  progressStage: loadInt(SAVE.progressStage, 1), // 다음 시작 stage
  undo: loadInt(SAVE.undo, 3),
  hint: loadInt(SAVE.hint, 3),
  soundOn: loadInt(SAVE.sound, 1) === 1,
};

function savePlayer(){
  saveInt(SAVE.gold, player.gold);
  saveInt(SAVE.progressStage, player.progressStage);
  saveInt(SAVE.undo, player.undo);
  saveInt(SAVE.hint, player.hint);
  saveInt(SAVE.sound, player.soundOn ? 1 : 0);
}

// --------------------
// Stage spec (1~500)
// --------------------
function stageSpec(stage){
  if(stage <= 10) return { W:5, min:1, max:2 };
  if(stage <= 50) return { W:5, min:2, max:3 };
  if(stage <= 100) return { W:5, min:3, max:5 };
  if(stage <= 200) return { W:5, min:5, max:7 };
  if(stage <= 300) return { W:5, min:7, max:10 };
  if(stage <= 400) return { W:5, min:8, max:12 };
  return { W:7, min:10, max:15 };
}

// --------------------
// Puzzle cache
// puzzle format: { W, blocks:[[x,y]], penguins:[[x,y]] }
// --------------------
function getPuzzleFromCache(stage){
  return loadJSON(SAVE.puzzleCachePrefix + stage, null);
}
function setPuzzleToCache(stage, puzzle){
  saveJSON(SAVE.puzzleCachePrefix + stage, puzzle);
  // index 업데이트(있어도 되고 없어도 되지만, 버전 리셋/정리에 도움)
  const idx = loadJSON(SAVE.puzzleIndex, []);
  if(!idx.includes(stage)){
    idx.push(stage);
    saveJSON(SAVE.puzzleIndex, idx);
  }
}

// --------------------
// Session resume (in-play state)
// --------------------
function saveSession(){
  if(!runtime.currentStage || !runtime.puzzle) return;
  const session = {
    currentStage: runtime.currentStage,
    puzzle: runtime.puzzle,
    penguins: runtime.penguins.map(p=>[p.x,p.y]),
    moves: runtime.moves,
    // 타이머는 "시작 시각" 저장
    startTimeEpoch: Date.now() - Math.floor((nowMs() - runtime.startTimeMs)), // 대략 복원용
  };
  saveJSON(SAVE.session, session);
}
function clearSession(){
  try{ localStorage.removeItem(SAVE.session); }catch{}
}
function loadSession(){
  return loadJSON(SAVE.session, null);
}

// --------------------
// Assets (illustration-ready)
// --------------------
const ASSETS = {
  hero: { img:null, src:"./assets/penguin_hero.png" },
  penguin: { img:null, src:"./assets/penguin.png" },
  block: { img:null, src:"./assets/block.png" },
  home: { img:null, src:"./assets/home.png" },
  sparkle: { img:null, src:"./assets/sparkle.png" },
  ice: { img:null, src:"./assets/ice_tile.png" },
  sea: { img:null, src:"./assets/sea_bg.png" },
};

function loadImage(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>resolve({ok:true,img});
    img.onerror = ()=>resolve({ok:false,img:null});
    img.src = src;
  });
}

// 실제 로딩: 이미지 몇 개라도 있으면 미리 로딩
async function preloadAssets(){
  loadingTitle.textContent = "리소스 로딩 중…";
  loadingDesc.textContent = "이미지를 준비하고 있어요";
  show(loadingOverlay);

  const keys = Object.keys(ASSETS);
  for(let i=0;i<keys.length;i++){
    const k = keys[i];
    const r = await loadImage(ASSETS[k].src);
    ASSETS[k].img = r.ok ? r.img : null;
    // 작은 진행감(너무 길게는 X)
    loadingDesc.textContent = `준비 중… (${i+1}/${keys.length})`;
  }

  hide(loadingOverlay);
}

// --------------------
// Runtime state
// --------------------
const REWARD_MAX = 100;
const REWARD_DECAY_PER_SEC = 1;
const TIMEBAR_MAX_SEC = 100;

const runtime = {
  // stage control
  currentStage: null,      // 지금 플레이 중 stage
  puzzle: null,            // 고정 퍼즐(캐시된 것)
  W: 5,
  home: {x:2,y:2},
  blocks: [],
  penguins: [],
  moves: 0,

  history: [],
  busy:false,
  gameOver:false,
  cleared:false,

  startTimeMs: 0,

  hintPenguinIndex: null,
  hintUntilMs: 0,

  // input
  pointerDown:false,
  selected:-1,
  downPos:{x:0,y:0},
  lastPointer:{x:0,y:0},
};

function resizeCanvasToDisplaySize(){
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w;
    canvas.height = h;
  }
}

function inBounds(x,y){ return x>=0 && y>=0 && x<runtime.W && y<runtime.W; }
function cellBlocked(x,y){
  for(const b of runtime.blocks) if(b.x===x && b.y===y) return true;
  return false;
}
function penguinAt(x,y, except=-1){
  for(let i=0;i<runtime.penguins.length;i++){
    if(i===except) continue;
    const p = runtime.penguins[i];
    if(p.x===x && p.y===y) return i;
  }
  return -1;
}

function elapsedSec(){
  return Math.floor((nowMs() - runtime.startTimeMs)/1000);
}
function currentReward(){
  return clamp(REWARD_MAX - elapsedSec()*REWARD_DECAY_PER_SEC, 0, REWARD_MAX);
}
function updateHUD(){
  goldText.textContent = player.gold;
  homeGold.textContent = player.gold;
  undoCnt.textContent = player.undo ? `(${player.undo})` : "(0)";
  hintCnt.textContent = player.hint ? `(${player.hint})` : "(0)";

  const stage = runtime.currentStage ?? player.progressStage;
  stageText.textContent = `Stage ${stage}`;

  const e = elapsedSec();
  const ratio = clamp(1 - (e / TIMEBAR_MAX_SEC), 0, 1);
  timeBar.style.transform = `scaleX(${ratio})`;
}

let timerRAF = 0;
function startTimer(){
  stopTimer();
  const tick = ()=>{
    if(runtime.gameOver || runtime.cleared) return;
    updateHUD();
    timerRAF = requestAnimationFrame(tick);
  };
  timerRAF = requestAnimationFrame(tick);
}
function stopTimer(){
  if(timerRAF) cancelAnimationFrame(timerRAF);
  timerRAF = 0;
}

// --------------------
// Solver + generator (stage spec대로)
// --------------------
const DIRS = [
  {x: 1, y: 0}, {x:-1, y: 0}, {x: 0, y: 1}, {x: 0, y:-1},
];
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function stateKey(posArr){ return posArr.map(p => `${p.x},${p.y}`).join("|"); }
function clonePosArr(posArr){ return posArr.map(p => ({x:p.x, y:p.y})); }
function inBoundsStage(W0, x, y){ return x>=0 && y>=0 && x<W0 && y<W0; }
function isBlockedStatic(x,y, blocksStatic){
  for(const b of blocksStatic) if(b.x===x && b.y===y) return true;
  return false;
}
function penguinAtInState(posArr, x, y, exceptIdx){
  for(let i=0;i<posArr.length;i++){
    if(i===exceptIdx) continue;
    if(posArr[i].x===x && posArr[i].y===y) return i;
  }
  return -1;
}
function slideOnce(posArr, W0, blocksStatic, penguinIdx, dir){
  const cur = posArr[penguinIdx];
  let x = cur.x, y = cur.y;
  let moved = false;
  while(true){
    const nx = x + dir.x, ny = y + dir.y;
    if(!inBoundsStage(W0, nx, ny)) return { nextPosArr:null, fellOff:true };
    if(isBlockedStatic(nx, ny, blocksStatic) || penguinAtInState(posArr, nx, ny, penguinIdx) !== -1) break;
    x = nx; y = ny; moved = true;
  }
  if(!moved) return null;
  const next = clonePosArr(posArr);
  next[penguinIdx] = {x,y};
  return { nextPosArr: next, fellOff:false };
}
function solveBFS(puzzle, startPosOverride=null, maxDepth=30){
  const W0 = puzzle.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };
  const blocksStatic = puzzle.blocks.map(([x,y])=>({x,y}));
  const startPosArr = (startPosOverride ?? puzzle.penguins).map(([x,y])=>({x,y}));

  if(isBlockedStatic(home0.x, home0.y, blocksStatic)) return {solvable:false};

  const seen = new Set();
  for(const p of startPosArr){
    if(!inBoundsStage(W0,p.x,p.y)) return {solvable:false};
    const k = `${p.x},${p.y}`;
    if(seen.has(k)) return {solvable:false};
    seen.add(k);
    if(isBlockedStatic(p.x,p.y,blocksStatic)) return {solvable:false};
  }

  const startKey = stateKey(startPosArr);
  const q = [startPosArr];
  const dist = new Map([[startKey,0]]);
  const parent = new Map();
  let qi=0;

  while(qi<q.length){
    const cur = q[qi++];
    const curKey = stateKey(cur);
    const d0 = dist.get(curKey);

    if(cur[0].x===home0.x && cur[0].y===home0.y){
      const path=[];
      let k=curKey;
      while(k!==startKey){
        const p = parent.get(k);
        path.push(p.move);
        k = p.prevKey;
      }
      path.reverse();
      return {solvable:true, minMoves:d0, path};
    }
    if(d0>=maxDepth) continue;

    for(let i=0;i<cur.length;i++){
      for(let di=0; di<DIRS.length; di++){
        const r = slideOnce(cur, W0, blocksStatic, i, DIRS[di]);
        if(!r) continue;
        if(r.fellOff) continue;
        const nk = stateKey(r.nextPosArr);
        if(dist.has(nk)) continue;
        dist.set(nk, d0+1);
        parent.set(nk, { prevKey: curKey, move:{ penguin:i, dir:di } });
        q.push(r.nextPosArr);
      }
    }
  }
  return {solvable:false};
}

function generatePuzzleForStage(stage){
  const spec = stageSpec(stage);
  const W0 = spec.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };

  const blockMin = (W0===5) ? 1 : 3;
  const blockMax = (W0===5) ? 4 : 8;

  const MAX_TRIES = 2500;

  for(let t=0;t<MAX_TRIES;t++){
    const blocksArr=[];
    const used = new Set([`${home0.x},${home0.y}`]);

    const blockCount = randInt(blockMin, blockMax);
    while(blocksArr.length<blockCount){
      const x = randInt(0,W0-1), y=randInt(0,W0-1);
      const k=`${x},${y}`;
      if(used.has(k)) continue;
      used.add(k);
      blocksArr.push([x,y]);
    }

    const pengArr=[];
    const used2 = new Set(used);
    while(pengArr.length<4){
      const x=randInt(0,W0-1), y=randInt(0,W0-1);
      const k=`${x},${y}`;
      if(used2.has(k)) continue;
      used2.add(k);
      pengArr.push([x,y]);
    }
    if(pengArr[0][0]===home0.x && pengArr[0][1]===home0.y) continue;

    const puzzle = { W:W0, blocks:blocksArr, penguins:pengArr };
    const res = solveBFS(puzzle, null, spec.max + 10);

    if(res.solvable && res.minMoves >= spec.min && res.minMoves <= spec.max){
      return puzzle;
    }
  }

  return { W:W0, blocks:[], penguins:[[0,W0-1],[W0-1,0],[1,1],[W0-2,W0-2]] };
}

// stage puzzle: cache first
function getOrCreateStagePuzzle(stage){
  const cached = getPuzzleFromCache(stage);
  if(cached) return cached;
  const puzzle = generatePuzzleForStage(stage);
  setPuzzleToCache(stage, puzzle);
  return puzzle;
}

// --------------------
// Load puzzle into runtime
// --------------------
function loadPuzzleToRuntime(stage, puzzle, restoreState=null){
  runtime.currentStage = stage;
  runtime.puzzle = JSON.parse(JSON.stringify(puzzle));

  runtime.W = puzzle.W;
  runtime.home = { x: Math.floor(runtime.W/2), y: Math.floor(runtime.W/2) };
  runtime.blocks = puzzle.blocks.map(([x,y])=>({x,y}));

  runtime.penguins = puzzle.penguins.map(([x,y])=>({x,y}));
  runtime.moves = 0;

  runtime.history = [];
  runtime.busy = false;
  runtime.gameOver = false;
  runtime.cleared = false;

  runtime.pointerDown = false;
  runtime.selected = -1;

  runtime.hintPenguinIndex = null;
  runtime.hintUntilMs = 0;

  runtime.startTimeMs = nowMs();

  if(restoreState){
    // 복구(선택)
    if(Array.isArray(restoreState.penguins) && restoreState.penguins.length===4){
      for(let i=0;i<4;i++){
        runtime.penguins[i].x = restoreState.penguins[i][0];
        runtime.penguins[i].y = restoreState.penguins[i][1];
      }
    }
    if(Number.isFinite(restoreState.moves)) runtime.moves = restoreState.moves;
    if(Number.isFinite(restoreState.elapsedSec)){
      runtime.startTimeMs = nowMs() - (restoreState.elapsedSec*1000);
    }
  }

  updateHUD();
  startTimer();
  draw(
      const isHero = (i===0);
    const img = isHero ? ASSETS.hero.img : ASSETS.penguin.img;

    // ✅ HERO EMPHASIS (주인공만 확실히 티나게)
    if(isHero){
      const cx = x + cell/2;
      const cy = y + cell/2;

      // spotlight
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(cx, cy + cell*0.05, cell*0.55, cell*0.48, 0, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255, 240, 140, 1)";
      ctx.fill();
      ctx.restore();

      // outer ring (gold)
      ctx.save();
      const pulseHero = 0.5 + 0.5*Math.sin(nowMs()/140);
      ctx.globalAlpha = 0.55 + 0.25*pulseHero;
      ctx.lineWidth = Math.max(3, cell*0.06);
      ctx.strokeStyle = "rgba(255, 220, 90, 1)";
      roundRect(ctx, x+cell*0.06, y+cell*0.06, cell*0.88, cell*0.88, cell*0.22);
      ctx.stroke();
      ctx.restore();

      // crown icon
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.font = `${Math.floor(cell*0.26)}px system-ui, Apple SD Gothic Neo, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👑", cx, y + cell*0.10);
      ctx.restore();
    );
    }

  saveSession();
}

// --------------------
// Input
// --------------------
function dirFromDrag(dx,dy){
  const adx=Math.abs(dx), ady=Math.abs(dy);
  const dead = 18;
  if(adx<dead && ady<dead) return null;
  if(adx>ady) return dx>0 ? {x:1,y:0} : {x:-1,y:0};
  return dy>0 ? {x:0,y:1} : {x:0,y:-1};
}

// bump interaction
function bumpPair(i, j, dir){
  const amt = 6;
  const a = runtime.penguins[i], b = runtime.penguins[j];
  a.bumpX = (-dir.x) * amt; a.bumpY = (-dir.y) * amt;
  b.bumpX = (dir.x) * amt;  b.bumpY = (dir.y) * amt;
  setTimeout(()=>{
    a.bumpX = a.bumpY = 0;
    b.bumpX = b.bumpY = 0;
    draw();
  }, 90);
}

// history
const HISTORY_MAX = 30;
function snapshot(){
  runtime.history.push({
    penguins: runtime.penguins.map(p=>({x:p.x,y:p.y})),
    moves: runtime.moves
  });
  if(runtime.history.length > HISTORY_MAX) runtime.history.shift();
}
function restoreSnapshot(){
  const s = runtime.history.pop();
  if(!s) return false;
  for(let i=0;i<runtime.penguins.length;i++){
    runtime.penguins[i].x = s.penguins[i].x;
    runtime.penguins[i].y = s.penguins[i].y;
    delete runtime.penguins[i]._rx; delete runtime.penguins[i]._ry;
  }
  runtime.moves = s.moves;
  saveSession();
  return true;
}

function animateSlide(index, from, to, fellOff){
  const start = nowMs();
  const dur = 200;
  const p = runtime.penguins[index];
  const fx=from.x, fy=from.y;
  const tx=to.x, ty=to.y;

  function tick(t){
    const k = Math.min(1,(t-start)/dur);
    const e = 1 - Math.pow(1-k, 3);

    p._rx = fx + (tx-fx)*e;
    p._ry = fy + (ty-fy)*e;

    draw();

    if(k<1) requestAnimationFrame(tick);
    else{
      delete p._rx; delete p._ry;

      if(fellOff){
        runtime.gameOver = true;
        stopTimer();
        toast("풍덩!");
        show(failOverlay);
        saveSession();
      }else{
        p.x=tx; p.y=ty;
        runtime.moves++;

        // clear
        if(index===0 && p.x===runtime.home.x && p.y===runtime.home.y){
          runtime.cleared = true;
          stopTimer();
          onClear();
        }
        saveSession();
      }

      runtime.busy=false;
      draw();
    }
  }
  requestAnimationFrame(tick);
}

function tryMovePenguin(index, dir){
  if(runtime.busy || runtime.gameOver || runtime.cleared) return;
  if(!dir) return;

  const p = runtime.penguins[index];
  let x=p.x, y=p.y;
  let moved=false;

  while(true){
    const nx=x+dir.x, ny=y+dir.y;

    if(!inBounds(nx,ny)){
      snapshot();
      runtime.busy = true;
      animateSlide(index, {x,y}, {x:nx,y:ny}, true);
      return;
    }

    const hitPeng = penguinAt(nx,ny,index);
    if(cellBlocked(nx,ny)){
      break;
    }
    if(hitPeng !== -1){
      bumpPair(index, hitPeng, dir);
      break;
    }

    x=nx; y=ny; moved=true;
  }

  if(!moved){
    toast("못 움직여!");
    return;
  }

  snapshot();
  runtime.busy = true;
  animateSlide(index, {x:p.x,y:p.y}, {x,y}, false);
}

// --------------------
// Hint / Undo
// --------------------
function currentPositionsAsArray(){
  return runtime.penguins.map(p=>[p.x,p.y]);
}

function useHint(){
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(player.hint <= 0){
    toast("힌트권이 없어요(상점에서 구매)");
    return;
  }

  player.hint--;
  savePlayer();
  updateHUD();

  const res = solveBFS(runtime.puzzle, currentPositionsAsArray(), 50);
  if(!res.solvable || !res.path || res.path.length===0){
    toast("힌트를 만들 수 없어요");
    return;
  }

  runtime.hintPenguinIndex = res.path[0].penguin;
  runtime.hintUntilMs = nowMs() + 1500;
  toast("힌트: 이 펭귄!");
  draw();
}

function useUndo(){
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(player.undo <= 0){
    toast("무르기권이 없어요(상점에서 구매)");
    return;
  }
  if(runtime.history.length === 0){
    toast("되돌릴 수 없어요");
    return;
  }

  player.undo--;
  savePlayer();
  updateHUD();

  restoreSnapshot();
  draw();
}

// --------------------
// Clear (progressStage bug fix)
// --------------------
function onClear(){
  const reward = currentReward();
  player.gold += reward;

  // ✅ 진행도만 업데이트 (currentStage는 유지)
  player.progressStage = Math.max(player.progressStage, runtime.currentStage + 1);

  savePlayer();
  clearSession(); // 클리어 후 세션은 종료(다음으로 넘어갈 것이므로)

  clearTitle.textContent = `스테이지 클리어!`;
  clearReward.textContent = `${reward}`;
  clearMeta.textContent = `⏱ ${elapsedSec()}초 · 보상은 시간에 따라 감소`;

  updateHUD();
  show(clearOverlay);
}

// --------------------
// Shop
// --------------------
function tryBuy(cost, onBuy){
  if(player.gold < cost){
    toast("골드가 부족해요");
    return;
  }
  player.gold -= cost;
  onBuy();
  savePlayer();
  updateHUD();
  toast("구매 완료!");
}

// --------------------
// Sound
// --------------------
async function toggleSound(){
  player.soundOn = !player.soundOn;
  savePlayer();
  btnSound.textContent = player.soundOn ? "🔊" : "🔇";
  if(!bgm || !bgm.src) return;
  try{
    if(player.soundOn) await bgm.play();
    else bgm.pause();
  }catch{
    // 모바일 자동재생 제한은 정상
  }
}

// --------------------
// UI flows
// --------------------
function showHome(){
  hud.style.display = "none";
  bottomBar.style.display = "none";
  hide(preStageOverlay);
  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(profileOverlay);
  hide(shopOverlay);
  updateHUD();
  show(homeOverlay);
}

async function startStage(stage, restoreState=null){
  loadingTitle.textContent = "로딩 중…";
  loadingDesc.textContent = "스테이지를 준비하고 있어요";
  show(loadingOverlay);

  // 실제로는 캐시/생성 + 내일 리소스 로딩까지 고려해 “조금” 여유
  await sleep(120);

  const puzzle = getOrCreateStagePuzzle(stage);
  loadPuzzleToRuntime(stage, puzzle, restoreState);

  hud.style.display = "flex";
  bottomBar.style.display = "flex";
  hide(loadingOverlay);
}

function startGameFlow(){
  hide(homeOverlay);
  const stage = player.progressStage;
  preStageText.textContent = `Stage ${stage}`;
  show(preStageOverlay);
  setTimeout(async ()=>{
    hide(preStageOverlay);
    await startStage(stage);
  }, 900);
}

function restartCurrentStage(){
  // ✅ 항상 currentStage의 “캐시된 퍼즐”로 재시작
  const stage = runtime.currentStage ?? player.progressStage;
  const puzzle = getOrCreateStagePuzzle(stage);
  clearSession();
  loadPuzzleToRuntime(stage, puzzle, null);
  toast("다시 시작!");
}

// --------------------
// Render helpers (illustration-ready)
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

function drawImageFit(img, x,y,w,h){
  if(!img) return false;
  ctx.drawImage(img, x,y,w,h);
  return true;
}

function draw(){
  resizeCanvasToDisplaySize();
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const pad = 46;
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;

  // background sea
  if(!drawImageFit(ASSETS.sea.img, 0,0,canvas.width,canvas.height)){
    ctx.fillStyle = "#061018";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // board panel
  roundRect(ctx, ox-14, oy-14, size+28, size+28, 22);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ice area (tile if exists)
  if(ASSETS.ice.img){
    // tile fill
    const t = ASSETS.ice.img;
    const pattern = ctx.createPattern(t, "repeat");
    if(pattern){
      ctx.save();
      roundRect(ctx, ox-6, oy-6, size+12, size+12, 18);
      ctx.clip();
      ctx.fillStyle = pattern;
      ctx.fillRect(ox-6, oy-6, size+12, size+12);
      ctx.restore();
    }
  }else{
    roundRect(ctx, ox-6, oy-6, size+12, size+12, 18);
    ctx.fillStyle = "rgba(191,233,255,0.12)";
    ctx.fill();
  }

  // grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for(let i=0;i<=runtime.W;i++){
    const x = ox + i*cell;
    const y = oy + i*cell;
    ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+size,y); ctx.stroke();
  }

  // home
  const hx = ox + runtime.home.x*cell;
  const hy = oy + runtime.home.y*cell;
  if(!drawImageFit(ASSETS.home.img, hx+2, hy+2, cell-4, cell-4)){
    roundRect(ctx, hx+4, hy+4, cell-8, cell-8, 14);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.fillStyle = "rgba(233,245,255,0.85)";
    const cx = hx + cell/2, cy = hy + cell/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy-10);
    ctx.lineTo(cx-12, cy+2);
    ctx.lineTo(cx-12, cy+14);
    ctx.lineTo(cx+12, cy+14);
    ctx.lineTo(cx+12, cy+2);
    ctx.closePath();
    ctx.fill();
  }

  // blocks
  for(const b of runtime.blocks){
    const x = ox + b.x*cell;
    const y = oy + b.y*cell;
    if(!drawImageFit(ASSETS.block.img, x+2, y+2, cell-4, cell-4)){
      roundRect(ctx, x+5, y+5, cell-10, cell-10, 12);
      ctx.fillStyle = "rgba(10,13,16,0.85)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
    }
  }

  // hint pulse
  const t = nowMs();
  const hintActive = (runtime.hintPenguinIndex !== null && t <= runtime.hintUntilMs);
  if(!hintActive) runtime.hintPenguinIndex = null;
  const pulse = hintActive ? (0.5 + 0.5*Math.sin(t/80)) : 0;

  // penguins
  for(let i=0;i<runtime.penguins.length;i++){
    const p = runtime.penguins[i];
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);
    const bx = p.bumpX || 0;
    const by = p.bumpY || 0;

    const x = ox + rx*cell + bx;
    const y = oy + ry*cell + by;

    // hint sparkle (image if exists)
    if(hintActive && i===runtime.hintPenguinIndex){
      if(ASSETS.sparkle.img){
        ctx.globalAlpha = 0.55 + 0.45*pulse;
        ctx.drawImage(ASSETS.sparkle.img, x - cell*0.2, y - cell*0.2, cell*1.4, cell*1.4);
        ctx.globalAlpha = 1;
      }else{
        ctx.strokeStyle = `rgba(255, 245, 140, ${0.25 + 0.55*pulse})`;
        ctx.lineWidth = 5;
        roundRect(ctx, x+2, y+2, cell-4, cell-4, 18);
        ctx.stroke();
      }
    }

    const isHero = (i===0);
    const img = isHero ? ASSETS.hero.img : ASSETS.penguin.img;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.beginPath();
    ctx.ellipse(x+cell/2, y+cell*0.74, cell*0.24, cell*0.10, 0, 0, Math.PI*2);
    ctx.fill();

    if(img){
      ctx.drawImage(img, x+cell*0.08, y+cell*0.02, cell*0.84, cell*0.96);
    }else{
      // fallback
      roundRect(ctx, x+cell*0.20, y+cell*0.16, cell*0.60, cell*0.66, cell*0.22);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();

      roundRect(ctx, x+cell*0.30, y+cell*0.30, cell*0.40, cell*0.48, cell*0.18);
      ctx.fillStyle = isHero ? "rgba(90,180,255,0.80)" : "rgba(60,145,230,0.70)";
      ctx.fill();
    }
  }

  if(runtime.hintPenguinIndex !== null){
    requestAnimationFrame(draw);
  }
}

// --------------------
// Pointer handling
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
  const pad = 46;
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;
  const gx = Math.floor((p.x - ox)/cell);
  const gy = Math.floor((p.y - oy)/cell);
  return {gx, gy};
}
function onDown(e){
  if(runtime.busy || runtime.gameOver || runtime.cleared) return;
  runtime.pointerDown = true;
  const p = getCanvasPos(e);
  runtime.lastPointer = p;
  runtime.downPos = p;

  const {gx,gy} = cellFromPos(p);
  runtime.selected = penguinAt(gx,gy,-1);
  draw();
}
function onMove(e){
  if(!runtime.pointerDown) return;
  runtime.lastPointer = getCanvasPos(e);
  draw();
}
function onUp(){
  if(!runtime.pointerDown) return;
  runtime.pointerDown = false;

  if(runtime.selected === -1){
    draw();
    return;
  }

  const dx = runtime.lastPointer.x - runtime.downPos.x;
  const dy = runtime.lastPointer.y - runtime.downPos.y;
  const dir = dirFromDrag(dx,dy);

  tryMovePenguin(runtime.selected, dir);
  runtime.selected = -1;
  draw();
}

canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); onDown(e); }, {passive:false});
canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); onMove(e); }, {passive:false});
canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); onUp(e); }, {passive:false});

window.addEventListener('resize', ()=>draw());
window.addEventListener('orientationchange', ()=>setTimeout(draw,50));

// --------------------
// Buttons wiring
// --------------------
btnUndo.onclick = ()=>useUndo();
btnHint.onclick = ()=>useHint();

btnGear.onclick = ()=>show(gearOverlay);
btnGearClose.onclick = ()=>hide(gearOverlay);

btnGearHome.onclick = ()=>{
  hide(gearOverlay);
  showHome();
};

btnGearRestart.onclick = ()=>{
  // 클리어 오버레이가 떠 있을 때는 재시작 대신 홈/다음 사용 유도
  if(runtime.cleared){
    toast("클리어 후에는 다음/홈을 선택해주세요");
    return;
  }
  hide(gearOverlay);
  hide(failOverlay);
  restartCurrentStage();
};

btnGearProfile.onclick = ()=>{
  hide(gearOverlay);
  const s = stageSpec(player.progressStage);
  profileText.textContent =
    `진행 스테이지: ${player.progressStage}\n`+
    `현재 플레이: ${runtime.currentStage ?? "-"}\n`+
    `골드: ${player.gold}\n`+
    `무르기권: ${player.undo}\n`+
    `힌트권: ${player.hint}\n\n`+
    `다음 스테이지 난이도(내부 기준)\n- 보드: ${s.W}x${s.W}\n- 최단해 목표: ${s.min}~${s.max}`;
  show(profileOverlay);
};
btnProfileClose.onclick = ()=>hide(profileOverlay);

btnSound.onclick = ()=>toggleSound();

btnPlay.onclick = ()=>startGameFlow();

btnShop.onclick = ()=>{
  hide(homeOverlay);
  show(shopOverlay);
};
btnShopClose.onclick = ()=>{
  hide(shopOverlay);
  show(homeOverlay);
  updateHUD();
};

btnHomeGear.onclick = ()=>show(gearOverlay);

btnFailHome.onclick = ()=>{
  hide(failOverlay);
  showHome();
};
btnFailRetry.onclick = ()=>{
  hide(failOverlay);
  restartCurrentStage();
};

btnClearHome.onclick = ()=>{
  hide(clearOverlay);
  showHome();
};
btnClearNext.onclick = ()=>{
  hide(clearOverlay);
  startGameFlow();
};

buyUndo.onclick = ()=>tryBuy(200, ()=>{ player.undo += 5; });
buyHint.onclick = ()=>tryBuy(200, ()=>{ player.hint += 5; });

// --------------------
// Boot
// --------------------
async function boot(){
  // splash
  await sleep(900);
  hide(splashOverlay);

  // preload (illustration-ready)
  await preloadAssets();

  // sound icon
  btnSound.textContent = player.soundOn ? "🔊" : "🔇";

  // session resume check
  const session = loadSession();
  if(session && session.currentStage && session.puzzle){
    // 복구 확인 없이 바로 복귀(원하면 나중에 “이어서 하기” 버튼으로 바꿔도 됨)
    show(loadingOverlay);
    loadingTitle.textContent = "이어서 시작…";
    loadingDesc.textContent = "이전 플레이를 복원하고 있어요";
    await sleep(150);

    hide(homeOverlay);
    hud.style.display = "flex";
    bottomBar.style.display = "flex";
    hide(loadingOverlay);

    const elapsed = 0; // 정확 복원은 단순화
    const restoreState = {
      penguins: session.penguins,
      moves: session.moves,
      elapsedSec: elapsed,
    };
    loadPuzzleToRuntime(session.currentStage, session.puzzle, restoreState);
    return;
  }

  // go home
  showHome();
}

boot();
