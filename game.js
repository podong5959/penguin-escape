// PENGUIN ESCAPE v5.0 (Full exchange)
// - Splash: blur bg + spinner only + TAP TO START after load
// - Home: nav lower + labels align + topBar shows coin/gem
// - Game: setting button aligned top-right, stage pill in center
// - Bottom action icons bigger (fill)
// - Board centered better
// - Movement slower + fail popup delayed slightly
// - Deterministic puzzles for everyone (seeded by stage / date / daily level)
// - Save persistence improved with optional userId namespace
// - Tutorial first-run + viewable in settings
// - Undo: unlimited free (∞)
// - Hint: no consume if unsolvable; highlight persists until next move; daily hint disabled with popup
// - Daily: 3 levels with new difficulty + absolute rewards + locked progression
// - Stage ready overlay linger (UX)

function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => setTimeout(setVH, 50));
setVH();

function $(id){
  const el = document.getElementById(id);
  if(!el) console.warn(`[Missing DOM] #${id}`);
  return el;
}

/* DOM */
const bg = $('bg');
const bgBlur = $('bgBlur');
const splashLogo = $('splashLogo');
const splashHint = $('splashHint');

const homeLayer = $('homeLayer');
const gameLayer = $('gameLayer');

const topBar = $('topBar');
const goldText = $('goldText');
const gemText = $('gemText');
const stagePillText = $('stagePillText');

const btnStage = $('btnStage');
const btnDaily = $('btnDaily');
const stageLabel = $('stageLabel');

const btnNavShop = $('btnNavShop');
const btnNavHome = $('btnNavHome');
const btnNavEvent = $('btnNavEvent');

const canvas = $('c');
const ctx = canvas?.getContext?.('2d', { alpha: true });

const btnSetting = $('btnSetting');
const btnUndo = $('btnUndo');
const btnHint = $('btnHint');
const btnRetry = $('btnRetry');
const undoCnt = $('undoCnt');
const hintCnt = $('hintCnt');

const toastWrap = $('toast');
const toastText = $('toastText');

const privacyCover = $('privacyCover');

const loadingOverlay = $('loadingOverlay');

const gearOverlay = $('gearOverlay');
const gearDesc = $('gearDesc');
const btnSound = $('btnSound');
const btnVibe = $('btnVibe');
const btnLang = $('btnLang');
const btnTutorial = $('btnTutorial');
const btnProfile = $('btnProfile');
const btnRestart = $('btnRestart');
const btnGoHome = $('btnGoHome');
const btnCloseGear = $('btnCloseGear');

const shopOverlay = $('shopOverlay');
const btnCloseShop = $('btnCloseShop');

const dailySelectOverlay = $('dailySelectOverlay');
const dailySelectDesc = $('dailySelectDesc');
const btnDaily1 = $('btnDaily1');
const btnDaily2 = $('btnDaily2');
const btnDaily3 = $('btnDaily3');
const btnCloseDailySelect = $('btnCloseDailySelect');

const tutorialOverlay = $('tutorialOverlay');
const btnTutorialClose = $('btnTutorialClose');

const profileOverlay = $('profileOverlay');
const profileDesc = $('profileDesc');
const btnSetUserId = $('btnSetUserId');
const btnUseGuest = $('btnUseGuest');
const btnCloseProfile = $('btnCloseProfile');

const infoOverlay = $('infoOverlay');
const infoTitle = $('infoTitle');
const infoDesc = $('infoDesc');
const btnInfoOk = $('btnInfoOk');

const failOverlay = $('failOverlay');
const btnFailHome = $('btnFailHome');
const btnFailRetry = $('btnFailRetry');

const clearOverlay = $('clearOverlay');
const clearDesc = $('clearDesc');
const btnClearHome = $('btnClearHome');
const btnClearNext = $('btnClearNext');

const bgm = $('bgm');

/* Utils */
function show(el){ el?.classList?.add('show'); }
function hide(el){ el?.classList?.remove('show'); }
function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function nowMs(){ return performance.now(); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function toast(msg){
  if(!toastWrap || !toastText) return;
  toastText.textContent = msg;
  toastWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toastWrap.classList.remove('show'), 1400);
}

function openInfo(title, desc){
  if(infoTitle) infoTitle.textContent = title || "안내";
  if(infoDesc) infoDesc.textContent = desc || "";
  show(infoOverlay);
}
btnInfoOk && (btnInfoOk.onclick = ()=>hide(infoOverlay));

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

/* Global error safety */
window.addEventListener('error', (e)=>{
  console.error('[Global Error]', e?.error || e?.message || e);
  toast('에러 발생: 콘솔 확인');
  try{
    hide(loadingOverlay);
    // 안전 복귀
    enterHomeSafe();
  }catch{}
});
window.addEventListener('unhandledrejection', (e)=>{
  console.error('[Unhandled Promise]', e?.reason || e);
  toast('에러 발생: 콘솔 확인');
  try{
    hide(loadingOverlay);
    enterHomeSafe();
  }catch{}
});

