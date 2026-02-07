// PENGUIN ESCAPE v4.1
// Fixes:
// - penguin_0~3 are NOT animation frames; they are 4 different penguin types
//   -> 0 = main(hero), 1~3 = non-hero penguins
// - asset name typo fixed: panguiun_* -> penguin_*
// - rendering now uses penguin_0/1/2/3 per penguin index

// --------------------
// Viewport helper (iOS/Android 주소창 대응)
// --------------------
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => setTimeout(setVH, 50));
setVH();

// --------------------
// DOM
// --------------------
const bg = document.getElementById('bg');
const splashLogo = document.getElementById('splashLogo');

const homeLayer = document.getElementById('homeLayer');
const gameLayer = document.getElementById('gameLayer');

const topBar = document.getElementById('topBar');
const goldText = document.getElementById('goldText');
const gemText = document.getElementById('gemText');

const btnStage = document.getElementById('btnStage');
const btnDaily = document.getElementById('btnDaily');
const stageLabel = document.getElementById('stageLabel');

const btnNavShop = document.getElementById('btnNavShop');
const btnNavHome = document.getElementById('btnNavHome');
const btnNavEvent = document.getElementById('btnNavEvent');

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: true });

const btnSetting = document.getElementById('btnSetting');
const btnUndo = document.getElementById('btnUndo');
const btnHint = document.getElementById('btnHint');
const btnRetry = document.getElementById('btnRetry');
const undoCnt = document.getElementById('undoCnt');
const hintCnt = document.getElementById('hintCnt');

const toastWrap = document.getElementById('toast');
const toastText = document.getElementById('toastText');

const privacyCover = document.getElementById('privacyCover');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');

const gearOverlay = document.getElementById('gearOverlay');
const gearDesc = document.getElementById('gearDesc');
const btnSound = document.getElementById('btnSound');
const btnVibe = document.getElementById('btnVibe');
const btnLang = document.getElementById('btnLang');
const btnRestart = document.getElementById('btnRestart');
const btnGoHome = document.getElementById('btnGoHome');
const btnCloseGear = document.getElementById('btnCloseGear');

const shopOverlay = document.getElementById('shopOverlay');
const buyUndo = document.getElementById('buyUndo');
const buyHint = document.getElementById('buyHint');
const btnCloseShop = document.getElementById('btnCloseShop');

const purchaseOverlay = document.getElementById('purchaseOverlay');
const purchaseText = document.getElementById('purchaseText');
const btnPurchaseOk = document.getElementById('btnPurchaseOk');

const needItemOverlay = document.getElementById('needItemOverlay');
const needItemTitle = document.getElementById('needItemTitle');
const needItemDesc = document.getElementById('needItemDesc');
const btnNeedCancel = document.getElementById('btnNeedCancel');
const btnNeedBuy = document.getElementById('btnNeedBuy');

const failOverlay = document.getElementById('failOverlay');
const btnFailHome = document.getElementById('btnFailHome');
const btnFailRetry = document.getElementById('btnFailRetry');

const clearOverlay = document.getElementById('clearOverlay');
const clearDesc = document.getElementById('clearDesc');
const btnClearHome = document.getElementById('btnClearHome');
const btnClearNext = document.getElementById('btnClearNext');

const bgm = document.getElementById('bgm');

// --------------------
// Utils
// --------------------
function show(el){ el.classList.add('show'); }
function hide(el){ el.classList.remove('show'); }
function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function nowMs(){ return performance.now(); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function toast(msg){
  toastText.textContent = msg;
  toastWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toastWrap.classList.remove('show'), 1100);
}

