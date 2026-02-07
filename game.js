// PENGUIN ESCAPE (PENGTAL) v3
// - 이미지 경로: ./asset/images/... 구조 적용
// - HOME / STAGE / DAILY 모드 분리
// - 난이도 정책 재정리(요구사항 반영)
// - 상점: 구매 완료 팝업 + 인게임(무르기/힌트 부족 시) 골드 구매
// - 무르기/힌트 충전: 5분마다 +1(각각), 무료분 최대 5개, 구매분 무제한
// - 설정/백그라운드에서는 게임 화면 숨김(프라이버시 커버) + 타이머 정지

// --------------------
// DOM
// --------------------
const bg = document.getElementById('bg');
const frame = document.getElementById('frame');

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const splashLogo = document.getElementById('splashLogo');

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');

const goldText = document.getElementById('goldText');
const gemText = document.getElementById('gemText');

const btnSetting = document.getElementById('btnSetting');

const btnStage = document.getElementById('btnStage');
const btnDaily = document.getElementById('btnDaily');
const stageLabel = document.getElementById('stageLabel');

const nav = document.getElementById('nav');
const btnNavShop = document.getElementById('btnNavShop');
const btnNavHome = document.getElementById('btnNavHome');
const btnNavEvent = document.getElementById('btnNavEvent');

const btnUndo = document.getElementById('btnUndo');
const btnHint = document.getElementById('btnHint');
const undoCnt = document.getElementById('undoCnt');
const hintCnt = document.getElementById('hintCnt');

const toastWrap = document.getElementById('toast');
const toastText = document.getElementById('toastText');

const privacyCover = document.getElementById('privacyCover');

const gearOverlay = document.getElementById('gearOverlay');
const gearDesc = document.getElementById('gearDesc');
const btnSound = document.getElementById('btnSound');
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
  // 만자리까지(요구) - 너무 길면 줄여서
  if(n >= 10000) return "9999+";
  return String(n);
}

// --------------------
// Scaling (402x874)
// --------------------
function applyScale(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w/402, h/874);
  frame.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', applyScale);
window.addEventListener('orientationchange', ()=>setTimeout(applyScale,50));

// --------------------
// Storage keys + versioning
// --------------------
const CACHE_VERSION = 3;

const SAVE = {
  v: "pe_v",

  gold: "pe_gold",
  gem: "pe_gem",

  progressStage: "pe_progress_stage",

  // item counts: free(충전) / paid(구매)
  freeUndo: "pe_free_undo",
  freeHint: "pe_free_hint",
  paidUndo: "pe_paid_undo",
  paidHint: "pe_paid_hint",
  lastChargeEpoch: "pe_last_charge_epoch",

  sound: "pe_sound",

  // stage puzzle cache (stage mode)
  stagePuzPrefix: "pe_stage_puz_",
  stagePuzIndex: "pe_stage_puz_index",

  // daily puzzle (3 per day)
  daily: "pe_daily_pack",

  // session resume
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

  // 캐시/세션 정리
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

// --------------------
// Player
// --------------------
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
}

function totalUndo(){ return player.freeUndo + player.paidUndo; }
function totalHint(){ return player.freeHint + player.paidHint; }

// --------------------
// Recharge policy
// 4-1 5분마다 무르기 1개 / 힌트 1개
// 4-2 충전분 최대 5개
// 4-3 구매분 무제한
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
// 2-1 스테이지 정책
// 1~10 : 5x5, min 2 max 3
// 11~100 : 5x5, min 4 max 6
// 101~200 : 5x5, min 7 max 10
// 201~300 : 5x5, min 10 max 12
// 301~500 : 7x7, min 8 max 12
function stageSpec(stage){
  if(stage <= 10) return { W:5, min:2, max:3 };
  if(stage <= 100) return { W:5, min:4, max:6 };
  if(stage <= 200) return { W:5, min:7, max:10 };
  if(stage <= 300) return { W:5, min:10, max:12 };
  return { W:7, min:8, max:12 };
}