/* --------------------
   Save namespace (UserID optional)
-------------------- */
const CACHE_VERSION = 50;

// userId (optional)
const ROOT = {
  userId: "pe_user_id",
  guest: "guest",
};

function getUserId(){
  try{
    const v = localStorage.getItem(ROOT.userId);
    return (v && v.trim()) ? v.trim() : ROOT.guest;
  }catch{ return ROOT.guest; }
}
function setUserId(v){
  try{
    localStorage.setItem(ROOT.userId, v);
  }catch{}
}

function nsKey(k){
  const uid = getUserId();
  return `pe_${uid}__${k}`;
}

const SAVE = {
  v: "v",
  gold: "gold",
  gem: "gem",
  progressStage: "progress_stage",
  hint: "hint",
  tutorialDone: "tutorial_done",
  sound: "sound",
  vibe: "vibe",
  lang: "lang",
  stagePuzPrefix: "stage_puz_",
  stagePuzIndex: "stage_puz_index",
  daily: "daily_pack",
  session: "session",
};

function loadInt(key, fallback){
  try{
    const v = Number(localStorage.getItem(nsKey(key)));
    return Number.isFinite(v) ? v : fallback;
  }catch{ return fallback; }
}
function loadJSON(key, fallback){
  try{
    const t = localStorage.getItem(nsKey(key));
    if(!t) return fallback;
    return JSON.parse(t);
  }catch{ return fallback; }
}
function saveInt(key, v){ try{ localStorage.setItem(nsKey(key), String(v)); }catch{} }
function saveJSON(key, v){ try{ localStorage.setItem(nsKey(key), JSON.stringify(v)); }catch{} }
function removeKey(key){ try{ localStorage.removeItem(nsKey(key)); }catch{} }

// ✅ 버전 바뀌어도 진행도는 안 지움. 퍼즐 캐시만 갱신.
function resetIfNeeded(){
  const v = loadInt(SAVE.v, 0);
  if(v === CACHE_VERSION) return;

  try{
    const idx = loadJSON(SAVE.stagePuzIndex, []);
    for(const st of idx) localStorage.removeItem(nsKey(SAVE.stagePuzPrefix + st));
    removeKey(SAVE.stagePuzIndex);
  }catch{}
  try{ removeKey(SAVE.session); }catch{}
  try{ removeKey(SAVE.daily); }catch{}

  saveInt(SAVE.v, CACHE_VERSION);
}
resetIfNeeded();

/* Player */
const player = {
  gold: loadInt(SAVE.gold, 0),
  gem: loadInt(SAVE.gem, 0),
  progressStage: loadInt(SAVE.progressStage, 1),

  hint: loadInt(SAVE.hint, 3), // 힌트만 보유량 유지
  tutorialDone: loadInt(SAVE.tutorialDone, 0) === 1,

  soundOn: loadInt(SAVE.sound, 1) === 1,
  vibeOn: loadInt(SAVE.vibe, 1) === 1,
  lang: (()=>{
    try{ return localStorage.getItem(nsKey(SAVE.lang)) || "ko"; }catch{ return "ko"; }
  })(),
};

function savePlayer(){
  saveInt(SAVE.gold, player.gold);
  saveInt(SAVE.gem, player.gem);
  saveInt(SAVE.progressStage, player.progressStage);
  saveInt(SAVE.hint, player.hint);
  saveInt(SAVE.tutorialDone, player.tutorialDone ? 1 : 0);
  saveInt(SAVE.sound, player.soundOn ? 1 : 0);
  saveInt(SAVE.vibe, player.vibeOn ? 1 : 0);
  try{ localStorage.setItem(nsKey(SAVE.lang), player.lang); }catch{}
}

/* Modes */
const MODE = { SPLASH:"splash", HOME:"home", STAGE:"stage", DAILY:"daily" };

const runtime = {
  mode: MODE.SPLASH,

  currentStage: null,
  dailyDate: null,
  dailyLevel: null, // 1~3
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

  hintPenguinIndex: null, // 지속 하이라이트 (다음 액션까지)
  hintActive: false,

  pointerDown:false,
  selected:-1,
  downPos:{x:0,y:0},
  lastPointer:{x:0,y:0},

  paused:false,
};

const DIRS = [
  {x: 1, y: 0}, {x:-1, y: 0}, {x: 0, y: 1}, {x: 0, y:-1},
];

function clampStageLabel(){
  stageLabel && (stageLabel.textContent = `LEVEL ${player.progressStage}`);
}

/* Difficulty policies */
function stageSpec(stage){
  // 기존 정책 유지(너가 쓰던 범위) — 그대로 유지
  if(stage <= 10) return { W:5, min:2, max:3 };
  if(stage <= 100) return { W:5, min:4, max:6 };
  if(stage <= 200) return { W:5, min:7, max:10 };
  if(stage <= 300) return { W:5, min:10, max:12 };
  return { W:7, min:8, max:12 };
}