function ymdLocal(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function formatCount(n){
  if(n >= 10000) return "9999+";
  return String(n);
}

// --------------------
// Storage
// --------------------
const CACHE_VERSION = 5;

const SAVE = {
  v: "pe_v",
  gold: "pe_gold",
  gem: "pe_gem",
  progressStage: "pe_progress_stage",

  freeUndo: "pe_free_undo",
  freeHint: "pe_free_hint",
  paidUndo: "pe_paid_undo",
  paidHint: "pe_paid_hint",
  lastChargeEpoch: "pe_last_charge_epoch",

  sound: "pe_sound",
  vibe: "pe_vibe",
  lang: "pe_lang",

  stagePuzPrefix: "pe_stage_puz_",
  stagePuzIndex: "pe_stage_puz_index",
  daily: "pe_daily_pack",
  session: "pe_session",
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
function saveInt(key, v){ try{ localStorage.setItem(key, String(v)); }catch{} }
function saveJSON(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{} }

function resetIfNeeded(){
  const v = loadInt(SAVE.v, 0);
  if(v === CACHE_VERSION) return;

  try{
    const idx = loadJSON(SAVE.stagePuzIndex, []);
    for(const st of idx){
      localStorage.removeItem(SAVE.stagePuzPrefix + st);
    }
    localStorage.removeItem(SAVE.stagePuzIndex);
  }catch{}
  try{ localStorage.removeItem(SAVE.session); }catch{}
  try{ localStorage.removeItem(SAVE.daily); }catch{}

  saveInt(SAVE.v, CACHE_VERSION);
}
resetIfNeeded();

const player = {
  gold: loadInt(SAVE.gold, 0),
  gem: loadInt(SAVE.gem, 0),
  progressStage: loadInt(SAVE.progressStage, 1),

  freeUndo: loadInt(SAVE.freeUndo, 3),
  freeHint: loadInt(SAVE.freeHint, 3),
  paidUndo: loadInt(SAVE.paidUndo, 0),
  paidHint: loadInt(SAVE.paidHint, 0),
  lastChargeEpoch: loadInt(SAVE.lastChargeEpoch, Date.now()),

  soundOn: loadInt(SAVE.sound, 1) === 1,
  vibeOn: loadInt(SAVE.vibe, 1) === 1,
  lang: localStorage.getItem(SAVE.lang) || "ko",
};

function savePlayer(){
  saveInt(SAVE.gold, player.gold);
  saveInt(SAVE.gem, player.gem);
  saveInt(SAVE.progressStage, player.progressStage);

  saveInt(SAVE.freeUndo, player.freeUndo);
  saveInt(SAVE.freeHint, player.freeHint);
  saveInt(SAVE.paidUndo, player.paidUndo);
  saveInt(SAVE.paidHint, player.paidHint);
  saveInt(SAVE.lastChargeEpoch, player.lastChargeEpoch);

  saveInt(SAVE.sound, player.soundOn ? 1 : 0);
  saveInt(SAVE.vibe, player.vibeOn ? 1 : 0);
  try{ localStorage.setItem(SAVE.lang, player.lang); }catch{}
}

function totalUndo(){ return player.freeUndo + player.paidUndo; }
function totalHint(){ return player.freeHint + player.paidHint; }

// --------------------
// Recharge policy
// --------------------
const CHARGE_MS = 5 * 60 * 1000;
const FREE_CAP = 5;

function rechargeIfNeeded(){
  const now = Date.now();
  let last = player.lastChargeEpoch || now;
  if(now < last) last = now;

  const elapsed = now - last;
  const steps = Math.floor(elapsed / CHARGE_MS);
  if(steps <= 0) return;

  player.freeUndo = Math.min(FREE_CAP, player.freeUndo + steps);
  player.freeHint = Math.min(FREE_CAP, player.freeHint + steps);

  player.lastChargeEpoch = last + steps * CHARGE_MS;
  savePlayer();
}

// --------------------
// Difficulty policies
// --------------------
function stageSpec(stage){
  if(stage <= 10) return { W:5, min:2, max:3 };
  if(stage <= 100) return { W:5, min:4, max:6 };
  if(stage <= 200) return { W:5, min:7, max:10 };
  if(stage <= 300) return { W:5, min:10, max:12 };
  return { W:7, min:8, max:12 };
}

const DAILY_SPEC = { W:7, min:12, max:15 };
const DAILY_COUNT = 3;

// --------------------
// Assets
// --------------------
const ASSETS = {
  bg: {
    home:   { img:null, src:"./asset/images/bg/home.png" },
    sea:    { img:null, src:"./asset/images/bg/sea.png" },
    splash: { img:null, src:"./asset/images/bg/splash_bg.png" },
  },
  board: {
    ice: { img:null, src:"./asset/images/board/ice_tile.png" },
  },
  piece: {
    goal: { img:null, src:"./asset/images/piece/goal.png" },
    rock: { img:null, src:"./asset/images/piece/rock.png" },

    // ✅ penguin types (0=hero, 1~3=non-hero)
    peng0: { img:null, src:"./asset/images/piece/penguin_0.png" },
    peng1: { img:null, src:"./asset/images/piece/penguin_1.png" },
    peng2: { img:null, src:"./asset/images/piece/penguin_2.png" },
    peng3: { img:null, src:"./asset/images/piece/penguin_3.png" },
  }
};

function loadImage(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>resolve({ok:true,img});
    img.onerror = ()=>resolve({ok:false,img:null});
    img.src = src;
  });
}