// 1-1 일일모드 정책: 7x7, min12 max15, 하루 3개, 매일 초기화
const DAILY_SPEC = { W:7, min:12, max:15 };
const DAILY_COUNT = 3;

// --------------------
// Assets
// --------------------
const ASSETS = {
  bg: {
    home: { img:null, src:"./asset/images/bg/home.png" },
    sea: { img:null, src:"./asset/images/bg/sea.png" },
    splash: { img:null, src:"./asset/images/bg/splash_bg.png" },
  },
  board: {
    ice: { img:null, src:"./asset/images/board/ice_tile.png" },
  },
  piece: {
    goal: { img:null, src:"./asset/images/piece/goal.png" },
    rock: { img:null, src:"./asset/images/piece/rock.png" },
    p0: { img:null, src:"./asset/images/piece/penguin_0.png" },
    p1: { img:null, src:"./asset/images/piece/penguin_1.png" },
    p2: { img:null, src:"./asset/images/piece/panguiun_2.png" }, // 폴더에 오타(panguiun) 그대로 반영
    p3: { img:null, src:"./asset/images/piece/panguiun_3.png" }, // 폴더에 오타(panguiun) 그대로 반영
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
  loadingDesc.textContent = "이미지를 준비하고 있어요";
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
// Game runtime
// --------------------
const MODE = {
  HOME: "home",
  STAGE: "stage",
  DAILY: "daily",
};

const runtime = {
  mode: MODE.HOME,

  // stage mode
  currentStage: null,

  // daily mode
  dailyIndex: null, // 0..2
  dailyDate: null,

  puzzle: null,
  W: 5,
  home: {x:2,y:2}, // goal 위치(항상 중앙)
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

// --------------------
// Reward / HUD
// --------------------
const REWARD_MAX = 100;
const REWARD_DECAY_PER_SEC = 1;
const TIMEBAR_MAX_SEC = 120; // 넉넉히

function elapsedSec(){
  return Math.floor((nowMs() - runtime.startTimeMs)/1000);
}
function currentReward(){
  return clamp(REWARD_MAX - elapsedSec()*REWARD_DECAY_PER_SEC, 0, REWARD_MAX);
}

function updateHUD(){
  rechargeIfNeeded();

  goldText.textContent = formatCount(player.gold);
  gemText.textContent = formatCount(player.gem);

  undoCnt.textContent = String(totalUndo());
  hintCnt.textContent = String(totalHint());

  // HOME 버튼 라벨
  stageLabel.textContent = `LEVEL ${player.progressStage}`;
}

// --------------------
// Timer loop (HUD 갱신용)
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
// Solver + Generator
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

function solveBFS(puzzle, startPosOverride=null, maxDepth=40){
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

function generatePuzzle(spec){
  const W0 = spec.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };

  // 장애물 개수: 5x5는 적게, 7x7은 조금 더
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
    const res = solveBFS(puzzle, null, spec.max + 15);

    if(res.solvable && res.minMoves >= spec.min && res.minMoves <= spec.max){
      return puzzle;
    }
  }

  // fallback
  return { W:W0, blocks:[], penguins:[[0,W0-1],[W0-1,0],[1,1],[W0-2,W0-2]] };
}

// --------------------
// Stage puzzle cache
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

// --------------------
// Daily pack (3 puzzles per day, reset daily)
// --------------------
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
  const next = {
    date: today,
    puzzles,
    // 간단 진행 기록(선택): cleared flags
    cleared: [false,false,false],
  };
  saveJSON(SAVE.daily, next);
  return next;
}
function markDailyCleared(index){
  const pack = getOrCreateDailyPack();
  pack.cleared[index] = true;
  saveJSON(SAVE.daily, pack);
}

// --------------------
// Session resume (선택: stage/daily 모두 가능)
// --------------------
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
function clearSession(){
  try{ localStorage.removeItem(SAVE.session); }catch{}
}
function loadSession(){
  return loadJSON(SAVE.session, null);
}

// --------------------
// Load puzzle into runtime
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
// Input / Movement
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
    delete runtime.penguins[i]._anim;
  }
  runtime.moves = s.moves;
  saveSession();
  return true;
}