// ✅ 일일도전 정책 변경
// 1단계 5x5 min 7 max 10
// 2단계 7x7 min 10 max 12
// 3단계 7x7 min 12 max 15
function dailySpec(level){
  if(level === 1) return { W:5, min:7, max:10 };
  if(level === 2) return { W:7, min:10, max:12 };
  return { W:7, min:12, max:15 };
}
function dailyReward(level){
  if(level === 1) return { gold:200, gem:10 };
  if(level === 2) return { gold:300, gem:50 };
  return { gold:500, gem:100 };
}

/* Assets */
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
    peng0: { img:null, src:"./asset/images/piece/penguin_0.png" },
    peng1: { img:null, src:"./asset/images/piece/penguin_1.png" },
    peng2: { img:null, src:"./asset/images/piece/penguin_2.png" },
    peng3: { img:null, src:"./asset/images/piece/penguin_3.png" },
  }
};

function loadImageWithTimeout(src, timeoutMs=3500){
  return new Promise((resolve)=>{
    const img = new Image();
    let done = false;
    const finish = (ok)=>{
      if(done) return;
      done = true;
      img.onload = null;
      img.onerror = null;
      resolve({ ok, img: ok ? img : null, src });
    };
    const t = setTimeout(()=>finish(false), timeoutMs);
    img.onload = ()=>{ clearTimeout(t); finish(true); };
    img.onerror = ()=>{ clearTimeout(t); finish(false); };
    img.src = `${src}?v=${CACHE_VERSION}`;
  });
}

async function preloadAssets(){
  show(loadingOverlay); // 스피너만
  try{
    const flat = [];
    for(const group of Object.values(ASSETS)){
      for(const item of Object.values(group)) flat.push(item);
    }
    for(const it of flat){
      const r = await loadImageWithTimeout(it.src, 3500);
      it.img = r.ok ? r.img : null;
    }
  }finally{
    hide(loadingOverlay);
  }
}

/* HUD */
function setStagePill(text){
  if(stagePillText) stagePillText.textContent = text;
}
function updateHUD(){
  goldText && (goldText.textContent = formatCount(player.gold));
  gemText && (gemText.textContent = formatCount(player.gem));
  hintCnt && (hintCnt.textContent = String(player.hint));
  undoCnt && (undoCnt.textContent = "∞");
  clampStageLabel();

  if(runtime.mode === MODE.HOME){
    setStagePill("HOME");
  }else if(runtime.mode === MODE.STAGE){
    setStagePill(`LEVEL ${runtime.currentStage ?? player.progressStage}`);
  }else if(runtime.mode === MODE.DAILY){
    setStagePill(`일일 도전 ${runtime.dailyLevel}/3`);
  }else{
    setStagePill("SPLASH");
  }
}