async function preloadAssets(){
  loadingTitle.textContent = "로딩 중…";
  loadingDesc.textContent = "리소스를 준비하고 있어요";
  show(loadingOverlay);

  const flat = [];
  for(const group of Object.values(ASSETS)){
    for(const item of Object.values(group)){
      flat.push(item);
    }
  }

  for(let i=0;i<flat.length;i++){
    const it = flat[i];
    const r = await loadImage(it.src);
    it.img = r.ok ? r.img : null;
    loadingDesc.textContent = `리소스 준비 중… (${i+1}/${flat.length})`;
  }

  hide(loadingOverlay);
}

// --------------------
// Mode / runtime
// --------------------
const MODE = { HOME:"home", STAGE:"stage", DAILY:"daily" };

const runtime = {
  mode: MODE.HOME,

  currentStage: null,
  dailyDate: null,
  dailyIndex: null,

  puzzle: null,
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

  pointerDown:false,
  selected:-1,
  downPos:{x:0,y:0},
  lastPointer:{x:0,y:0},

  paused:false,
};

const DIRS = [
  {x: 1, y: 0}, {x:-1, y: 0}, {x: 0, y: 1}, {x: 0, y:-1},
];

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

// --------------------
// Reward
// --------------------
const REWARD_MAX = 100;
const REWARD_DECAY_PER_SEC = 1;

function elapsedSec(){
  return Math.floor((nowMs() - runtime.startTimeMs)/1000);
}
function currentReward(){
  return clamp(REWARD_MAX - elapsedSec()*REWARD_DECAY_PER_SEC, 0, REWARD_MAX);
}

// --------------------
// HUD update
// --------------------
function updateHUD(){
  rechargeIfNeeded();

  goldText.textContent = formatCount(player.gold);
  gemText.textContent = formatCount(player.gem);

  undoCnt.textContent = String(totalUndo());
  hintCnt.textContent = String(totalHint());

  stageLabel.textContent = `LEVEL ${player.progressStage}`;
}

// --------------------
// Loop
// --------------------
let raf = 0;
function startLoop(){
  stopLoop();
  const tick = ()=>{
    if(runtime.paused) return;
    updateHUD();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function stopLoop(){
  if(raf) cancelAnimationFrame(raf);
  raf = 0;
}

// --------------------
// Generator / Solver
// --------------------
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
function solveBFS(puzzle, startPosOverride=null, maxDepth=60){
  const W0 = puzzle.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };
  const blocksStatic = puzzle.blocks.map(([x,y])=>({x,y}));
  const startPosArr = (startPosOverride ?? puzzle.penguins).map(([x,y])=>({x,y}));

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

function generatePuzzle(spec){
  const W0 = spec.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };

  const blockMin = (W0===5) ? 1 : 4;
  const blockMax = (W0===5) ? 4 : 9;

  const MAX_TRIES = 4000;

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
    const res = solveBFS(puzzle, null, spec.max + 20);

    if(res.solvable && res.minMoves >= spec.min && res.minMoves <= spec.max){
      return puzzle;
    }
  }

  return { W:W0, blocks:[], penguins:[[0,W0-1],[W0-1,0],[1,1],[W0-2,W0-2]] };
}

// --------------------
// Cache
// --------------------
function getStagePuzzleFromCache(stage){
  return loadJSON(SAVE.stagePuzPrefix + stage, null);
}
function setStagePuzzleToCache(stage, puzzle){
  saveJSON(SAVE.stagePuzPrefix + stage, puzzle);
  const idx = loadJSON(SAVE.stagePuzIndex, []);
  if(!idx.includes(stage)){
    idx.push(stage);
    saveJSON(SAVE.stagePuzIndex, idx);
  }
}
function getOrCreateStagePuzzle(stage){
  const cached = getStagePuzzleFromCache(stage);
  if(cached) return cached;
  const puzzle = generatePuzzle(stageSpec(stage));
  setStagePuzzleToCache(stage, puzzle);
  return puzzle;
}