function animateSlide(index, from, to, fellOff, dir){
  const start = nowMs();
  const dur = 230;
  const p = runtime.penguins[index];

  const fx=from.x, fy=from.y;
  const tx=to.x, ty=to.y;

  function tick(t){
    const k = Math.min(1,(t-start)/dur);
    const e = 1 - Math.pow(1-k, 3);

    p._rx = fx + (tx-fx)*e;
    p._ry = fy + (ty-fy)*e;

    // 간단 프레임 애니메이션(0~3)
    p._anim = Math.floor(e * 3);

    draw();

    if(k<1) requestAnimationFrame(tick);
    else{
      delete p._rx; delete p._ry; delete p._anim;

      if(fellOff){
        runtime.gameOver = true;
        toast("풍덩!");
        show(failOverlay);
        saveSession();
      }else{
        p.x=tx; p.y=ty;
        runtime.moves++;

        // hero(0번)만 골에 도착하면 성공
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
      animateSlide(index, {x,y}, {x:nx,y:ny}, true, dir);
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
  animateSlide(index, {x:p.x,y:p.y}, {x,y}, false, dir);
}

// --------------------
// Hint / Undo (with in-game purchase)
// --------------------
const COST_UNDO = 100;
const COST_HINT = 100;

function spendUndoOne(){
  // 무료 먼저 소모
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

let needBuyContext = null; // {type:"undo"|"hint"}
function openNeedItem(type){
  needBuyContext = { type };
  if(type === "undo"){
    needItemTitle.textContent = "무르기권이 없어요";
    needItemDesc.textContent = `무르기 +1을 ${COST_UNDO}골드로 구매할까요?`;
    btnNeedBuy.textContent = "구매";
  }else{
    needItemTitle.textContent = "힌트권이 없어요";
    needItemDesc.textContent = `힌트 +1을 ${COST_HINT}골드로 구매할까요?`;
    btnNeedBuy.textContent = "구매";
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

  const res = solveBFS(runtime.puzzle, currentPositionsAsArray(), 60);
  if(!res.solvable || !res.path || res.path.length===0){
    toast("힌트를 만들 수 없어요");
    return;
  }

  runtime.hintPenguinIndex = res.path[0].penguin;
  runtime.hintUntilMs = nowMs() + 1500;
  toast("힌트 표시!");
  draw();
}

// --------------------
// Clear / Fail flows
// --------------------
function onClear(){
  const reward = currentReward();
  player.gold += reward;

  if(runtime.mode === MODE.STAGE){
    // 스테이지 모드만 진행도 증가
    player.progressStage = Math.max(player.progressStage, (runtime.currentStage ?? 1) + 1);
  }else if(runtime.mode === MODE.DAILY){
    // 일일모드 클리어 체크
    if(runtime.dailyIndex != null) markDailyCleared(runtime.dailyIndex);
  }

  savePlayer();
  clearSession();

  const meta =
    runtime.mode === MODE.DAILY
      ? `일일 도전 보상: ${reward} 골드\n(오늘의 ${((runtime.dailyIndex??0)+1)}번째 스테이지)`
      : `스테이지 보상: ${reward} 골드\n(시간에 따라 감소)`;

  clearDesc.textContent = meta;
  show(clearOverlay);
}

// --------------------
// Shop
// 3-1 구매 완료 팝업
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

function drawImageFit(img, x,y,w,h){
  if(!img) return false;
  ctx.drawImage(img, x,y,w,h);
  return true;
}

function pickPenguinFrame(p){
  const a = p._anim ?? 0;
  if(a <= 0) return ASSETS.piece.p0.img;
  if(a === 1) return ASSETS.piece.p1.img || ASSETS.piece.p0.img;
  if(a === 2) return ASSETS.piece.p2.img || ASSETS.piece.p1.img || ASSETS.piece.p0.img;
  return ASSETS.piece.p3.img || ASSETS.piece.p2.img || ASSETS.piece.p0.img;
}

function draw(){
  if(canvas.style.display === "none") return;

  resizeCanvasToDisplaySize();
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const pad = 40;
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;

  // 바다 배경(캔버스 내부: 약한 톤)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // ice tile pattern
  if(ASSETS.board.ice.img){
    const pat = ctx.createPattern(ASSETS.board.ice.img, "repeat");
    if(pat){
      ctx.save();
      roundRect(ctx, ox, oy, size, size, 18);
      ctx.clip();
      ctx.fillStyle = pat;
      ctx.fillRect(ox, oy, size, size);
      ctx.restore();
    }
  }else{
    roundRect(ctx, ox, oy, size, size, 18);
    ctx.fillStyle = "rgba(191,233,255,0.14)";
    ctx.fill();
  }

  // grid line
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for(let i=0;i<=runtime.W;i++){
    const x = ox + i*cell;
    const y = oy + i*cell;
    ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+size,y); ctx.stroke();
  }

  // goal(center)
  const hx = ox + runtime.home.x*cell;
  const hy = oy + runtime.home.y*cell;
  if(!drawImageFit(ASSETS.piece.goal.img, hx+2, hy+2, cell-4, cell-4)){
    roundRect(ctx, hx+6, hy+6, cell-12, cell-12, 14);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fill();
  }

  // rocks
  for(const b of runtime.blocks){
    const x = ox + b.x*cell;
    const y = oy + b.y*cell;
    if(!drawImageFit(ASSETS.piece.rock.img, x+2, y+2, cell-4, cell-4)){
      roundRect(ctx, x+6, y+6, cell-12, cell-12, 12);
      ctx.fillStyle = "rgba(10,13,16,0.85)";
      ctx.fill();
    }
  }

  // hint highlight
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

    // hero emphasis
    if(i===0){
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.ellipse(x+cell/2, y+cell*0.76, cell*0.34, cell*0.14, 0, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255, 220, 120, 1)";
      ctx.fill();
      ctx.restore();
    }

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
    ctx.ellipse(x+cell/2, y+cell*0.80, cell*0.22, cell*0.10, 0, 0, Math.PI*2);
    ctx.fill();

    const img = pickPenguinFrame(p);
    if(img){
      const scale = (i===0) ? 1.05 : 1.0;
      const w = cell*0.86*scale;
      const h = cell*0.92*scale;
      const dx = x + (cell - w)/2;
      const dy = y + (cell - h)/2 - cell*0.02;
      ctx.drawImage(img, dx, dy, w, h);
    }else{
      roundRect(ctx, x+cell*0.20, y+cell*0.16, cell*0.60, cell*0.66, cell*0.22);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();
    }
  }

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
  const pad = 40;
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
// UI / Flow
// --------------------
function setBG(state){
  bg.classList.remove("bg-home","bg-sea","bg-splash");
  bg.classList.add(state);
}

function enterHome(){
  runtime.mode = MODE.HOME;
  runtime.currentStage = null;
  runtime.dailyIndex = null;
  runtime.dailyDate = null;
  runtime.puzzle = null;

  // UI
  setBG("bg-home");
  splashLogo.style.display = "none";
  canvas.style.display = "none";

  btnSetting.style.display = "none";
  document.getElementById('currency').style.display = "none";

  btnStage.style.display = "block";
  btnDaily.style.display = "block";
  nav.style.display = "flex";

  btnUndo.style.display = "none";
  btnHint.style.display = "none";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  privacyCover.classList.remove('show');

  updateHUD();
  startLoop();
}

async function enterStageMode(stage){
  runtime.paused = false;

  loadingTitle.textContent = "스테이지 준비 중…";
  loadingDesc.textContent = `LEVEL ${stage}`;
  show(loadingOverlay);

  setBG("bg-sea");
  splashLogo.style.display = "none";

  // UI show
  canvas.style.display = "block";
  btnSetting.style.display = "block";
  document.getElementById('currency').style.display = "flex";

  btnStage.style.display = "none";
  btnDaily.style.display = "none";
  nav.style.display = "none";

  btnUndo.style.display = "block";
  btnHint.style.display = "block";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  await sleep(120);

  const puzzle = getOrCreateStagePuzzle(stage);
  loadPuzzleToRuntime({ mode: MODE.STAGE, stage, puzzle });

  hide(loadingOverlay);
  draw();
}

async function enterDailyMode(index){
  runtime.paused = false;

  const pack = getOrCreateDailyPack();
  const puzzle = pack.puzzles[index];

  loadingTitle.textContent = "일일 도전 준비 중…";
  loadingDesc.textContent = `${pack.date} · ${index+1}/${DAILY_COUNT}`;
  show(loadingOverlay);

  setBG("bg-sea");
  splashLogo.style.display = "none";

  canvas.style.display = "block";
  btnSetting.style.display = "block";
  document.getElementById('currency').style.display = "flex";

  btnStage.style.display = "none";
  btnDaily.style.display = "none";
  nav.style.display = "none";

  btnUndo.style.display = "block";
  btnHint.style.display = "block";

  hide(failOverlay);
  hide(clearOverlay);
  hide(gearOverlay);
  hide(shopOverlay);
  hide(needItemOverlay);
  hide(purchaseOverlay);

  await sleep(120);

  loadPuzzleToRuntime({
    mode: MODE.DAILY,
    dailyDate: pack.date,
    dailyIndex: index,
    puzzle
  });

  hide(loadingOverlay);
  draw();
}

function restartCurrent(){
  if(runtime.mode === MODE.STAGE){
    const stage = runtime.currentStage ?? player.progressStage;
    const puzzle = getOrCreateStagePuzzle(stage);
    loadPuzzleToRuntime({ mode: MODE.STAGE, stage, puzzle });
    toast("다시 시작!");
  }else if(runtime.mode === MODE.DAILY){
    const pack = getOrCreateDailyPack();
    const idx = runtime.dailyIndex ?? 0;
    const puzzle = pack.puzzles[idx];
    loadPuzzleToRuntime({ mode: MODE.DAILY, dailyDate: pack.date, dailyIndex: idx, puzzle });
    toast("다시 시작!");
  }
}

// --------------------
// Privacy / Pause policy
// - 설정 열면 게임 화면 숨김
// - 백그라운드(visibility hidden)면 숨김 + 타이머 정지
// --------------------
function setPaused(paused, reason){
  runtime.paused = paused;

  if(paused){
    // 프라이버시 커버 ON
    show(privacyCover);
    privacyCover.classList.add('show');
  }else{
    privacyCover.classList.remove('show');
  }
}

document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){
    // 백그라운드 진입
    setPaused(true, "background");
  }else{
    // 복귀
    setPaused(false, "foreground");
    updateHUD();
    startLoop();
    draw();
  }
});

// --------------------
// Buttons wiring
// --------------------
btnNavHome.onclick = ()=>enterHome();

btnStage.onclick = ()=>enterStageMode(player.progressStage);

btnDaily.onclick = ()=>{
  // 요구: 하루 3스테이지만 존재
  // UX: 오늘 팩에서 "아직 안 깬 첫 스테이지"부터 시작(없으면 1번)
  const pack = getOrCreateDailyPack();
  const firstNotCleared = pack.cleared.findIndex(v=>!v);
  const idx = (firstNotCleared === -1) ? 0 : firstNotCleared;
  enterDailyMode(idx);
};

btnNavShop.onclick = ()=>{
  show(shopOverlay);
};
btnNavEvent.onclick = ()=>{
  toast("이벤트는 준비 중!");
};

btnSetting.onclick = ()=>{
  // 설정 열면 게임 화면 숨김(요구사항)
  gearDesc.textContent =
    runtime.mode === MODE.DAILY
      ? `일일 도전 · ${runtime.dailyDate} (${(runtime.dailyIndex??0)+1}/${DAILY_COUNT})`
      : `스테이지 · LEVEL ${runtime.currentStage ?? player.progressStage}`;
  show(gearOverlay);
  setPaused(true, "settings");
};

btnCloseGear.onclick = ()=>{
  hide(gearOverlay);
  setPaused(false, "settings");
};

btnGoHome.onclick = ()=>{
  hide(gearOverlay);
  clearSession();
  enterHome();
};

btnRestart.onclick = ()=>{
  hide(gearOverlay);
  setPaused(false, "settings");
  restartCurrent();
};

btnSound.onclick = async ()=>{
  player.soundOn = !player.soundOn;
  savePlayer();
  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;

  try{
    if(!bgm || !bgm.src) return;
    if(player.soundOn) await bgm.play();
    else bgm.pause();
  }catch{
    // 자동재생 제한은 정상
  }
};

btnUndo.onclick = ()=>useUndo();
btnHint.onclick = ()=>useHint();

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
    // 일일모드: 다음 스테이지(최대 3개)로 이동, 없으면 홈
    const next = (runtime.dailyIndex ?? 0) + 1;
    if(next >= DAILY_COUNT){
      toast("오늘의 일일 도전 완료!");
      enterHome();
    }else{
      enterDailyMode(next);
    }
  }
};