/* Pause & privacy */
function setPaused(paused){
  runtime.paused = paused;
  if(paused) privacyCover?.classList?.add('show');
  else privacyCover?.classList?.remove('show');
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

/* Background */
function setBG(stateClass){
  if(!bg) return;
  bg.className = "";
  bg.classList.add(stateClass);
}

/* --------------------
   Deterministic RNG (seeded)
-------------------- */
function fnv1a(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function xorshift32(seed){
  let x = seed >>> 0;
  return function(){
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return x >>> 0;
  };
}
function makeRng(seedStr){
  const seed = fnv1a(seedStr) || 1;
  const next = xorshift32(seed);
  return {
    int(a,b){
      const r = next() / 0xFFFFFFFF;
      return Math.floor(r*(b-a+1)) + a;
    }
  };
}

/* Solver / generator */
function randInt(rng,a,b){ return rng.int(a,b); }
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
function solveBFS(puzzle, startPosOverride=null, maxDepth=80){
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

function generatePuzzleDeterministic(spec, seedStr){
  const W0 = spec.W;
  const home0 = { x: Math.floor(W0/2), y: Math.floor(W0/2) };
  const rng = makeRng(seedStr);

  const blockMin = (W0===5) ? 1 : 4;
  const blockMax = (W0===5) ? 4 : 9;

  const MAX_TRIES = 5000;

  for(let t=0;t<MAX_TRIES;t++){
    const blocksArr=[];
    const used = new Set([`${home0.x},${home0.y}`]);

    const blockCount = randInt(rng, blockMin, blockMax);
    while(blocksArr.length<blockCount){
      const x = randInt(rng, 0, W0-1), y = randInt(rng, 0, W0-1);
      const k=`${x},${y}`;
      if(used.has(k)) continue;
      used.add(k);
      blocksArr.push([x,y]);
    }

    const pengArr=[];
    const used2 = new Set(used);
    while(pengArr.length<4){
      const x = randInt(rng, 0, W0-1), y = randInt(rng, 0, W0-1);
      const k=`${x},${y}`;
      if(used2.has(k)) continue;
      used2.add(k);
      pengArr.push([x,y]);
    }
    if(pengArr[0][0]===home0.x && pengArr[0][1]===home0.y) continue;

    const puzzle = { W:W0, blocks:blocksArr, penguins:pengArr };
    const res = solveBFS(puzzle, null, spec.max + 25);

    if(res.solvable && res.minMoves >= spec.min && res.minMoves <= spec.max){
      return puzzle;
    }
  }
  // fallback (매번 동일)
  return { W:W0, blocks:[], penguins:[[0,W0-1],[W0-1,0],[1,1],[W0-2,W0-2]] };
}

/* Cache */
function getStagePuzzleFromCache(stage){ return loadJSON(SAVE.stagePuzPrefix + stage, null); }
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

  const spec = stageSpec(stage);
  // ✅ 모두 동일: stage 번호로 seed 고정
  const puzzle = generatePuzzleDeterministic(spec, `stage:${stage}:W${spec.W}:min${spec.min}:max${spec.max}`);
  setStagePuzzleToCache(stage, puzzle);
  return puzzle;
}

/* Daily pack (3 levels, lock progression) */
function getOrCreateDailyPack(){
  const today = ymdLocal();
  const pack = loadJSON(SAVE.daily, null);
  if(pack && pack.date === today && pack.levels && pack.cleared) return pack;

  const levels = [1,2,3].map(level=>{
    const spec = dailySpec(level);
    // ✅ 모두 동일: 날짜+레벨로 seed 고정
    const puzzle = generatePuzzleDeterministic(spec, `daily:${today}:level:${level}:W${spec.W}:min${spec.min}:max${spec.max}`);
    return { level, puzzle };
  });

  const next = { date: today, levels, cleared: {1:false,2:false,3:false} };
  saveJSON(SAVE.daily, next);
  return next;
}
function markDailyCleared(level){
  const pack = getOrCreateDailyPack();
  pack.cleared[level] = true;
  saveJSON(SAVE.daily, pack);
}

/* Session */
function saveSession(){
  if(!runtime.puzzle) return;
  const session = {
    mode: runtime.mode,
    stage: runtime.currentStage,
    dailyDate: runtime.dailyDate,
    dailyLevel: runtime.dailyLevel,
    puzzle: runtime.puzzle,
    penguins: runtime.penguins.map(p=>[p.x,p.y]),
    moves: runtime.moves,
    elapsedSec: Math.floor((nowMs() - runtime.startTimeMs)/1000),
  };
  saveJSON(SAVE.session, session);
}
function clearSession(){ removeKey(SAVE.session); }
function loadSession(){ return loadJSON(SAVE.session, null); }

/* Load puzzle to runtime */
function loadPuzzleToRuntime({mode, stage=null, dailyDate=null, dailyLevel=null, puzzle, restoreState=null}){
  runtime.mode = mode;
  runtime.currentStage = stage;
  runtime.dailyDate = dailyDate;
  runtime.dailyLevel = dailyLevel;

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

  runtime.startTimeMs = nowMs();
  runtime.hintPenguinIndex = null;
  runtime.hintActive = false;

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

/* Gameplay helpers */
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

function dirFromDrag(dx,dy){
  const adx=Math.abs(dx), ady=Math.abs(dy);
  const dead = 18;
  if(adx<dead && ady<dead) return null;
  if(adx>ady) return dx>0 ? {x:1,y:0} : {x:-1,y:0};
  return dy>0 ? {x:0,y:1} : {x:0,y:-1};
}

const HISTORY_MAX = 80;
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
  // 힌트 하이라이트는 “다음 움직임 전까지” 유지 정책이므로
  // undo는 유지해도 되지만 UX상 유지해도 문제 없음. (원하면 여기서 끌 수도 있음)
  saveSession();
  return true;
}

function vibrate(ms=20){
  if(!player.vibeOn) return;
  try{ navigator.vibrate?.(ms); }catch{}
}

/* ✅ 느린 이동 + 실패 팝업 지연 */
function animateSlide(index, from, to, fellOff){
  const start = nowMs();
  const dur = fellOff ? 460 : 360; // slower
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
        saveSession();
        // 실패창 살짝 늦게 (UX)
        setTimeout(()=>show(failOverlay), 220);
      }else{
        p.x=tx; p.y=ty;
        runtime.moves++;

        // ✅ 다음 움직임이 발생했으므로 힌트 하이라이트 해제
        runtime.hintActive = false;
        runtime.hintPenguinIndex = null;

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
      // 힌트 하이라이트는 움직임으로 해제
      runtime.hintActive = false;
      runtime.hintPenguinIndex = null;

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

function currentPositionsAsArray(){
  return runtime.penguins.map(p=>[p.x,p.y]);
}

/* ✅ Undo: 무한 */
function useUndo(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(runtime.history.length === 0){ toast("되돌릴 수 없어요"); return; }

  restoreSnapshot();
  draw();
}

/* ✅ Hint 정책 변경 */
function useHint(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;

  // ✅ 일일도전에서는 힌트 사용 불가 (팝업)
  if(runtime.mode === MODE.DAILY){
    openInfo("일일 도전", "일일 도전에서는 힌트를 사용할 수 없어요!");
    return;
  }

  if(player.hint <= 0){
    openInfo("힌트가 없어요", "힌트가 부족해요. (상점은 준비 중)");
    return;
  }

  // ✅ 먼저 솔버로 가능한지 확인 후, 가능할 때만 소모
  const res = solveBFS(runtime.puzzle, currentPositionsAsArray(), 90);
  if(!res.solvable || !res.path || res.path.length===0){
    toast("힌트를 만들 수 없어요");
    return; // 소모 X
  }

  // 소모
  player.hint--;
  savePlayer();
  updateHUD();

  // ✅ 다음 움직임 전까지 계속 빤짝(지속)
  runtime.hintPenguinIndex = res.path[0].penguin;
  runtime.hintActive = true;
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
    const level = runtime.dailyLevel ?? 1;
    const found = pack.levels.find(v=>v.level===level);
    loadPuzzleToRuntime({ mode: MODE.DAILY, dailyDate: pack.date, dailyLevel: level, puzzle: found.puzzle });
    toast("재시도!");
  }
}

/* Clear rewards */
function onClear(){
  if(runtime.mode === MODE.STAGE){
    // 스테이지 보상: 기존 “시간감소” 유지 (원래 정책)
    const REWARD_MAX = 100;
    const REWARD_DECAY_PER_SEC = 1;
    const elapsed = Math.floor((nowMs() - runtime.startTimeMs)/1000);
    const reward = clamp(REWARD_MAX - elapsed*REWARD_DECAY_PER_SEC, 0, REWARD_MAX);

    player.gold += reward;
    player.progressStage = Math.max(player.progressStage, (runtime.currentStage ?? 1) + 1);
    savePlayer();
    clearSession();

    clearDesc && (clearDesc.textContent =
      `스테이지 보상: ${reward} 코인\n(시간에 따라 감소)`
    );
    show(clearOverlay);
    return;
  }

  if(runtime.mode === MODE.DAILY){
    // ✅ 일일도전: 절대보상 + 젬 포함
    const level = runtime.dailyLevel ?? 1;
    const rw = dailyReward(level);
    player.gold += rw.gold;
    player.gem += rw.gem;

    markDailyCleared(level);
    savePlayer();
    clearSession();

    clearDesc && (clearDesc.textContent =
      `일일 도전 ${level}단계 보상\n${rw.gold} 코인 / ${rw.gem} 젬`
    );
    show(clearOverlay);
    return;
  }
}

/* Canvas sizing */
function resizeCanvasToDisplaySize(){
  if(!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const w = Math.max(2, Math.floor(rect.width * dpr));
  const h = Math.max(2, Math.floor(rect.height * dpr));
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w;
    canvas.height = h;
  }
}

/* Drawing helpers */
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

/* Draw */
let drawLooping = false;
function draw(){
  if(!ctx || !canvas) return;
  if(gameLayer?.style?.display === "none") return;
  resizeCanvasToDisplaySize();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!runtime.puzzle) return;

  // ✅ 보드가 더 크게/가운데 오게 패딩 축소
  const pad = Math.max(14, Math.min(canvas.width, canvas.height) * 0.045);
  const size = Math.min(canvas.width, canvas.height) - pad*2;
  const cell = size / runtime.W;
  const ox = (canvas.width - size)/2;
  const oy = (canvas.height - size)/2;

  ctx.save();
  roundRect(ctx, ox, oy, size, size, Math.max(16, cell*0.25));
  ctx.clip();

  const tile = ASSETS.board.ice.img;
  for(let y=0;y<runtime.W;y++){
    for(let x=0;x<runtime.W;x++){
      const tx = ox + x*cell;
      const ty = oy + y*cell;
      if(tile) drawImageCover(tile, tx, ty, cell, cell);
      else{
        ctx.fillStyle = "rgba(191,233,255,0.14)";
        ctx.fillRect(tx, ty, cell, cell);
      }
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = Math.max(1, cell*0.03);
  for(let i=0;i<=runtime.W;i++){
    const x = ox + i*cell;
    const y = oy + i*cell;
    ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+size,y); ctx.stroke();
  }

  const hx = ox + runtime.home.x*cell;
  const hy = oy + runtime.home.y*cell;
  if(!drawImageCover(ASSETS.piece.goal.img, hx, hy, cell, cell)){
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, hx+cell*0.12, hy+cell*0.12, cell*0.76, cell*0.76, cell*0.2);
    ctx.fill();
  }

  for(const b of runtime.blocks){
    const x = ox + b.x*cell;
    const y = oy + b.y*cell;
    if(!drawImageCover(ASSETS.piece.rock.img, x, y, cell, cell)){
      ctx.fillStyle = "rgba(10,13,16,0.85)";
      roundRect(ctx, x+cell*0.14, y+cell*0.14, cell*0.72, cell*0.72, cell*0.18);
      ctx.fill();
    }
  }

  // ✅ 힌트: 다음 액션 전까지 지속
  const t = nowMs();
  const pulse = runtime.hintActive ? (0.5 + 0.5*Math.sin(t/90)) : 0;

  for(let i=0;i<runtime.penguins.length;i++){
    const p = runtime.penguins[i];
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);

    const x = ox + rx*cell;
    const y = oy + ry*cell;

    if(runtime.hintActive && i===runtime.hintPenguinIndex){
      ctx.save();
      ctx.globalAlpha = 0.20 + 0.60*pulse;
      ctx.lineWidth = Math.max(3, cell*0.085);
      ctx.strokeStyle = "rgba(255,245,140,1)";
      roundRect(ctx, x+cell*0.06, y+cell*0.06, cell*0.88, cell*0.88, cell*0.22);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(x+cell/2, y+cell*0.82, cell*0.25, cell*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    const img = penguinImageByIndex(i);
    if(img){
      const scale = (i === 0) ? 0.98 : 0.94;
      const w = cell*scale;
      const h = cell*scale;
      ctx.drawImage(img, x+(cell-w)/2, y+(cell-h)/2 - cell*0.03, w, h);
    }else{
      ctx.fillStyle = (i===0) ? "rgba(255,255,255,0.92)" : "rgba(210,230,255,0.92)";
      roundRect(ctx, x+cell*0.22, y+cell*0.18, cell*0.56, cell*0.64, cell*0.2);
      ctx.fill();
    }
  }

  ctx.restore();

  // ✅ 힌트가 켜져 있으면 계속 애니메이션(펄스) 유지
  if(runtime.hintActive && !drawLooping){
    drawLooping = true;
    requestAnimationFrame(function loop(){
      if(!runtime.hintActive || runtime.mode === MODE.HOME || runtime.paused){
        drawLooping = false;
        return;
      }
      draw();
      requestAnimationFrame(loop);
    });
  }
}

/* Pointer */
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
  const pad = Math.max(14, Math.min(canvas.width, canvas.height) * 0.045);
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

if(canvas){
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); onDown(e); }, {passive:false});
  canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); onMove(e); }, {passive:false});
  canvas.addEventListener('touchend', (e)=>{ e.preventDefault(); onUp(e); }, {passive:false});
}