// Daily pack
function getOrCreateDailyPack(){
  const today = ymdLocal();
  const pack = loadJSON(SAVE.daily, null);
  if(pack && pack.date === today && Array.isArray(pack.puzzles) && pack.puzzles.length === DAILY_COUNT){
    return pack;
  }
  const puzzles = [];
  for(let i=0;i<DAILY_COUNT;i++){
    puzzles.push(generatePuzzle(DAILY_SPEC));
  }
  const next = { date: today, puzzles, cleared: [false,false,false] };
  saveJSON(SAVE.daily, next);
  return next;
}
function markDailyCleared(index){
  const pack = getOrCreateDailyPack();
  pack.cleared[index] = true;
  saveJSON(SAVE.daily, pack);
}

// Session
function saveSession(){
  if(!runtime.puzzle) return;
  const session = {
    mode: runtime.mode,
    stage: runtime.currentStage,
    dailyDate: runtime.dailyDate,
    dailyIndex: runtime.dailyIndex,
    puzzle: runtime.puzzle,
    penguins: runtime.penguins.map(p=>[p.x,p.y]),
    moves: runtime.moves,
    elapsedSec: elapsedSec(),
  };
  saveJSON(SAVE.session, session);
}
function clearSession(){ try{ localStorage.removeItem(SAVE.session); }catch{} }
function loadSession(){ return loadJSON(SAVE.session, null); }

// --------------------
// Load puzzle
// --------------------
function loadPuzzleToRuntime({mode, stage=null, dailyDate=null, dailyIndex=null, puzzle, restoreState=null}){
  runtime.mode = mode;
  runtime.currentStage = stage;
  runtime.dailyDate = dailyDate;
  runtime.dailyIndex = dailyIndex;

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
  draw();
  saveSession();
}

// --------------------
// Movement + Undo/Hint
// --------------------
function dirFromDrag(dx,dy){
  const adx=Math.abs(dx), ady=Math.abs(dy);
  const dead = 18;
  if(adx<dead && ady<dead) return null;
  if(adx>ady) return dx>0 ? {x:1,y:0} : {x:-1,y:0};
  return dy>0 ? {x:0,y:1} : {x:0,y:-1};
}

const HISTORY_MAX = 40;
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
    delete runtime.penguins[i]._rx;
    delete runtime.penguins[i]._ry;
  }
  runtime.moves = s.moves;
  saveSession();
  return true;
}

function vibrate(ms=20){
  if(!player.vibeOn) return;
  try{ navigator.vibrate?.(ms); }catch{}
}

function animateSlide(index, from, to, fellOff){
  const start = nowMs();
  const dur = 220;
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
        show(failOverlay);
        saveSession();
      }else{
        p.x=tx; p.y=ty;
        runtime.moves++;

        if(index===0 && p.x===runtime.home.x && p.y===runtime.home.y){
          runtime.cleared = true;
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
  if(runtime.paused) return;
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
      vibrate(25);
      animateSlide(index, {x,y}, {x:nx,y:ny}, true);
      return;
    }

    if(cellBlocked(nx,ny)) break;
    if(penguinAt(nx,ny,index) !== -1) break;

    x=nx; y=ny; moved=true;
  }

  if(!moved){
    toast("못 움직여!");
    return;
  }

  snapshot();
  runtime.busy = true;
  vibrate(12);
  animateSlide(index, {x:p.x,y:p.y}, {x,y}, false);
}

const COST_UNDO = 100;
const COST_HINT = 100;

function spendUndoOne(){
  if(player.freeUndo > 0){ player.freeUndo--; return true; }
  if(player.paidUndo > 0){ player.paidUndo--; return true; }
  return false;
}
function spendHintOne(){
  if(player.freeHint > 0){ player.freeHint--; return true; }
  if(player.paidHint > 0){ player.paidHint--; return true; }
  return false;
}
function currentPositionsAsArray(){
  return runtime.penguins.map(p=>[p.x,p.y]);
}