buyUndo.onclick = ()=>{
  tryBuy(COST_UNDO, ()=>{
    player.paidUndo += 1; // 구매분은 무제한 누적
  }, `무르기 +1 구매 완료!\n(구매분은 상한 없이 누적됩니다)`);
};

buyHint.onclick = ()=>{
  tryBuy(COST_HINT, ()=>{
    player.paidHint += 1;
  }, `힌트 +1 구매 완료!\n(구매분은 상한 없이 누적됩니다)`);
};

btnCloseShop.onclick = ()=>hide(shopOverlay);

btnPurchaseOk.onclick = ()=>hide(purchaseOverlay);

// 인게임 부족 시 구매
btnNeedCancel.onclick = ()=>{
  needBuyContext = null;
  hide(needItemOverlay);
};

btnNeedBuy.onclick = ()=>{
  if(!needBuyContext) return;

  if(needBuyContext.type === "undo"){
    const ok = tryBuy(COST_UNDO, ()=>{
      player.paidUndo += 1;
    }, `무르기 +1 구매 완료!\n이제 무르기를 사용할 수 있어요.`);
    if(ok) hide(needItemOverlay);
  }else{
    const ok = tryBuy(COST_HINT, ()=>{
      player.paidHint += 1;
    }, `힌트 +1 구매 완료!\n이제 힌트를 사용할 수 있어요.`);
    if(ok) hide(needItemOverlay);
  }
};

// --------------------
// Boot
// --------------------
async function boot(){
  applyScale();

  // splash 느낌(요구: 중앙 로고 자동 전환, 터치 없음)
  setBG("bg-splash");
  splashLogo.style.display = "block";

  show(loadingOverlay);
  loadingTitle.textContent = "리소스 로딩 중…";
  loadingDesc.textContent = "잠시만 기다려주세요";

  await preloadAssets();

  // BGM 초기 상태 반영
  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;
  try{
    if(player.soundOn) await bgm.play();
  }catch{}

  // 세션 복원(있으면)
  const session = loadSession();
  hide(loadingOverlay);

  if(session && session.puzzle && session.mode){
    // 복원 시 UI도 해당 모드로
    if(session.mode === MODE.STAGE){
      await enterStageMode(session.stage ?? player.progressStage);
      // 들어간 뒤 상태 덮어쓰기
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
      // 날짜가 바뀌었으면 복원 대신 홈
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

  // 기본 HOME
  enterHome();
}

boot();