/* Loop */
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

/* UI flow: Splash / Home / Stage / Daily */
function hideAllOverlays(){
  hide(gearOverlay); hide(shopOverlay); hide(failOverlay); hide(clearOverlay);
  hide(dailySelectOverlay); hide(tutorialOverlay); hide(profileOverlay); hide(infoOverlay);
}

function enterHomeSafe(){
  enterHome();
}

function enterSplash(){
  runtime.mode = MODE.SPLASH;
  setBG("bg-splash");
  show(bgBlur);
  if(splashLogo) splashLogo.style.display = "block";
  if(splashHint) splashHint.classList.remove("show");

  // ✅ 스플래시에서는 홈/게임 UI가 보이면 안 됨
  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "none");
  topBar && (topBar.style.display = "none");

  hideAllOverlays();
  setPaused(false);
  updateHUD();
}

function enterHome(){
  runtime.mode = MODE.HOME;
  runtime.currentStage = null;
  runtime.dailyDate = null;
  runtime.dailyLevel = null;
  runtime.puzzle = null;

  setBG("bg-home");
  hide(bgBlur);
  if(splashLogo) splashLogo.style.display = "none";
  if(splashHint) splashHint.classList.remove("show");

  homeLayer && (homeLayer.style.display = "block");
  gameLayer && (gameLayer.style.display = "none");

  // ✅ 홈에서도 코인/젬 보여야 함
  topBar && (topBar.style.display = "flex");

  hideAllOverlays();
  setPaused(false);

  updateHUD();
  startLoop();

  // ✅ 첫 진입 튜토리얼
  if(!player.tutorialDone){
    player.tutorialDone = true;
    savePlayer();
    show(tutorialOverlay);
    setPaused(true);
  }
}