let needBuyContext = null;
function openNeedItem(type){
  needBuyContext = { type };
  if(type === "undo"){
    needItemTitle.textContent = "무르기권이 없어요";
    needItemDesc.textContent = `무르기 +1을 ${COST_UNDO}골드로 구매할까요?`;
  }else{
    needItemTitle.textContent = "힌트권이 없어요";
    needItemDesc.textContent = `힌트 +1을 ${COST_HINT}골드로 구매할까요?`;
  }
  show(needItemOverlay);
}

function useUndo(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;

  rechargeIfNeeded();

  if(totalUndo() <= 0){
    openNeedItem("undo");
    return;
  }
  if(runtime.history.length === 0){
    toast("되돌릴 수 없어요");
    return;
  }

  if(!spendUndoOne()){
    openNeedItem("undo");
    return;
  }

  savePlayer();
  updateHUD();
  restoreSnapshot();
  draw();
}

function useHint(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;

  rechargeIfNeeded();

  if(totalHint() <= 0){
    openNeedItem("hint");
    return;
  }

  if(!spendHintOne()){
    openNeedItem("hint");
    return;
  }

  savePlayer();
  updateHUD();

  const res = solveBFS(runtime.puzzle, currentPositionsAsArray(), 80);
  if(!res.solvable || !res.path || res.path.length===0){
    toast("힌트를 만들 수 없어요");
    return;
  }

  runtime.hintPenguinIndex = res.path[0].penguin;
  runtime.hintUntilMs = nowMs() + 1500;
  toast("힌트!");
  draw();
}

function restartCurrent(){
  if(runtime.mode === MODE.STAGE){
    const stage = runtime.currentStage ?? player.progressStage;
    const puzzle = getOrCreateStagePuzzle(stage);
    loadPuzzleToRuntime({ mode: MODE.STAGE, stage, puzzle });
    toast("재시도!");
  }else if(runtime.mode === MODE.DAILY){
    const pack = getOrCreateDailyPack();
    const idx = runtime.dailyIndex ?? 0;
    const puzzle = pack.puzzles[idx];
    loadPuzzleToRuntime({ mode: MODE.DAILY, dailyDate: pack.date, dailyIndex: idx, puzzle });
    toast("재시도!");
  }
}

// --------------------
// Clear
// --------------------
function onClear(){
  const reward = currentReward();
  player.gold += reward;

  if(runtime.mode === MODE.STAGE){
    player.progressStage = Math.max(player.progressStage, (runtime.currentStage ?? 1) + 1);
  }else if(runtime.mode === MODE.DAILY){
    if(runtime.dailyIndex != null) markDailyCleared(runtime.dailyIndex);
  }

  savePlayer();
  clearSession();

  const meta =
    runtime.mode === MODE.DAILY
      ? `일일 도전 보상: ${reward} 골드\n(오늘의 ${(runtime.dailyIndex??0)+1}/${DAILY_COUNT})`
      : `스테이지 보상: ${reward} 골드\n(시간에 따라 감소)`;

  clearDesc.textContent = meta;
  show(clearOverlay);
}

// --------------------
// Shop
// --------------------
function openPurchasePopup(text){
  purchaseText.textContent = text;
  show(purchaseOverlay);
}
function tryBuy(cost, onBuy, doneText){
  rechargeIfNeeded();

  if(player.gold < cost){
    toast("골드가 부족해요");
    return false;
  }
  player.gold -= cost;
  onBuy();
  savePlayer();
  updateHUD();
  openPurchasePopup(doneText);
  return true;
}

// --------------------
// Canvas sizing
// --------------------
function resizeCanvasToDisplaySize(){
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const w = Math.max(2, Math.floor(rect.width * dpr));
  const h = Math.max(2, Math.floor(rect.height * dpr));
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w;
    canvas.height = h;
  }
}

// --------------------
// Rendering helpers
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

function drawImageCover(img, x,y,w,h){
  if(!img) return false;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if(iw<=0 || ih<=0){
    ctx.drawImage(img, x,y,w,h);
    return true;
  }
  const scale = Math.max(w/iw, h/ih);
  const sw = w/scale;
  const sh = h/scale;
  const sx = (iw - sw)/2;
  const sy = (ih - sh)/2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  return true;
}