async function enterStageMode(stage){
  runtime.mode = MODE.STAGE;
  setPaused(false);
  hideAllOverlays();

  setBG("bg-sea");
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  // ✅ 준비중 UX: 조금 더 오래
  show(loadingOverlay);
  await sleep(650);

  const puzzle = getOrCreateStagePuzzle(stage);
  loadPuzzleToRuntime({ mode: MODE.STAGE, stage, puzzle });

  await sleep(220);
  hide(loadingOverlay);
  draw();
}

async function enterDailyMode(level){
  runtime.mode = MODE.DAILY;
  setPaused(false);
  hideAllOverlays();

  const pack = getOrCreateDailyPack();
  const found = pack.levels.find(v=>v.level===level);
  if(!found){ toast("일일도전 데이터 오류"); return; }

  setBG("bg-sea");
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  show(loadingOverlay);
  await sleep(650);

  loadPuzzleToRuntime({
    mode: MODE.DAILY,
    dailyDate: pack.date,
    dailyLevel: level,
    puzzle: found.puzzle
  });

  await sleep(220);
  hide(loadingOverlay);
  draw();
}

/* Daily Select overlay */
function openDailySelect(){
  const pack = getOrCreateDailyPack();
  const c1 = !!pack.cleared[1];
  const c2 = !!pack.cleared[2];
  const c3 = !!pack.cleared[3];

  dailySelectDesc && (dailySelectDesc.textContent = `${pack.date} · 1~3단계`);
  // ✅ 잠금 UX: 1은 항상 가능, 2는 1 클리어 필요, 3은 2 클리어 필요
  if(btnDaily1){ btnDaily1.classList.remove("disabledBtn"); btnDaily1.textContent = `1단계`; }
  if(btnDaily2){
    btnDaily2.textContent = `2단계`;
    btnDaily2.classList.toggle("disabledBtn", !c1);
  }
  if(btnDaily3){
    btnDaily3.textContent = `3단계`;
    btnDaily3.classList.toggle("disabledBtn", !c2);
  }
  show(dailySelectOverlay);
}

/* Buttons */
btnNavHome && (btnNavHome.onclick = ()=>enterHome());

btnStage && (btnStage.onclick = ()=>enterStageMode(player.progressStage));

btnDaily && (btnDaily.onclick = ()=>openDailySelect());

btnDaily1 && (btnDaily1.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(1); });
btnDaily2 && (btnDaily2.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(2); });
btnDaily3 && (btnDaily3.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(3); });
btnCloseDailySelect && (btnCloseDailySelect.onclick = ()=>hide(dailySelectOverlay));

btnNavShop && (btnNavShop.onclick = ()=>{
  // ✅ 상점에서도 돈/젬 확인 가능: topBar 유지
  show(shopOverlay);
});
btnCloseShop && (btnCloseShop.onclick = ()=>hide(shopOverlay));

btnNavEvent && (btnNavEvent.onclick = ()=>toast("이벤트는 준비 중!"));

btnSetting && (btnSetting.onclick = ()=>{
  if(gearDesc){
    gearDesc.textContent =
      runtime.mode === MODE.DAILY
        ? `일일 도전 ${runtime.dailyLevel}/3`
        : (runtime.mode === MODE.STAGE ? `스테이지 LEVEL ${runtime.currentStage ?? player.progressStage}` : `홈`);
  }
  show(gearOverlay);
  setPaused(true);
});

btnCloseGear && (btnCloseGear.onclick = ()=>{ hide(gearOverlay); setPaused(false); });

btnGoHome && (btnGoHome.onclick = ()=>{
  hide(gearOverlay);
  clearSession();
  enterHome();
});

btnRestart && (btnRestart.onclick = ()=>{
  hide(gearOverlay);
  setPaused(false);
  restartCurrent();
});

btnUndo && (btnUndo.onclick = ()=>useUndo());
btnHint && (btnHint.onclick = ()=>useHint());
btnRetry && (btnRetry.onclick = ()=>restartCurrent());

btnFailHome && (btnFailHome.onclick = ()=>{ hide(failOverlay); clearSession(); enterHome(); });
btnFailRetry && (btnFailRetry.onclick = ()=>{ hide(failOverlay); restartCurrent(); });

btnClearHome && (btnClearHome.onclick = ()=>{ hide(clearOverlay); enterHome(); });
btnClearNext && (btnClearNext.onclick = ()=>{
  hide(clearOverlay);
  if(runtime.mode === MODE.STAGE){
    enterStageMode(player.progressStage);
  }else{
    // ✅ 일일도전: 다음 단계는 “클리어해야 열림”이라 선택창으로
    enterHome();
    openDailySelect();
  }
});