function penguinImageByIndex(i){
  if(i === 0) return ASSETS.piece.peng0.img;
  if(i === 1) return ASSETS.piece.peng1.img;
  if(i === 2) return ASSETS.piece.peng2.img;
  return ASSETS.piece.peng3.img;
}

// --------------------
// Draw
// --------------------
function draw(){
  if(gameLayer.style.display === "none") return;

  resizeCanvasToDisplaySize();
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!runtime.puzzle) return;

  const pad = Math.max(18, Math.min(canvas.width, canvas.height) * 0.06);
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;

  // board clip
  ctx.save();
  roundRect(ctx, ox, oy, size, size, Math.max(16, cell*0.25));
  ctx.clip();

  // tiles per cell
  const tile = ASSETS.board.ice.img;
  for(let y=0;y<runtime.W;y++){
    for(let x=0;x<runtime.W;x++){
      const tx = ox + x*cell;
      const ty = oy + y*cell;
      if(tile){
        drawImageCover(tile, tx, ty, cell, cell);
      }else{
        ctx.fillStyle = "rgba(191,233,255,0.14)";
        ctx.fillRect(tx, ty, cell, cell);
      }
    }
  }

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = Math.max(1, cell*0.03);
  for(let i=0;i<=runtime.W;i++){
    const x = ox + i*cell;
    const y = oy + i*cell;
    ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+size,y); ctx.stroke();
  }

  // goal
  const hx = ox + runtime.home.x*cell;
  const hy = oy + runtime.home.y*cell;
  if(!drawImageCover(ASSETS.piece.goal.img, hx, hy, cell, cell)){
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, hx+cell*0.12, hy+cell*0.12, cell*0.76, cell*0.76, cell*0.2);
    ctx.fill();
  }

  // rocks
  for(const b of runtime.blocks){
    const x = ox + b.x*cell;
    const y = oy + b.y*cell;
    if(!drawImageCover(ASSETS.piece.rock.img, x, y, cell, cell)){
      ctx.fillStyle = "rgba(10,13,16,0.85)";
      roundRect(ctx, x+cell*0.14, y+cell*0.14, cell*0.72, cell*0.72, cell*0.18);
      ctx.fill();
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

    const x = ox + rx*cell;
    const y = oy + ry*cell;

    // hint ring
    if(hintActive && i===runtime.hintPenguinIndex){
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.55*pulse;
      ctx.lineWidth = Math.max(3, cell*0.08);
      ctx.strokeStyle = "rgba(255,245,140,1)";
      roundRect(ctx, x+cell*0.06, y+cell*0.06, cell*0.88, cell*0.88, cell*0.22);
      ctx.stroke();
      ctx.restore();
    }

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(x+cell/2, y+cell*0.82, cell*0.25, cell*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    // ✅ 펭귄 타입별 이미지 사용
    const img = penguinImageByIndex(i);
    if(img){
      // hero는 살짝 더 강조
      const scale = (i === 0) ? 0.96 : 0.92;
      const w = cell*scale;
      const h = cell*scale;
      ctx.drawImage(img, x+(cell-w)/2, y+(cell-h)/2 - cell*0.03, w, h);
    }else{
      // fallback
      ctx.fillStyle = (i===0) ? "rgba(255,255,255,0.92)" : "rgba(210,230,255,0.92)";
      roundRect(ctx, x+cell*0.22, y+cell*0.18, cell*0.56, cell*0.64, cell*0.2);
      ctx.fill();
    }
  }

  ctx.restore();

  if(runtime.hintPenguinIndex !== null){
    requestAnimationFrame(draw);
  }
}

// --------------------
// Pointer
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
  const pad = Math.max(18, Math.min(canvas.width, canvas.height) * 0.06);
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;
  const gx = Math.floor((p.x - ox)/cell);
  const gy = Math.floor((p.y - oy)/cell);
  return {gx, gy};
}

function onDown(e){
  if(runtime.paused) return;
  if(runtime.busy || runtime.gameOver || runtime.cleared) return;
  runtime.pointerDown = true;
  const p = getCanvasPos(e);
  runtime.lastPointer = p;
  runtime.downPos = p;

  const {gx,gy} = cellFromPos(p);
  runtime.selected = penguinAt(gx,gy,-1);
}
function onMove(e){
  if(!runtime.pointerDown) return;
  runtime.lastPointer = getCanvasPos(e);
}
function onUp(){
  if(!runtime.pointerDown) return;
  runtime.pointerDown = false;

  if(runtime.selected === -1) return;

  const dx = runtime.lastPointer.x - runtime.downPos.x;
  const dy = runtime.lastPointer.y - runtime.downPos.y;
  const dir = dirFromDrag(dx,dy);

  tryMovePenguin(runtime.selected, dir);
  runtime.selected = -1;
}

canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);

canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); onDown(e); }, {passive:false});
canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); onMove(e); }, {passive:false});
canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); onUp(e); }, {passive:false});

// --------------------
// UI flow
// --------------------
function setBG(stateClass){
  bg.className = "";
  bg.classList.add(stateClass);
}

function setPaused(paused){
  runtime.paused = paused;
  if(paused) privacyCover.classList.add('show');
  else privacyCover.classList.remove('show');
}

document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){
    setPaused(true);
  }else{
    setPaused(false);
    updateHUD();
    startLoop();
    draw();
  }
});

function enterHome(){
  runtime.mode = MODE.HOME;
  runtime.currentStage = null;
  runtime.dailyDate = null;
  runtime.dailyIndex = null;
  runtime.puzzle = null;

  setPaused(false);

  setBG("bg-home");
  splashLogo.style.display = "none";

  homeLayer.style.display = "block";
  gameLayer.style.display = "none";
  topBar.style.display = "none";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  updateHUD();
  startLoop();
}

async function enterStageMode(stage){
  setPaused(false);

  show(loadingOverlay);
  loadingTitle.textContent = "스테이지 준비 중…";
  loadingDesc.textContent = `LEVEL ${stage}`;

  setBG("bg-sea");
  splashLogo.style.display = "none";

  homeLayer.style.display = "none";
  gameLayer.style.display = "block";
  topBar.style.display = "block";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  await sleep(80);

  const puzzle = getOrCreateStagePuzzle(stage);
  loadPuzzleToRuntime({ mode: MODE.STAGE, stage, puzzle });

  hide(loadingOverlay);
  draw();
}

async function enterDailyMode(index){
  setPaused(false);

  const pack = getOrCreateDailyPack();
  const puzzle = pack.puzzles[index];

  show(loadingOverlay);
  loadingTitle.textContent = "일일 도전 준비 중…";
  loadingDesc.textContent = `${pack.date} · ${index+1}/${DAILY_COUNT}`;

  setBG("bg-sea");
  splashLogo.style.display = "none";

  homeLayer.style.display = "none";
  gameLayer.style.display = "block";
  topBar.style.display = "block";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  await sleep(80);

  loadPuzzleToRuntime({
    mode: MODE.DAILY,
    dailyDate: pack.date,
    dailyIndex: index,
    puzzle
  });

  hide(loadingOverlay);
  draw();
}

// --------------------
// Buttons
// --------------------
btnNavHome.onclick = ()=>enterHome();
btnStage.onclick = ()=>enterStageMode(player.progressStage);

btnDaily.onclick = ()=>{
  const pack = getOrCreateDailyPack();
  const firstNotCleared = pack.cleared.findIndex(v=>!v);
  const idx = (firstNotCleared === -1) ? 0 : firstNotCleared;
  enterDailyMode(idx);
};

btnNavShop.onclick = ()=> show(shopOverlay);
btnNavEvent.onclick = ()=> toast("이벤트는 준비 중!");

btnSetting.onclick = ()=>{
  gearDesc.textContent =
    runtime.mode === MODE.DAILY
      ? `일일 도전 · ${runtime.dailyDate} (${(runtime.dailyIndex??0)+1}/${DAILY_COUNT})`
      : `스테이지 · LEVEL ${runtime.currentStage ?? player.progressStage}`;
  show(gearOverlay);
  setPaused(true);
};

btnCloseGear.onclick = ()=>{
  hide(gearOverlay);
  setPaused(false);
};

btnGoHome.onclick = ()=>{
  hide(gearOverlay);
  clearSession();
  enterHome();
};

btnRestart.onclick = ()=>{
  hide(gearOverlay);
  setPaused(false);
  restartCurrent();
};