/* Settings toggles */
btnSound && (btnSound.onclick = async ()=>{
  player.soundOn = !player.soundOn;
  savePlayer();
  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;
  try{
    if(player.soundOn) await bgm?.play?.();
    else bgm?.pause?.();
  }catch{}
});
btnVibe && (btnVibe.onclick = ()=>{
  player.vibeOn = !player.vibeOn;
  savePlayer();
  btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`;
  toast(player.vibeOn ? "진동 ON" : "진동 OFF");
  vibrate(25);
});
btnLang && (btnLang.onclick = ()=>{
  const order = ["ko","en","ja"];
  const i = order.indexOf(player.lang);
  player.lang = order[(i+1) % order.length];
  savePlayer();
  const label = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
  btnLang.textContent = `언어: ${label}`;
  toast(`언어 변경: ${label}`);
});

/* Tutorial */
btnTutorial && (btnTutorial.onclick = ()=>{
  show(tutorialOverlay);
  setPaused(true);
});
btnTutorialClose && (btnTutorialClose.onclick = ()=>{
  hide(tutorialOverlay);
  setPaused(false);
});

/* Profile / Save */
btnProfile && (btnProfile.onclick = ()=>{
  const uid = getUserId();
  if(profileDesc){
    profileDesc.textContent =
      `현재 저장 프로필: ${uid}\n` +
      `- 같은 기기/브라우저에서 진행사항이 저장됩니다.\n` +
      `- ID를 바꾸면 별도의 저장 슬롯처럼 동작해요.`;
  }
  show(profileOverlay);
  setPaused(true);
});
btnCloseProfile && (btnCloseProfile.onclick = ()=>{
  hide(profileOverlay);
  setPaused(false);
});
btnUseGuest && (btnUseGuest.onclick = ()=>{
  setUserId(ROOT.guest);
  openInfo("게스트", "게스트 프로필로 전환했어요.\n(페이지를 새로고침하면 적용이 확실해요)");
});
btnSetUserId && (btnSetUserId.onclick = ()=>{
  const cur = getUserId();
  const v = prompt("저장용 ID를 입력하세요 (영문/숫자 추천)\n비워두면 게스트로 동작", cur === ROOT.guest ? "" : cur);
  if(v == null) return;
  const cleaned = v.trim();
  setUserId(cleaned ? cleaned : ROOT.guest);
  openInfo("프로필 변경", `프로필을 ${cleaned ? cleaned : ROOT.guest} 로 설정했어요.\n(페이지를 새로고침하면 적용이 확실해요)`);
});

/* Splash tap-to-start */
function enableTapToStart(){
  if(splashHint) splashHint.classList.add("show");

  const onTap = ()=>{
    window.removeEventListener('pointerdown', onTap);
    window.removeEventListener('touchstart', onTap);
    enterHome();
  };
  window.addEventListener('pointerdown', onTap, { once:true });
  window.addEventListener('touchstart', onTap, { once:true, passive:true });
}

/* Boot */
async function boot(){
  enterSplash();

  // ✅ 로딩은 스피너만 표시 (텍스트 없음)
  show(loadingOverlay);

  // 하드 타임아웃 (절대 멈추지 않게)
  const HARD_TIMEOUT = 9000;
  const hardTimer = setTimeout(()=>{
    console.warn('[Hard Timeout] preload took too long');
    hide(loadingOverlay);
    enableTapToStart();
  }, HARD_TIMEOUT);

  try{
    await preloadAssets();
  }finally{
    clearTimeout(hardTimer);
    hide(loadingOverlay);
  }

  // bgm
  btnSound && (btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`);
  btnVibe && (btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`);
  if(btnLang){
    const langLabel = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
    btnLang.textContent = `언어: ${langLabel}`;
  }
  try{ if(player.soundOn) await bgm?.play?.(); }catch{}

  // ✅ 세션 복원: 있으면 자동 복원 (저장 문제 개선)
  const session = loadSession();
  if(session && session.puzzle && session.mode){
    // 바로 복원하지 않고, 스플래시 tap 후에 들어가게 하고 싶으면 여기서 enableTapToStart만 호출하면 됨.
    // 너 요구사항이 "tap to start 후 홈으로"라서: 세션이 있어도 홈으로 들어간 뒤 "계속하기" UX가 필요하지만,
    // 지금은 빠르게: tap to start -> 바로 세션으로 복원.
    enableTapToStart();
    // tap 이후 처리:
    const restoreAfterTap = ()=>{
      if(session.mode === MODE.STAGE){
        enterStageMode(session.stage ?? player.progressStage).then(()=>{
          loadPuzzleToRuntime({
            mode: MODE.STAGE,
            stage: session.stage ?? player.progressStage,
            puzzle: session.puzzle,
            restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
          });
          draw(); startLoop();
        });
      }else if(session.mode === MODE.DAILY){
        const pack = getOrCreateDailyPack();
        if(session.dailyDate !== pack.date){
          clearSession();
          enterHome();
          return;
        }
        enterDailyMode(session.dailyLevel ?? 1).then(()=>{
          loadPuzzleToRuntime({
            mode: MODE.DAILY,
            dailyDate: pack.date,
            dailyLevel: session.dailyLevel ?? 1,
            puzzle: session.puzzle,
            restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
          });
          draw(); startLoop();
        });
      }
      window.removeEventListener('pe_after_tap', restoreAfterTap);
    };
    window.addEventListener('pe_after_tap', restoreAfterTap);

    // tap-to-start가 홈으로 보내는 enterHome() 전에 이벤트만 찍어두자
    const origEnterHome = enterHome;
    enterHome = function(){
      origEnterHome();
      window.dispatchEvent(new Event('pe_after_tap'));
    };
    return;
  }

  // 세션 없으면: tap-to-start 후 홈으로
  enableTapToStart();
}
boot();