btnUndo.onclick = ()=>useUndo();
btnHint.onclick = ()=>useHint();
btnRetry.onclick = ()=>restartCurrent();

btnFailHome.onclick = ()=>{
  hide(failOverlay);
  clearSession();
  enterHome();
};
btnFailRetry.onclick = ()=>{
  hide(failOverlay);
  restartCurrent();
};

btnClearHome.onclick = ()=>{
  hide(clearOverlay);
  enterHome();
};
btnClearNext.onclick = ()=>{
  hide(clearOverlay);
  if(runtime.mode === MODE.STAGE){
    enterStageMode(player.progressStage);
  }else{
    const next = (runtime.dailyIndex ?? 0) + 1;
    if(next >= DAILY_COUNT){
      toast("오늘의 일일 도전 완료!");
      enterHome();
    }else{
      enterDailyMode(next);
    }
  }
};

btnCloseShop.onclick = ()=>hide(shopOverlay);
btnPurchaseOk.onclick = ()=>hide(purchaseOverlay);

buyUndo.onclick = ()=>{
  const ok = tryBuy(100, ()=>{ player.paidUndo += 1; }, "무르기 +1 구매 완료!");
  if(ok) hide(shopOverlay);
};
buyHint.onclick = ()=>{
  const ok = tryBuy(100, ()=>{ player.paidHint += 1; }, "힌트 +1 구매 완료!");
  if(ok) hide(shopOverlay);
};

btnNeedCancel.onclick = ()=>{ needBuyContext = null; hide(needItemOverlay); };
btnNeedBuy.onclick = ()=>{
  if(!needBuyContext) return;

  if(needBuyContext.type === "undo"){
    const ok = tryBuy(100, ()=>{ player.paidUndo += 1; }, "무르기 +1 구매 완료!");
    if(ok) hide(needItemOverlay);
  }else{
    const ok = tryBuy(100, ()=>{ player.paidHint += 1; }, "힌트 +1 구매 완료!");
    if(ok) hide(needItemOverlay);
  }
};

// Settings options
btnSound.onclick = async ()=>{
  player.soundOn = !player.soundOn;
  savePlayer();
  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;
  try{
    if(player.soundOn) await bgm.play();
    else bgm.pause();
  }catch{}
};
btnVibe.onclick = ()=>{
  player.vibeOn = !player.vibeOn;
  savePlayer();
  btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`;
  toast(player.vibeOn ? "진동 ON" : "진동 OFF");
  vibrate(25);
};
btnLang.onclick = ()=>{
  const order = ["ko","en","ja"];
  const i = order.indexOf(player.lang);
  player.lang = order[(i+1) % order.length];
  savePlayer();
  const label = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
  btnLang.textContent = `언어: ${label}`;
  toast(`언어 변경: ${label}`);
};

// --------------------
// Boot
// --------------------
async function boot(){
  setBG("bg-splash");
  splashLogo.style.display = "block";

  show(loadingOverlay);
  loadingTitle.textContent = "로딩 중…";
  loadingDesc.textContent = "리소스를 준비하고 있어요";

  await preloadAssets();

  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;
  btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`;
  const langLabel = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
  btnLang.textContent = `언어: ${langLabel}`;

  try{
    if(player.soundOn) await bgm.play();
  }catch{}

  await sleep(550);
  hide(loadingOverlay);

  const session = loadSession();
  if(session && session.puzzle && session.mode){
    if(session.mode === MODE.STAGE){
      await enterStageMode(session.stage ?? player.progressStage);
      loadPuzzleToRuntime({
        mode: MODE.STAGE,
        stage: session.stage ?? player.progressStage,
        puzzle: session.puzzle,
        restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
      });
      draw();
      startLoop();
      return;
    }
    if(session.mode === MODE.DAILY){
      const pack = getOrCreateDailyPack();
      if(session.dailyDate !== pack.date){
        clearSession();
        enterHome();
        return;
      }
      await enterDailyMode(session.dailyIndex ?? 0);
      loadPuzzleToRuntime({
        mode: MODE.DAILY,
        dailyDate: pack.date,
        dailyIndex: session.dailyIndex ?? 0,
        puzzle: session.puzzle,
        restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
      });
      draw();
      startLoop();
      return;
    }
  }

  enterHome();
}
boot();
