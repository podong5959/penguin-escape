// PENGUIN ESCAPE v5.2 (Full exchange)
// Fixes requested:
// 1) Home layout: big buttons lower + text centered + nav lower + hide center HOME pill
// 2) Game: board truly centered + bottom icons fill + start from level1 logic + clear popup delay + hide time-decay text
// 3) Cross-device save + leaderboard: Supabase anonymous auth + Postgres sync
// 4) Shop: hint sold again + show gold/gem in shop overlay
// 5) Splash: use home bg with strong blur (~70% 느낌)

// ---- viewport ----
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => setTimeout(setVH, 50));
setVH();
window.addEventListener('resize', ()=>updateTutorialFocusMask?.());
window.visualViewport?.addEventListener('resize', ()=>updateTutorialFocusMask?.());
window.visualViewport?.addEventListener('scroll', ()=>updateTutorialFocusMask?.());

function $(id){
  const el = document.getElementById(id);
  if(!el) console.warn(`[Missing DOM] #${id}`);
  return el;
}

// ---- global button haptics ----
document.addEventListener('pointerdown', (e)=>{
  const btn = e.target?.closest?.('button');
  if(!btn) return;
  vibrate(10);
}, { capture: true, passive: true });

// ---- DOM ----
const bg = $('bg');
const bgBlur = $('bgBlur');
const splashLogo = $('splashLogo');
const splashHint = $('splashHint');

const homeLayer = $('homeLayer');
const gameLayer = $('gameLayer');

const topBar = $('topBar');
const goldText = $('goldText');
const gemText = $('gemText');
const stagePill = $('stagePill');
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
const bottomBar = $('bottomBar');

const toastWrap = $('toast');
const toastText = $('toastText');

const tutorialCoach = $('tutorialCoach');
const tutorialCoachTitle = $('tutorialCoachTitle');
const tutorialCoachDesc = $('tutorialCoachDesc');
const btnTutorialSkip = $('btnTutorialSkip');
const btnTutorialAction = $('btnTutorialAction');
const tutorialFocus = $('tutorialFocus');

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
const shopGoldText = $('shopGoldText');
const shopGemText = $('shopGemText');
const btnBuyHint1 = $('btnBuyHint1');
const btnBuyHint5 = $('btnBuyHint5');

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

const leaderboardOverlay = $('leaderboardOverlay');
const leaderboardMeta = $('leaderboardMeta');
const leaderboardTopList = $('leaderboardTopList');
const leaderboardAroundList = $('leaderboardAroundList');
const btnLeaderboardStage = $('btnLeaderboardStage');
const btnLeaderboardDaily = $('btnLeaderboardDaily');
const btnCloseLeaderboard = $('btnCloseLeaderboard');

const bgm = $('bgm');

// ---- utils ----
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

// ✅ 일일도전 날짜: "유저 기기 로컬" 기준 (YYYY-MM-DD)
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

// ---- safety ----
window.addEventListener('error', (e)=>{
  console.error('[Global Error]', e?.error || e?.message || e);
  toast('에러 발생: 콘솔 확인');
  try{ hide(loadingOverlay); enterHomeSafe(); }catch{}
});
window.addEventListener('unhandledrejection', (e)=>{
  console.error('[Unhandled Promise]', e?.reason || e);
  toast('에러 발생: 콘솔 확인');
  try{ hide(loadingOverlay); enterHomeSafe(); }catch{}
});

// ---- Save namespace ----
const CACHE_VERSION = 52;
const ASSET_VERSION = "20260210_05";
const ROOT = { userId: "pe_user_id", guest: "guest" };
const OAUTH_MERGE_PENDING_KEY = "pe_oauth_merge_pending";

function getUserId(){
  try{
    const v = localStorage.getItem(ROOT.userId);
    return (v && v.trim()) ? v.trim() : ROOT.guest;
  }catch{ return ROOT.guest; }
}
function setUserId(v){
  try{ localStorage.setItem(ROOT.userId, v); }catch{}
}
function nsKey(k){
  const uid = getUserId();
  return `pe_${uid}__${k}`;
}

function markOAuthMergePending(){
  try{ localStorage.setItem(OAUTH_MERGE_PENDING_KEY, "1"); }catch{}
}
function isOAuthMergePending(){
  try{ return localStorage.getItem(OAUTH_MERGE_PENDING_KEY) === "1"; }catch{ return false; }
}
function clearOAuthMergePending(){
  try{ localStorage.removeItem(OAUTH_MERGE_PENDING_KEY); }catch{}
}

const SAVE = {
  v: "v",
  gold: "gold",
  gem: "gem",
  progressStage: "progress_stage",
  hint: "hint",
  ingameHintGoldBuys: "ingame_hint_gold_buys",
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

// ✅ 이번 버전부터: 새 설치/신규 유저는 무조건 1부터.
// (기존 유저 진행은 유지하되, v가 바뀌면 퍼즐 캐시만 갱신)
function resetIfNeeded(){
  const v = loadInt(SAVE.v, 0);
  if(v === CACHE_VERSION) return;

  // puzzle cache reset
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

// ---- Player ----
const player = {
  gold: loadInt(SAVE.gold, 0),
  gem: loadInt(SAVE.gem, 0),
  // ✅ 최소 1 보장
  progressStage: Math.max(1, loadInt(SAVE.progressStage, 1)),
  hint: loadInt(SAVE.hint, 3),
  ingameHintGoldBuys: loadInt(SAVE.ingameHintGoldBuys, 0),

  tutorialDone: loadInt(SAVE.tutorialDone, 0) === 1,
  soundOn: loadInt(SAVE.sound, 1) === 1,
  vibeOn: loadInt(SAVE.vibe, 1) === 1,
  lang: (()=>{ try{ return localStorage.getItem(nsKey(SAVE.lang)) || "ko"; }catch{ return "ko"; }})(),
};

function savePlayerLocal(){
  saveInt(SAVE.gold, player.gold);
  saveInt(SAVE.gem, player.gem);
  saveInt(SAVE.progressStage, player.progressStage);
  saveInt(SAVE.hint, player.hint);
  saveInt(SAVE.ingameHintGoldBuys, player.ingameHintGoldBuys);
  saveInt(SAVE.tutorialDone, player.tutorialDone ? 1 : 0);
  saveInt(SAVE.sound, player.soundOn ? 1 : 0);
  saveInt(SAVE.vibe, player.vibeOn ? 1 : 0);
  try{ localStorage.setItem(nsKey(SAVE.lang), player.lang); }catch{}
}

// ---- Supabase Sync ----
const Cloud = {
  enabled: false,
  pushTimer: null,
  ready: false,
  user: null,
  authUnsub: null,
  pulling: false,
};

function cloudAdapter(){
  return window.PE_SUPABASE || null;
}

async function cloudInitIfPossible(){
  const adapter = cloudAdapter();
  if(!adapter?.hasConfig?.()) return;
  try{
    const auth = await adapter.ensureAuth({ allowAnonymous: true });
    if(auth?.error || !auth?.user){
      console.warn('[Cloud] auth init failed', auth?.error || 'unknown');
      return;
    }
    Cloud.enabled = true;
    Cloud.ready = true;
    Cloud.user = auth.user;
    if(auth.user?.id) setUserId(auth.user.id);
  }catch(e){
    console.warn('[Cloud] init failed', e);
  }
}

function cloudBindAuthListener(){
  const adapter = cloudAdapter();
  if(!adapter?.onAuthStateChange) return;
  try{ Cloud.authUnsub?.(); }catch{}
  Cloud.authUnsub = adapter.onAuthStateChange(async (user)=>{
    Cloud.user = user || null;
    Cloud.enabled = !!user;
    Cloud.ready = true;
    if(user?.id){
      setUserId(user.id);
      await cloudMaybeMergeLocalAfterOAuth();
      await cloudPull();
      updateHUD();
    }
  });
}

async function cloudMaybeMergeLocalAfterOAuth(){
  if(!isOAuthMergePending()) return false;
  if(!Cloud.enabled || !Cloud.ready) return false;
  const adapter = cloudAdapter();
  if(!adapter) return false;
  try{
    const remote = await adapter.loadProgress();
    if(remote?.error || !remote?.progress) return false;
    const p = remote.progress;
    const remoteIsFresh =
      (Number(p.highestStage) || 1) <= 1 &&
      (Number(p.gold) || 0) <= 0 &&
      (Number(p.gem) || 0) <= 0 &&
      (Number(p.hint) || 0) <= 0;
    if(remoteIsFresh){
      await adapter.saveProgress({
        highestStage: player.progressStage,
        gold: player.gold,
        gem: player.gem,
        hint: player.hint,
      });
    }
    clearOAuthMergePending();
    return true;
  }catch(e){
    console.warn('[Cloud] oauth merge failed', e);
    return false;
  }
}

async function cloudPull(){
  if(!Cloud.enabled || !Cloud.ready) return false;
  if(Cloud.pulling) return false;
  const adapter = cloudAdapter();
  if(!adapter) return false;
  Cloud.pulling = true;
  try{
    const prevStage = player.progressStage;
    const pulled = await adapter.loadProgress();
    if(pulled?.error || !pulled?.progress) return false;
    const p = pulled.progress;
    if(Number.isFinite(p.gold)) player.gold = p.gold;
    if(Number.isFinite(p.gem)) player.gem = p.gem;
    if(Number.isFinite(p.highestStage)) player.progressStage = Math.max(1, p.highestStage);
    if(Number.isFinite(p.hint)) player.hint = p.hint;
    if(pulled.user?.id){
      Cloud.user = pulled.user;
      setUserId(pulled.user.id);
    }
    savePlayerLocal();
    updateHUD();
    const advanced = player.progressStage > prevStage;
    if(advanced && runtime.mode === MODE.STAGE && (runtime.currentStage ?? 1) < player.progressStage){
      // On stale stage sessions, reflect the newer cloud progress immediately.
      if((runtime.moves || 0) === 0 && !runtime.busy){
        clearSession();
        enterHome();
        toast(`다른 기기 진행 반영: LEVEL ${player.progressStage}`);
      }else{
        toast(`다른 기기 진행 반영됨 (현재 LEVEL ${player.progressStage})`);
      }
    }
    return true;
  }catch(e){
    console.warn('[Cloud] pull failed', e);
    return false;
  }finally{
    Cloud.pulling = false;
  }
}

function cloudPushDebounced(){
  if(!Cloud.enabled || !Cloud.ready) return;
  const adapter = cloudAdapter();
  if(!adapter) return;

  clearTimeout(Cloud.pushTimer);
  Cloud.pushTimer = setTimeout(async ()=>{
    try{
      await adapter.saveProgress({
        highestStage: player.progressStage,
        gold: player.gold,
        gem: player.gem,
        hint: player.hint,
      });
    }catch(e){
      console.warn('[Cloud] push failed', e);
    }
  }, 600);
}

async function cloudSubmitStageClear(stageNumber){
  if(!Cloud.enabled || !Cloud.ready) return false;
  const adapter = cloudAdapter();
  if(!adapter) return false;
  try{
    const res = await adapter.submitStageClear(stageNumber);
    return !!res?.ok;
  }catch(e){
    console.warn('[Cloud] submit stage clear failed', e);
    return false;
  }
}

async function cloudLoadDailyStatus(dateKey){
  if(!Cloud.enabled || !Cloud.ready) return null;
  const adapter = cloudAdapter();
  if(!adapter) return null;
  try{
    return await adapter.loadDailyStatus(dateKey);
  }catch(e){
    console.warn('[Cloud] load daily status failed', e);
    return null;
  }
}

async function cloudSubmitDailyClear(dateKey, level){
  if(!Cloud.enabled || !Cloud.ready) return false;
  const adapter = cloudAdapter();
  if(!adapter) return false;
  try{
    const res = await adapter.submitDailyClear(dateKey, level);
    return !!res?.ok;
  }catch(e){
    console.warn('[Cloud] submit daily clear failed', e);
    return false;
  }
}

async function syncDailyPackFromCloud(pack){
  if(!pack || !pack.date) return pack;
  const remote = await cloudLoadDailyStatus(pack.date);
  if(!remote || remote.error || !remote.rows) return pack;

  for(const row of remote.rows){
    if(row?.level >= 1 && row?.level <= 3 && (row.clearCount || 0) > 0){
      pack.cleared[row.level] = true;
    }
  }
  saveJSON(SAVE.daily, pack);
  return pack;
}

// ---- Modes ----
const MODE = { SPLASH:"splash", HOME:"home", STAGE:"stage", DAILY:"daily", TUTORIAL:"tutorial" };

const runtime = {
  mode: MODE.SPLASH,
  currentStage: null,
  dailyDate: null,
  dailyLevel: null,
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
  hintActive: false,
  paused:false,
};

const DIRS = [{x: 1, y: 0}, {x:-1, y: 0}, {x: 0, y: 1}, {x: 0, y:-1}];

function vibrate(pattern=20){
  if(!player.vibeOn) return;
  try{ navigator.vibrate?.(pattern); }catch{}
}

// ---- SFX ----
const SFX = { ctx: null };
function playBoop(){
  if(!player.soundOn) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  try{
    if(!SFX.ctx) SFX.ctx = new Ctx();
    const ctx = SFX.ctx;
    ctx.resume?.();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }catch{}
}

function playClearSfx(){
  if(!player.soundOn) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  try{
    if(!SFX.ctx) SFX.ctx = new Ctx();
    const ctx = SFX.ctx;
    ctx.resume?.();
    const base = ctx.currentTime;
    const seq = [
      { f: 430, t: 0.00, d: 0.08 },
      { f: 560, t: 0.08, d: 0.08 },
      { f: 700, t: 0.16, d: 0.08 },
      { f: 260, t: 0.28, d: 0.14 },
    ];
    for(const n of seq){
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.f, base + n.t);
      gain.gain.setValueAtTime(0.0001, base + n.t);
      gain.gain.exponentialRampToValueAtTime(0.35, base + n.t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, base + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(base + n.t);
      osc.stop(base + n.t + n.d);
    }
  }catch{}
}

// ---- Tutorial (interactive) ----
const TUTORIAL_PUZZLE = {
  W: 5,
  blocks: [],
  penguins: [
    [0,2], // main
    [0,4], // slide demo
    [4,4],
    [4,0],
  ],
};

const TUTORIAL = {
  active: false,
  step: 0,
  blockedToastAt: 0,
  allowClear: false,
  steps: [
    {
      id: "slide",
      title: "미끄러짐",
      desc: "아래 펭귄을 오른쪽으로 밀어보세요.\n끝까지 미끄러집니다.",
      type: "move",
      penguin: 1,
      dir: {x:1,y:0},
    },
    {
      id: "pass_goal",
      title: "골을 스치면 안 돼요",
      desc: "주인공(0번)을 오른쪽으로 밀어보세요.\n목표를 지나가면 클리어되지 않습니다.",
      type: "move",
      penguin: 0,
      dir: {x:1,y:0},
      requirePassGoal: true,
      onStart: ()=>{
        // 오른쪽 끝에 벽을 두어 탈락 방지 (목표를 지나가도록만 유도)
        tutorialAddBlock(4,2);
        draw();
      },
    },
    {
      id: "undo",
      title: "되돌리기",
      desc: "실수했다면 UNDO로 되돌려요.\n지금 UNDO를 눌러보세요.",
      type: "undo",
    },
    {
      id: "clear_after_undo",
      title: "클리어 체험",
      desc: "이제 목표에 정확히 멈춰 클리어해보세요.\n주인공을 오른쪽으로 밀면 됩니다.",
      type: "clear",
      allowAnyMove: true,
      onStart: ()=>{
        tutorialAddBlock(3,2);
        draw();
      },
    },
    {
      id: "clear_confirm",
      title: "클리어 안내",
      desc: "잘했어요! 이제 다음 기능을 배워볼게요.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "다음",
    },
    {
      id: "retry",
      title: "막히면 다시하기",
      desc: "움직일 수 없을 땐 RETRY로 초기화해요.\nRETRY를 눌러보세요.",
      type: "retry",
    },
    {
      id: "hint",
      title: "힌트 체험",
      desc: "HINT를 눌러 다음 움직임을 확인해보세요.",
      type: "hint",
      onStart: ()=>{
        tutorialAddBlock(3,2);
        draw();
      }
    },
    {
      id: "clear_final",
      title: "마지막 클리어",
      desc: "힌트를 따라 움직여 클리어해보세요.",
      type: "clear",
      allowAnyMove: true,
    },
    {
      id: "done",
      title: "완료!",
      desc: "튜토리얼을 끝냈어요.\n이제 스테이지로 진행해요.",
      type: "finish",
    }
  ],
};

function tutorialCurrentStep(){
  return TUTORIAL.steps[TUTORIAL.step] || null;
}
function tutorialShowCoach(showIt){
  if(!tutorialCoach) return;
  tutorialCoach.classList.toggle("show", !!showIt);
}
function tutorialPulse(el, on){
  if(!el) return;
  el.classList.toggle("pulse", !!on);
}
let tutorialFocusedEl = null;
function updateTutorialFocusMask(){
  if(!tutorialFocus || !tutorialFocusedEl) return;
  const rect = tutorialFocusedEl.getBoundingClientRect();
  const vv = window.visualViewport;
  const offsetLeft = vv?.offsetLeft || 0;
  const offsetTop = vv?.offsetTop || 0;
  const cx = rect.left + rect.width/2 - offsetLeft;
  const cy = rect.top + rect.height/2 - offsetTop;
  const r = Math.max(rect.width, rect.height) * 0.65;
  tutorialFocus.style.setProperty('--focus-x', `${cx}px`);
  tutorialFocus.style.setProperty('--focus-y', `${cy}px`);
  tutorialFocus.style.setProperty('--focus-r', `${r}px`);
}
function tutorialFocusOn(el){
  if(tutorialFocusedEl) tutorialFocusedEl.classList.remove("tutorialFocusTarget");
  tutorialFocusedEl = el || null;
  if(tutorialFocusedEl) tutorialFocusedEl.classList.add("tutorialFocusTarget");
  if(tutorialFocus) tutorialFocus.classList.toggle("show", !!tutorialFocusedEl);
  if(bottomBar) bottomBar.classList.toggle("tutorialFocusRaise", !!tutorialFocusedEl);
  updateTutorialFocusMask();
  if(tutorialFocusedEl){
    requestAnimationFrame(()=>updateTutorialFocusMask());
    requestAnimationFrame(()=>updateTutorialFocusMask());
  }
}
function tutorialUpdateCoach(){
  const step = tutorialCurrentStep();
  if(!step) return;
  if(tutorialCoachTitle) tutorialCoachTitle.textContent = step.title || "튜토리얼";
  if(tutorialCoachDesc) tutorialCoachDesc.textContent = step.desc || "";
  if(btnTutorialAction){
    const showAction = step.type === "finish" || step.requiresAction;
    btnTutorialAction.style.display = showAction ? "block" : "none";
    if(showAction){
      btnTutorialAction.textContent = step.actionLabel || (step.type === "finish" ? "홈으로" : "다음");
    }
  }
  tutorialPulse(btnUndo, step.type === "undo");
  tutorialPulse(btnRetry, step.type === "retry");
  tutorialPulse(btnHint, step.type === "hint");
  tutorialShowCoach(true);
  if(step.type === "undo") tutorialFocusOn(btnUndo);
  else if(step.type === "retry") tutorialFocusOn(btnRetry);
  else if(step.type === "hint") tutorialFocusOn(btnHint);
  else tutorialFocusOn(null);
}
function tutorialAddBlock(x,y){
  if(!runtime.blocks.find(b=>b.x===x && b.y===y)){
    runtime.blocks.push({x,y});
  }
  if(runtime.puzzle && Array.isArray(runtime.puzzle.blocks)){
    const exists = runtime.puzzle.blocks.some(b=>b[0]===x && b[1]===y);
    if(!exists) runtime.puzzle.blocks.push([x,y]);
  }
}
function tutorialSetStep(i){
  TUTORIAL.step = clamp(i, 0, TUTORIAL.steps.length-1);
  const step = tutorialCurrentStep();
  TUTORIAL.allowClear = step?.type === "clear";
  step?.onStart?.();
  tutorialUpdateCoach();
  draw();
}
function tutorialNext(){
  if(TUTORIAL.step >= TUTORIAL.steps.length-1) return;
  tutorialSetStep(TUTORIAL.step + 1);
}
function tutorialFinish(){
  TUTORIAL.active = false;
  TUTORIAL.allowClear = false;
  tutorialShowCoach(false);
  tutorialFocusOn(null);
  tutorialPulse(btnUndo, false);
  tutorialPulse(btnRetry, false);
  tutorialPulse(btnHint, false);
  player.tutorialDone = true;
  savePlayerLocal();
  cloudPushDebounced();
  clearSession();
  enterHome();
  toast("튜토리얼 완료!");
}
function tutorialSkip(){
  tutorialFinish();
}
function tutorialStart(){
  TUTORIAL.active = true;
  TUTORIAL.step = 0;
  TUTORIAL.blockedToastAt = 0;
  TUTORIAL.allowClear = false;
  tutorialFocusOn(null);
  hideAllOverlays();
  setPaused(false);
  enterTutorial();
}
function tutorialAllowMove(index, dir){
  const step = tutorialCurrentStep();
  if(!step) return false;
  if(step.type === "clear" && step.allowAnyMove) return true;
  if(step.type !== "move") return false;
  if(index !== step.penguin) return false;
  if(!dir || dir.x !== step.dir.x || dir.y !== step.dir.y) return false;
  return true;
}
function tutorialBlocked(){
  const t = nowMs();
  if(t - TUTORIAL.blockedToastAt > 700){
    TUTORIAL.blockedToastAt = t;
    toast("지금은 안내대로 해주세요");
  }
}
function tutorialPassedGoal(from, to, goal){
  if(from.x === to.x && from.x === goal.x){
    return (from.y < goal.y && goal.y < to.y) || (from.y > goal.y && goal.y > to.y);
  }
  if(from.y === to.y && from.y === goal.y){
    return (from.x < goal.x && goal.x < to.x) || (from.x > goal.x && goal.x > to.x);
  }
  return false;
}
function tutorialOnMoveEnd(index, from, to, fellOff){
  if(!TUTORIAL.active) return;
  const step = tutorialCurrentStep();
  if(!step) return;
  if(fellOff) return;

  if(step.type === "move"){
    if(index !== step.penguin) return;
    if(step.requirePassGoal){
      if(tutorialPassedGoal(from, to, runtime.home)){
        toast("목표를 스치면 클리어되지 않아요");
        tutorialNext();
      }
      return;
    }
    if(step.requireStopOnGoal){
      if(to.x === runtime.home.x && to.y === runtime.home.y){
        playClearSfx();
        tutorialNext();
      }
      return;
    }
    tutorialNext();
  }
}

// ---- Difficulty ----
function stageSpec(stage){
  if(stage <= 10) return { W:5, min:2, max:3 };
  if(stage <= 100) return { W:5, min:4, max:6 };
  if(stage <= 200) return { W:5, min:7, max:10 };
  if(stage <= 300) return { W:5, min:10, max:12 };
  return { W:7, min:8, max:12 };
}
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

// ---- Assets ----
const ASSETS = {
  board: {
    ice: { img:null, src:"./asset/images/board/ice_tile.png" },
    full: { img:null, src:"./asset/images/board/board_full.png" },
    shadow: { img:null, src:"./asset/images/board/board_shadow.png" },
    side: { img:null, src:"./asset/images/board/board_side.png" },
    inner: { img:null, src:"./asset/images/board/board_inner.png" },
    frameTop: { img:null, src:"./asset/images/board/board_frame_top.png" },
  },
  piece: {
    goal: { img:null, src:"./asset/images/piece/goal.png" },
    rock: { img:null, src:"./asset/images/piece/rock.png" },
    peng0: { img:null, src:"./asset/images/piece/penguin_0.png" },
    peng1: { img:null, src:"./asset/images/piece/penguin_1.png" },
    peng2: { img:null, src:"./asset/images/piece/penguin_2.png" },
    peng3: { img:null, src:"./asset/images/piece/penguin_3.png" },
  },
  penguin: {
    base01: { img:null, src:"./asset/images/penguin/penguin_sheet_01.png" },
    base02: { img:null, src:"./asset/images/penguin/penguin_sheet_02.png" },
    base03: { img:null, src:"./asset/images/penguin/penguin_sheet_03.png" },
    base04: { img:null, src:"./asset/images/penguin/penguin_sheet_04.png" },
    hero01: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_01.png" },
    hero02: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_02.png" },
    hero03: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_03.png" },
    hero04: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_04.png" },
    // Support user's typed naming too.
    heroTypo01: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_01.png" },
    heroTypo02: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_02.png" },
    heroTypo03: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_03.png" },
    heroTypo04: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_04.png" },
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
    img.src = `${src}?v=${ASSET_VERSION}`;
  });
}

async function preloadAssets(){
  show(loadingOverlay);
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

// ---- HUD ----
function setBG(cls){
  if(!bg) return;
  bg.className = "";
  bg.classList.add(cls);
}
function setStagePill(text){
  if(stagePillText) stagePillText.textContent = text;
}
function clampStageLabel(){
  if(stageLabel) stageLabel.textContent = `LEVEL ${player.progressStage}`;
}
function updateShopMoney(){
  if(shopGoldText) shopGoldText.textContent = formatCount(player.gold);
  if(shopGemText) shopGemText.textContent = formatCount(player.gem);
}
function updateHUD(){
  goldText && (goldText.textContent = formatCount(player.gold));
  gemText && (gemText.textContent = formatCount(player.gem));
  hintCnt && (hintCnt.textContent = String(player.hint));
  undoCnt && (undoCnt.textContent = "∞");
  clampStageLabel();
  updateShopMoney();

  if(runtime.mode === MODE.HOME){
    // ✅ 홈에서는 가운데 pill 자체가 안 보여야 함
    if(stagePill) stagePill.style.display = "none";
  }else{
    if(stagePill) stagePill.style.display = "flex";
    if(runtime.mode === MODE.STAGE){
      setStagePill(`LEVEL ${runtime.currentStage ?? 1}`);
    }else if(runtime.mode === MODE.DAILY){
      setStagePill(`일일 도전 ${runtime.dailyLevel}/3`);
    }else if(runtime.mode === MODE.TUTORIAL){
      setStagePill("튜토리얼");
    }else{
      setStagePill("");
    }
  }
}

// ---- Pause & privacy ----
function setPaused(paused){
  runtime.paused = paused;
  if(paused) privacyCover?.classList?.add('show');
  else privacyCover?.classList?.remove('show');
}
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) setPaused(true);
  else{
    setPaused(false);
    refreshDailyIfNeeded(); // ✅ 로컬 날짜 바뀌었으면 daily 갱신
    (async ()=>{
      await cloudPull();
    })();
  }
});

window.addEventListener('focus', ()=>{
  if(document.hidden) return;
  (async ()=>{
    await cloudPull();
  })();
});

// ---- Deterministic RNG ----
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
const DIRS2 = DIRS;

// ---- solver / generator ----
function clonePosArr(posArr){ return posArr.map(p => ({x:p.x, y:p.y})); }
function stateKey(posArr){ return posArr.map(p => `${p.x},${p.y}`).join("|"); }
function inBoundsStage(W, x, y){ return x>=0 && y>=0 && x<W && y<W; }
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
function slideOnce(posArr, W, blocksStatic, penguinIdx, dir){
  const cur = posArr[penguinIdx];
  let x = cur.x, y = cur.y;
  let moved = false;
  while(true){
    const nx = x + dir.x, ny = y + dir.y;
    if(!inBoundsStage(W, nx, ny)) return { nextPosArr:null, fellOff:true };
    if(isBlockedStatic(nx, ny, blocksStatic) || penguinAtInState(posArr, nx, ny, penguinIdx) !== -1) break;
    x = nx; y = ny; moved = true;
  }
  if(!moved) return null;
  const next = clonePosArr(posArr);
  next[penguinIdx] = {x,y};
  return { nextPosArr: next, fellOff:false };
}
function solveBFS(puzzle, startPosOverride=null, maxDepth=90){
  const W = puzzle.W;
  const home = { x: Math.floor(W/2), y: Math.floor(W/2) };
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

    if(cur[0].x===home.x && cur[0].y===home.y){
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
      for(let di=0; di<DIRS2.length; di++){
        const r = slideOnce(cur, W, blocksStatic, i, DIRS2[di]);
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
  const W = spec.W;
  const home = { x: Math.floor(W/2), y: Math.floor(W/2) };
  const rng = makeRng(seedStr);

  const blockMin = (W===5) ? 1 : 4;
  const blockMax = (W===5) ? 4 : 9;

  const MAX_TRIES = 5000;

  for(let t=0;t<MAX_TRIES;t++){
    const blocksArr=[];
    const used = new Set([`${home.x},${home.y}`]);

    const blockCount = rng.int(blockMin, blockMax);
    while(blocksArr.length<blockCount){
      const x = rng.int(0, W-1), y = rng.int(0, W-1);
      const k=`${x},${y}`;
      if(used.has(k)) continue;
      used.add(k);
      blocksArr.push([x,y]);
    }

    const pengArr=[];
    const used2 = new Set(used);
    while(pengArr.length<4){
      const x = rng.int(0, W-1), y = rng.int(0, W-1);
      const k=`${x},${y}`;
      if(used2.has(k)) continue;
      used2.add(k);
      pengArr.push([x,y]);
    }
    if(pengArr[0][0]===home.x && pengArr[0][1]===home.y) continue;

    const puzzle = { W, blocks:blocksArr, penguins:pengArr };
    const res = solveBFS(puzzle, null, spec.max + 25);

    if(res.solvable && res.minMoves >= spec.min && res.minMoves <= spec.max){
      return puzzle;
    }
  }
  return { W, blocks:[], penguins:[[0,W-1],[W-1,0],[1,1],[W-2,W-2]] };
}

// ---- cache ----
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
  const puzzle = generatePuzzleDeterministic(spec, `stage:${stage}:W${spec.W}:min${spec.min}:max${spec.max}`);
  setStagePuzzleToCache(stage, puzzle);
  return puzzle;
}
function getOrCreateDailyPack(){
  const today = ymdLocal();
  const pack = loadJSON(SAVE.daily, null);
  if(pack && pack.date === today && pack.levels && pack.cleared) return pack;

  const levels = [1,2,3].map(level=>{
    const spec = dailySpec(level);
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

function refreshDailyIfNeeded(){
  const today = ymdLocal();
  const pack = loadJSON(SAVE.daily, null);

  if(!pack || pack.date !== today){
    const next = getOrCreateDailyPack();

    // 어제 daily 세션 들고 있으면 꼬임 방지로 제거
    const session = loadSession();
    if(session && session.mode === MODE.DAILY && session.dailyDate !== next.date){
      clearSession();
    }
    return next;
  }
  return pack;
}

// ---- session ----
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

// ---- runtime load ----
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

  initPenguinAnimations();
  updateHUD();
  draw();
  saveSession();
}

// ---- gameplay helpers ----
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

// history
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
    setPenguinAnim(i, "stop");
  }
  runtime.moves = s.moves;
  saveSession();
  return true;
}

// ---- animation ----
const PENG_SHEET_ROWS = 4;
const PENG_SHEET_COLS = 4;
const PENG_FRAME_COUNT = PENG_SHEET_ROWS * PENG_SHEET_COLS;

const PENG_ANIM_DEF = {
  idle: {
    sheet: 1,
    frames: [5, 6, 8, 6, 5, 7, 5],
    durations: [230, 230, 240, 230, 240, 260, 240],
    loop: true,
    drawScale: 0.91,
  },
  dragStart: {
    sheet: 1,
    frames: [2],
    durations: [140],
    loop: false,
    next: "idle",
    drawScale: 0.92,
  },
  stop: {
    sheet: 1,
    frames: [5],
    durations: [320],
    loop: false,
    next: "idle",
    drawScale: 0.91,
  },
  slideX: {
    sheet: 2,
    frames: [5, 6, 7, 8, 11, 12, 14, 15, 11, 10],
    durations: [50, 45, 40, 35, 30, 30, 70, 70, 35, 45],
    loop: false,
    next: "stop",
  },
  slideY: {
    sheet: 3,
    frames: [9],
    durations: [99999],
    loop: false,
    next: "stop",
    sharedSheet: true,
  },
  fallOut: {
    sheet: 3,
    frames: [5, 13],
    durations: [90, 250],
    loop: false,
    sharedSheet: true,
  },
  fail: {
    sheet: 3,
    frames: [16],
    durations: [99999],
    loop: false,
    sharedSheet: true,
  },
  collision1: {
    sheet: 4,
    frames: [5, 6, 7, 8, 7, 6, 5, 6, 7, 8, 7, 6, 5],
    durations: [40, 40, 40, 45, 40, 40, 40, 40, 40, 45, 40, 40, 40],
    loop: false,
    next: "stop",
  },
  collision2: {
    sheet: 4,
    frames: [9, 10, 11, 12, 11, 10, 9, 10, 11, 12, 11, 10, 9],
    durations: [40, 40, 40, 45, 40, 40, 40, 40, 40, 45, 40, 40, 40],
    loop: false,
    next: "stop",
  },
};

function penguinFallbackImageByIndex(i){
  if(i === 0) return ASSETS.piece.peng0.img;
  if(i === 1) return ASSETS.piece.peng1.img;
  if(i === 2) return ASSETS.piece.peng2.img;
  return ASSETS.piece.peng3.img;
}

function getPenguinSheetImage(isHero, sheetNo, forceBase=false){
  const num = String(sheetNo).padStart(2, "0");
  const base = ASSETS.penguin[`base${num}`]?.img || null;
  if(!isHero || forceBase) return base;
  return (
    ASSETS.penguin[`hero${num}`]?.img ||
    ASSETS.penguin[`heroTypo${num}`]?.img ||
    base
  );
}

function frameRectByNumber(img, frameNumber){
  const total = PENG_FRAME_COUNT;
  const clamped = clamp(Number(frameNumber) || 1, 1, total);
  const idx = clamped - 1;
  const col = idx % PENG_SHEET_COLS;
  const row = Math.floor(idx / PENG_SHEET_COLS);
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const sw = iw / PENG_SHEET_COLS;
  const sh = ih / PENG_SHEET_ROWS;
  return { sx: col * sw, sy: row * sh, sw, sh };
}

function makeAnimState(name, opts={}){
  const def = PENG_ANIM_DEF[name] || PENG_ANIM_DEF.stop;
  const frames = (opts.frames || def.frames || [5]).slice();
  const durations = (opts.durations || def.durations || [80]).slice();
  while(durations.length < frames.length){
    durations.push(durations[durations.length - 1] || 80);
  }
  return {
    name,
    sheet: Number(opts.sheet || def.sheet || 1),
    frames,
    durations,
    loop: opts.loop ?? def.loop ?? false,
    next: opts.next ?? def.next ?? null,
    flipX: !!opts.flipX,
    flipY: !!opts.flipY,
    drawScale: Number.isFinite(opts.drawScale) ? opts.drawScale : (def.drawScale ?? 1),
    startedAt: nowMs(),
    frameStartedAt: nowMs(),
    frameIndex: 0,
  };
}

function setPenguinAnim(index, name, opts={}){
  const p = runtime.penguins?.[index];
  if(!p) return;
  if(Object.prototype.hasOwnProperty.call(opts, "faceX")){
    p._faceX = opts.faceX === -1 ? -1 : 1;
  }
  const nextOpts = { ...opts };
  delete nextOpts.faceX;
  const anim = makeAnimState(name, nextOpts);
  if(name === "idle" || name === "stop" || name === "dragStart"){
    anim.flipX = (p._faceX || 1) < 0;
  }
  if(name === "idle"){
    const variants = [0.94, 1.00, 1.08, 1.03];
    const speedScale = variants[index % variants.length];
    anim.durations = anim.durations.map((d)=>Math.max(40, Math.round(d * speedScale)));
    const phaseIndex = (index * 2) % anim.frames.length;
    anim.frameIndex = phaseIndex;
    const phaseMs = anim.durations[phaseIndex] || 120;
    // Start each penguin at a slightly different point in the current frame.
    anim.frameStartedAt -= Math.round(phaseMs * ((index + 1) * 0.23 % 1));
  }
  p._anim = anim;
}

function initPenguinAnimations(){
  for(let i=0;i<runtime.penguins.length;i++){
    const p = runtime.penguins[i];
    if(typeof p._faceX !== "number") p._faceX = 1;
    setPenguinAnim(i, "idle");
  }
}

function advancePenguinAnim(index, now){
  const p = runtime.penguins?.[index];
  if(!p) return null;
  if(!p._anim) setPenguinAnim(index, "idle");
  let anim = p._anim;
  if(!anim) return null;

  while((now - anim.frameStartedAt) >= (anim.durations[anim.frameIndex] || 80)){
    anim.frameStartedAt += (anim.durations[anim.frameIndex] || 80);
    const last = anim.frames.length - 1;
    if(anim.frameIndex < last){
      anim.frameIndex += 1;
      continue;
    }
    if(anim.loop){
      anim.frameIndex = 0;
      continue;
    }
    if(anim.next){
      const nextName = anim.next;
      setPenguinAnim(index, nextName);
      anim = p._anim;
      continue;
    }
    break;
  }
  return anim;
}

function buildSlideXAnimByDistance(distance){
  const baseFrames = PENG_ANIM_DEF.slideX.frames.slice();
  const baseDur = PENG_ANIM_DEF.slideX.durations.slice();
  const extraLoops = Math.max(0, Number(distance || 0) - 2);
  for(let i=0;i<extraLoops;i++){
    baseFrames.splice(baseFrames.length - 2, 0, 14, 15);
    baseDur.splice(baseDur.length - 2, 0, 70, 70);
  }
  return { frames: baseFrames, durations: baseDur };
}

function setSlideAnimByDirection(index, dir, distance){
  const p = runtime.penguins[index];
  if(!p) return;
  if(dir.x !== 0){
    const slide = buildSlideXAnimByDistance(distance);
    setPenguinAnim(index, "slideX", {
      frames: slide.frames,
      durations: slide.durations,
      flipX: dir.x < 0,
      faceX: dir.x < 0 ? -1 : 1,
    });
  }else if(dir.y !== 0){
    setPenguinAnim(index, "slideY", {
      flipY: dir.y < 0,
      faceX: p._faceX || 1,
    });
  }
}

function animateFallOff(index, startPos, edgePos, outPos, meta={}){
  const p = runtime.penguins[index];
  if(!p) return;
  const dir = meta.dir || { x:0, y:0 };
  const insideCells = Math.abs(edgePos.x - startPos.x) + Math.abs(edgePos.y - startPos.y);
  const hasInsideSlide = insideCells > 0;
  const slideDur = hasInsideSlide ? clamp(140 + insideCells * 95, 300, 1200) : 0;
  const splashDur = 320;
  const startedAt = nowMs();
  let phase = hasInsideSlide ? 0 : 1;
  let phaseStartedAt = startedAt;

  if(hasInsideSlide){
    setSlideAnimByDirection(index, dir, insideCells);
  }else{
    // If already on edge, start fall exactly when crossing out of board.
    setPenguinAnim(index, "fallOut", { faceX: dir.x < 0 ? -1 : (dir.x > 0 ? 1 : (p._faceX || 1)) });
  }

  function tick(t){
    if(phase === 0){
      const k = Math.min(1, (t - phaseStartedAt) / slideDur);
      const e = 1 - Math.pow(1-k, 3);
      p._rx = startPos.x + (edgePos.x - startPos.x) * e;
      p._ry = startPos.y + (edgePos.y - startPos.y) * e;
      draw();
      if(k < 1){
        requestAnimationFrame(tick);
        return;
      }
      p.x = edgePos.x;
      p.y = edgePos.y;
      phase = 1;
      phaseStartedAt = t;
      setPenguinAnim(index, "fallOut", { faceX: dir.x < 0 ? -1 : (dir.x > 0 ? 1 : (p._faceX || 1)) });
      requestAnimationFrame(tick);
      return;
    }

    const k = Math.min(1, (t - phaseStartedAt) / splashDur);
    const e = 1 - Math.pow(1-k, 2.2);
    p._rx = edgePos.x + (outPos.x - edgePos.x) * e;
    p._ry = edgePos.y + (outPos.y - edgePos.y) * e;
    draw();

    if(k < 1){
      requestAnimationFrame(tick);
      return;
    }

    delete p._rx; delete p._ry;
    p.x = outPos.x;
    p.y = outPos.y;
    setPenguinAnim(index, "fail");
    runtime.gameOver = true;
    saveSession();
    vibrate([30, 40, 30, 50, 120]);
    setTimeout(()=>show(failOverlay), 220);
    runtime.busy = false;
    tutorialOnMoveEnd(index, startPos, outPos, true);
    draw();
  }
  requestAnimationFrame(tick);
}

function animateSlide(index, from, to, meta={}){
  const start = nowMs();
  const cells = Math.max(1, Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
  const dur = clamp(140 + cells * 95, 320, 980);
  const p = runtime.penguins[index];
  const fx=from.x, fy=from.y;
  const tx=to.x, ty=to.y;
  const dir = meta.dir || { x:0, y:0 };
  const distance = Math.abs(tx - fx) + Math.abs(ty - fy);
  setSlideAnimByDirection(index, dir, distance);

  function tick(t){
    const k = Math.min(1,(t-start)/dur);
    const e = 1 - Math.pow(1-k, 3);
    p._rx = fx + (tx-fx)*e;
    p._ry = fy + (ty-fy)*e;

    draw();

    if(k<1) requestAnimationFrame(tick);
    else{
      delete p._rx; delete p._ry;
      p.x=tx; p.y=ty;
      setPenguinAnim(index, "stop");
      runtime.moves++;
      const reachedHome = (index===0 && p.x===runtime.home.x && p.y===runtime.home.y);

      if(!reachedHome){
        if(meta.blockedByPenguin){
          setPenguinAnim(index, "collision1");
          if(Number.isInteger(meta.blockedByPenguinIndex)){
            setPenguinAnim(meta.blockedByPenguinIndex, "collision2");
          }
        }else if(meta.blockedByRock){
          setPenguinAnim(index, "collision1");
        }
      }

      // 다음 액션 전까지 힌트 지속 -> 움직였으니 해제
      runtime.hintActive = false;
      runtime.hintPenguinIndex = null;

      if(index===0 && p.x===runtime.home.x && p.y===runtime.home.y){
        if(TUTORIAL.active){
          if(TUTORIAL.allowClear){
            playClearSfx();
            toast("클리어!");
            tutorialNext();
          }
        }else{
          runtime.cleared = true;
          onClear();
        }
      }
      saveSession();

      runtime.busy=false;
      tutorialOnMoveEnd(index, from, to, false);
      draw();
    }
  }
  requestAnimationFrame(tick);
}

function tryMovePenguin(index, dir){
  if(runtime.paused) return;
  if(runtime.busy || runtime.gameOver || runtime.cleared) return;
  if(!dir) return;
  if(TUTORIAL.active && !tutorialAllowMove(index, dir)){
    tutorialBlocked();
    return;
  }

  const p = runtime.penguins[index];
  const startX = p.x;
  const startY = p.y;
  let x=p.x, y=p.y;
  let moved=false;
  let blockedByPenguin=false;
  let blockedByRock=false;
  let blockedByPenguinIndex=-1;

  while(true){
    const nx=x+dir.x, ny=y+dir.y;

    if(!inBounds(nx,ny)){
      snapshot();
      runtime.busy = true;
      vibrate(25);
      runtime.hintActive = false;
      runtime.hintPenguinIndex = null;
      animateFallOff(index, {x:startX,y:startY}, {x,y}, {x:nx,y:ny}, { dir });
      return;
    }
    if(cellBlocked(nx,ny)){ blockedByRock = true; break; }
    const hitIdx = penguinAt(nx,ny,index);
    if(hitIdx !== -1){ blockedByPenguin = true; blockedByPenguinIndex = hitIdx; break; }

    x=nx; y=ny; moved=true;
  }

  if(blockedByPenguin){
    playBoop();
    vibrate(20);
  }
  if(!moved){
    if(blockedByPenguin){
      setPenguinAnim(index, "collision1");
      if(blockedByPenguinIndex >= 0) setPenguinAnim(blockedByPenguinIndex, "collision2");
    }else if(blockedByRock){
      playBoop();
      vibrate(16);
      setPenguinAnim(index, "collision1");
    }else{
      setPenguinAnim(index, "stop");
    }
    toast("못 움직여!");
    draw();
    return;
  }

  snapshot();
  runtime.busy = true;
  vibrate(12);
  animateSlide(index, {x:p.x,y:p.y}, {x,y}, {
    dir,
    blockedByRock,
    blockedByPenguin,
    blockedByPenguinIndex,
  });
}

function currentPositionsAsArray(){
  return runtime.penguins.map(p=>[p.x,p.y]);
}

// ---- undo/hint/retry ----
function useUndo(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(!step || step.type !== "undo"){
      tutorialBlocked();
      return;
    }
  }
  if(runtime.history.length === 0){ toast("되돌릴 수 없어요"); return; }
  restoreSnapshot();
  draw();
  if(TUTORIAL.active) tutorialNext();
}

function useHint(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(!step || step.type !== "hint"){
      tutorialBlocked();
      return;
    }
  }

  if(runtime.mode === MODE.DAILY){
    openInfo("일일 도전", "일일 도전에서는 힌트를 사용할 수 없어요!");
    return;
  }
  if(!TUTORIAL.active && player.hint <= 0){
    // 인게임 정책: 첫 구매는 골드 1회, 이후엔 광고로 무제한
    const cost = 200;
    if(player.ingameHintGoldBuys <= 0){
      if(player.gold < cost){
        openInfo("힌트가 없어요", "상점에서 힌트를 구매하거나 광고로 획득할 수 있어요.");
        return;
      }
      const ok = confirm(`힌트 1개를 ${cost} 골드로 구매할까요? (인게임 1회 가능)`);
      if(!ok) return;
      player.gold -= cost;
      player.hint += 1;
      player.ingameHintGoldBuys += 1;
      savePlayerLocal();
      cloudPushDebounced();
      updateHUD();
      toast("힌트 +1");
    }else{
      const ok = confirm("광고를 보고 힌트 1개를 받을까요?");
      if(!ok) return;
      // 광고 시청 성공 처리
      player.hint += 1;
      savePlayerLocal();
      cloudPushDebounced();
      updateHUD();
      toast("힌트 +1");
    }
  }

  const res = solveBFS(runtime.puzzle, currentPositionsAsArray(), 90);
  if(!res.solvable || !res.path || res.path.length===0){
    toast("힌트를 만들 수 없어요");
    return; // 소모 X
  }

  if(!TUTORIAL.active){
    player.hint--;
    savePlayerLocal();
    cloudPushDebounced();
    updateHUD();
  }

  runtime.hintPenguinIndex = res.path[0].penguin;
  runtime.hintActive = true;
  toast("힌트!");
  draw();
  if(TUTORIAL.active) tutorialNext();
}

function restartCurrent(){
  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(step?.type !== "retry"){
      tutorialBlocked();
      return;
    }
    loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_PUZZLE });
    tutorialNext();
    return;
  }
  if(runtime.mode === MODE.STAGE){
    const stage = runtime.currentStage ?? 1;
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

// ---- clear ----
function onClear(){
  playClearSfx();
  // ✅ 클리어 팝업도 딜레이
  setTimeout(async ()=>{
    if(runtime.mode === MODE.STAGE){
      // 기존 시간감소 계산은 유지하되, "시간에 따라 감소" 문구는 숨김
      const REWARD_MAX = 100;
      const REWARD_DECAY_PER_SEC = 1;
      const elapsed = Math.floor((nowMs() - runtime.startTimeMs)/1000);
      const reward = clamp(REWARD_MAX - elapsed*REWARD_DECAY_PER_SEC, 0, REWARD_MAX);

      player.gold += reward;
      player.progressStage = Math.max(player.progressStage, (runtime.currentStage ?? 1) + 1);

      savePlayerLocal();
      await cloudSubmitStageClear(player.progressStage);
      cloudPushDebounced();

      clearSession();

      if(clearDesc) clearDesc.textContent = `스테이지 보상: ${reward} 코인`;
      show(clearOverlay);
      updateHUD();
      return;
    }

    if(runtime.mode === MODE.DAILY){
      const level = runtime.dailyLevel ?? 1;
      const pack = getOrCreateDailyPack();
      const alreadyCleared = !!pack?.cleared?.[level];

      if(!alreadyCleared){
        const rw = dailyReward(level);
        player.gold += rw.gold;
        player.gem += rw.gem;
        markDailyCleared(level);

        savePlayerLocal();
        await cloudSubmitDailyClear(pack.date, level);
        cloudPushDebounced();

        clearSession();
        if(clearDesc) clearDesc.textContent =
          `일일 도전 ${level}단계 보상\n${rw.gold} 코인 / ${rw.gem} 젬`;
      }else{
        await cloudSubmitDailyClear(pack.date, level);
        clearSession();
        if(clearDesc) clearDesc.textContent =
          `일일 도전 ${level}단계 재도전 클리어!\n보상은 1회만 지급됩니다.`;
      }
      show(clearOverlay);
      updateHUD();
      return;
    }
  }, 220);
}

// ---- canvas draw ----
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
  if(iw<=0 || ih<=0){ ctx.drawImage(img, x,y,w,h); return true; }
  const scale = Math.max(w/iw, h/ih);
  const sw = w/scale;
  const sh = h/scale;
  const sx = (iw - sw)/2;
  const sy = (ih - sh)/2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  return true;
}
function getPenguinDrawSource(index, now){
  const p = runtime.penguins?.[index];
  if(!p) return { type: "fallback", image: penguinFallbackImageByIndex(index), flipX: false, flipY: false };
  const anim = advancePenguinAnim(index, now);
  if(!anim) return { type: "fallback", image: penguinFallbackImageByIndex(index), flipX: false, flipY: false };
  const isHero = index === 0;
  const def = PENG_ANIM_DEF[anim.name] || null;
  const forceBase = !!(anim.sharedSheet ?? def?.sharedSheet);
  const sheet = getPenguinSheetImage(isHero, anim.sheet, forceBase);
  if(!sheet){
    return {
      type: "fallback",
      image: penguinFallbackImageByIndex(index),
      flipX: !!anim.flipX,
      flipY: !!anim.flipY,
    };
  }
  return {
    type: "sheet",
    image: sheet,
    frame: anim.frames[anim.frameIndex] || anim.frames[0] || 1,
    flipX: !!anim.flipX,
    flipY: !!anim.flipY,
    drawScale: Number.isFinite(anim.drawScale) ? anim.drawScale : 1,
  };
}

const BOARD_TILT_DEG = 0;
function getBoardProjection(){
  if(!canvas || !runtime?.W) return null;
  const minSide = Math.min(canvas.width, canvas.height);
  // board_full includes large outer frame + bottom lip, so playable area must be smaller
  // to keep the rounded shell fully visible inside canvas.
  const playAreaRatio = ASSETS.board.full.img ? 0.70 : 0.94;
  const size = Math.max(2, minSide * playAreaRatio);
  const pad = (minSide - size) * 0.5;
  const ox = (canvas.width - size)/2;
  const tilt = Math.sin((BOARD_TILT_DEG * Math.PI) / 180);
  const topInset = tilt * 0.20;
  const depthCurve = 1 + tilt * 0.55;
  const topNarrow = tilt * 0.22;
  const oyBase = (canvas.height - size)/2;
  const oy = oyBase - size * topInset * 0.56; // when tilt=0, exact top-view center
  const cx = ox + size/2;

  function vToScale(v){
    return 1 - topNarrow*(1 - clamp(v, 0, 1));
  }
  function vToY(v){
    const vv = clamp(v, 0, 1);
    return oy + size * (topInset + (1-topInset) * Math.pow(vv, depthCurve));
  }
  function yToV(y){
    const yn = (y - oy) / size;
    if(yn < topInset || yn > 1) return null;
    const t = (yn - topInset) / (1-topInset);
    return Math.pow(clamp(t, 0, 1), 1 / depthCurve);
  }
  function pointUV(u, v){
    const vv = clamp(v, 0, 1);
    const su = vToScale(vv);
    const left = cx - (size * su)/2;
    return {
      x: left + clamp(u, 0, 1) * size * su,
      y: vToY(vv),
    };
  }
  function cellQuad(gx, gy){
    const W = runtime.W;
    const u0 = gx / W, u1 = (gx+1) / W;
    const v0 = gy / W, v1 = (gy+1) / W;
    return [pointUV(u0, v0), pointUV(u1, v0), pointUV(u1, v1), pointUV(u0, v1)];
  }
  function cellCenter(rx, ry){
    const W = runtime.W;
    // For top view we allow off-board extrapolation so fall animation is not clipped/shrunk.
    if(BOARD_TILT_DEG === 0){
      const cell = size / W;
      const x = ox + (rx + 0.5) * cell;
      const y = oy + (ry + 0.5) * cell;
      return { x, y, cw: cell, ch: cell, s: cell };
    }
    const u = (rx + 0.5) / W;
    const v = (ry + 0.5) / W;
    const c = pointUV(u, v);
    const vv = clamp(v, 0, 1);
    const cw = size * vToScale(vv) / W;
    const v0 = clamp(vv - 0.5/W, 0, 1);
    const v1 = clamp(vv + 0.5/W, 0, 1);
    const ch = vToY(v1) - vToY(v0);
    return { x:c.x, y:c.y, cw, ch, s: Math.min(cw, ch) };
  }

  return { size, ox, oy, cx, vToScale, vToY, yToV, pointUV, cellQuad, cellCenter };
}

let boardFullMissingWarned = false;

function draw(){
  if(!ctx || !canvas) return;
  if(gameLayer?.style?.display === "none") return;
  resizeCanvasToDisplaySize();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!runtime.puzzle) return;
  const proj = getBoardProjection();
  if(!proj) return;
  const W = runtime.W;
  const baseCell = proj.size / W;

  const quadPath = (q)=>{
    ctx.beginPath();
    ctx.moveTo(q[0].x, q[0].y);
    ctx.lineTo(q[1].x, q[1].y);
    ctx.lineTo(q[2].x, q[2].y);
    ctx.lineTo(q[3].x, q[3].y);
    ctx.closePath();
  };
  const quadBounds = (q)=>{
    const xs = [q[0].x,q[1].x,q[2].x,q[3].x];
    const ys = [q[0].y,q[1].y,q[2].y,q[3].y];
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
  };
  const boardQuad = [proj.pointUV(0,0), proj.pointUV(1,0), proj.pointUV(1,1), proj.pointUV(0,1)];
  const boardB = quadBounds(boardQuad);
  const drawCellTile = (b, tileImg)=>{
    const s = Math.min(b.w, b.h);
    const gap = s * 0.032;
    const x = b.x + gap;
    const y = b.y + gap;
    const w = b.w - gap*2;
    const h = b.h - gap*2;
    const r = s * 0.14;

    const g = ctx.createLinearGradient(x, y, x, y+h);
    g.addColorStop(0, "rgba(221,243,255,0.98)");
    g.addColorStop(1, "rgba(183,227,249,0.98)");
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = "rgba(116,196,236,0.82)";
    ctx.lineWidth = Math.max(1, s*0.02);
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.26)";
    roundRect(ctx, x+w*0.07, y+h*0.06, w*0.86, h*0.24, r*0.65);
    ctx.fill();

    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    if(tileImg){
      ctx.globalAlpha = 0.52;
      drawImageCover(tileImg, x, y, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // Board shell from uploaded full image. The source already includes depth/rounding.
  const SRC = {
    fullPlay: [114, 86, 690, 663], // playable center box in board_full.png
  };
  const toRectBySrcBoxStretch = (srcBox, target)=>{
    const [sx0, sy0, sx1, sy1] = srcBox;
    const sw = sx1 - sx0;
    const sh = sy1 - sy0;
    const scaleX = target.w / sw;
    const scaleY = target.h / sh;
    return {
      x: target.x - sx0 * scaleX,
      y: target.y - sy0 * scaleY,
      w: 800 * scaleX,
      h: 800 * scaleY
    };
  };
  const holeTarget = {
    x: boardB.x,
    y: boardB.y,
    w: boardB.w,
    h: boardB.h
  };
  const fullRect = toRectBySrcBoxStretch(SRC.fullPlay, holeTarget);

  if(ASSETS.board.full.img){
    ctx.drawImage(ASSETS.board.full.img, fullRect.x, fullRect.y, fullRect.w, fullRect.h);
    // Keep original board detail but suppress only the top haze tint.
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const topFixY = fullRect.y + fullRect.h * 0.01;
    const topFixH = fullRect.h * 0.11;
    const topFixGrad = ctx.createLinearGradient(0, topFixY, 0, topFixY + topFixH);
    topFixGrad.addColorStop(0, "rgba(198,224,241,0.62)");
    topFixGrad.addColorStop(1, "rgba(198,224,241,0.22)");
    ctx.fillStyle = topFixGrad;
    ctx.fillRect(fullRect.x, topFixY, fullRect.w, topFixH);
    ctx.restore();
  }else{
    // keep a visible fallback for safety, but warn once
    ctx.fillStyle = "rgba(206,234,248,0.95)";
    roundRect(ctx, boardB.x - baseCell * 0.08, boardB.y - baseCell * 0.08, boardB.w + baseCell * 0.16, boardB.h + baseCell * 0.16, baseCell * 0.3);
    ctx.fill();
    if(!boardFullMissingWarned){
      boardFullMissingWarned = true;
      console.warn("[Board] board_full.png failed to load.");
      toast("board_full 이미지 로드 실패");
    }
  }

  ctx.save();
  if(BOARD_TILT_DEG === 0){
    // Clip tiles to rounded playable area so corners stay round like board_full art.
    roundRect(ctx, boardB.x, boardB.y, boardB.w, boardB.h, baseCell * 0.24);
    ctx.clip();
  }else{
    quadPath(boardQuad);
    ctx.clip();
  }

  const tile = ASSETS.board.ice.img;
  for(let y=0;y<W;y++){
    for(let x=0;x<W;x++){
      const q = proj.cellQuad(x,y);
      const b = quadBounds(q);
      if(BOARD_TILT_DEG === 0){
        drawCellTile(b, tile);
      }else{
        ctx.save();
        quadPath(q);
        ctx.clip();
        drawCellTile(b, tile);
        ctx.restore();
      }
    }
  }
  const homeQ = proj.cellQuad(runtime.home.x, runtime.home.y);
  const homeB = quadBounds(homeQ);
  ctx.save();
  quadPath(homeQ);
  ctx.clip();
  if(!drawImageCover(ASSETS.piece.goal.img, homeB.x, homeB.y, homeB.w, homeB.h)){
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, homeB.x+homeB.w*0.12, homeB.y+homeB.h*0.12, homeB.w*0.76, homeB.h*0.76, Math.min(homeB.w,homeB.h)*0.2);
    ctx.fill();
  }
  ctx.restore();

  for(const b of runtime.blocks){
    const c = proj.cellCenter(b.x, b.y);
    const s = c.s * 0.90;
    if(!drawImageCover(ASSETS.piece.rock.img, c.x - s/2, c.y - s/2, s, s)){
      ctx.fillStyle = "rgba(10,13,16,0.85)";
      roundRect(ctx, c.x - s*0.36, c.y - s*0.36, s*0.72, s*0.72, s*0.18);
      ctx.fill();
    }
  }
  // End board clip before drawing penguins so off-board fall animation stays visible.
  ctx.restore();

  const t = nowMs();
  const pulse = runtime.hintActive ? (0.5 + 0.5*Math.sin(t/90)) : 0;

  for(let i=0;i<runtime.penguins.length;i++){
    const p = runtime.penguins[i];
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);
    const c = proj.cellCenter(rx, ry);
    const s = c.s;

    if(runtime.hintActive && i===runtime.hintPenguinIndex){
      ctx.save();
      ctx.globalAlpha = 0.20 + 0.60*pulse;
      ctx.lineWidth = Math.max(3, s*0.09);
      ctx.strokeStyle = "rgba(255,245,140,1)";
      roundRect(ctx, c.x-s*0.44, c.y-s*0.44, s*0.88, s*0.88, s*0.22);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + s*0.35, s*0.27, s*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    const src = getPenguinDrawSource(i, t);
    if(src?.image){
      const scale = (i === 0) ? 1.02 : 0.97;
      const stateScale = Number.isFinite(src.drawScale) ? src.drawScale : 1;
      const w = s * scale * stateScale;
      const h = s * scale * stateScale;
      const drawY = -s*0.03;
      ctx.save();
      ctx.translate(c.x, c.y + drawY);
      ctx.scale(src.flipX ? -1 : 1, src.flipY ? -1 : 1);
      if(src.type === "sheet"){
        const r = frameRectByNumber(src.image, src.frame);
        ctx.drawImage(src.image, r.sx, r.sy, r.sw, r.sh, -w/2, -h/2, w, h);
      }else{
        ctx.drawImage(src.image, -w/2, -h/2, w, h);
      }
      ctx.restore();
    }else{
      ctx.fillStyle = (i===0) ? "rgba(255,255,255,0.92)" : "rgba(210,230,255,0.92)";
      roundRect(ctx, c.x - s*0.28, c.y - s*0.32, s*0.56, s*0.64, s*0.2);
      ctx.fill();
    }
  }

  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(step?.type === "move"){
      const p = runtime.penguins[step.penguin];
      if(p){
        const rx = (p._rx ?? p.x);
        const ry = (p._ry ?? p.y);
        const c = proj.cellCenter(rx, ry);
        const s = c.s;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(3, s*0.09);
        ctx.strokeStyle = "rgba(120,220,255,0.95)";
        roundRect(ctx, c.x-s*0.45, c.y-s*0.45, s*0.90, s*0.90, s*0.22);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // no extra frame overlay when board_full is used

}

// ---- pointer ----
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
  const proj = getBoardProjection();
  if(!proj) return { gx:-1, gy:-1 };
  const v = proj.yToV(p.y);
  if(v == null) return { gx:-1, gy:-1 };
  const scale = proj.vToScale(v);
  const left = proj.cx - (proj.size * scale)/2;
  const width = proj.size * scale;
  const u = (p.x - left) / width;
  const gx = Math.floor(u * runtime.W);
  const gy = Math.floor(v * runtime.W);
  if(gx < 0 || gy < 0 || gx >= runtime.W || gy >= runtime.W) return { gx:-1, gy:-1 };
  return {gx, gy};
}

const pointer = { down:false, selected:-1, downPos:{x:0,y:0}, last:{x:0,y:0} };

function onDown(e){
  if(runtime.paused) return;
  if(runtime.busy || runtime.gameOver || runtime.cleared) return;
  pointer.down = true;
  const p = getCanvasPos(e);
  pointer.last = p;
  pointer.downPos = p;

  const {gx,gy} = cellFromPos(p);
  pointer.selected = penguinAt(gx,gy,-1);
  if(pointer.selected !== -1){
    setPenguinAnim(pointer.selected, "dragStart");
    draw();
  }
}
function onMove(e){
  if(!pointer.down) return;
  pointer.last = getCanvasPos(e);
}
function onUp(){
  if(!pointer.down) return;
  pointer.down = false;

  if(pointer.selected === -1) return;

  const dx = pointer.last.x - pointer.downPos.x;
  const dy = pointer.last.y - pointer.downPos.y;
  const dir = dirFromDrag(dx,dy);

  if(!dir){
    setPenguinAnim(pointer.selected, "stop");
    draw();
    pointer.selected = -1;
    return;
  }

  tryMovePenguin(pointer.selected, dir);
  pointer.selected = -1;
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

// ---- Loop ----
let raf = 0;
function startLoop(){
  stopLoop();
  const tick = ()=>{
    if(!runtime.paused){
      updateHUD();
      if(runtime.puzzle && runtime.mode !== MODE.HOME){
        draw();
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function stopLoop(){
  if(raf) cancelAnimationFrame(raf);
  raf = 0;
}

// ---- UI Flow ----
function hideAllOverlays(){
  hide(gearOverlay); hide(shopOverlay); hide(failOverlay); hide(clearOverlay);
  hide(dailySelectOverlay); hide(tutorialOverlay); hide(profileOverlay); hide(infoOverlay); hide(leaderboardOverlay);
  tutorialShowCoach(false);
  tutorialFocusOn(null);
}
function enterHomeSafe(){ enterHome(); }

function enterSplash(){
  runtime.mode = MODE.SPLASH;

  // ✅ 스플래시 배경: home 이미지 + 강블러
  setBG("bg-home");
  show(bgBlur);

  if(splashLogo) splashLogo.style.display = "block";
  if(splashHint) splashHint.classList.remove("show");

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

  // ✅ 홈에서도 돈/젬은 보이되, 가운데 pill은 숨김
  topBar && (topBar.style.display = "flex");

  hideAllOverlays();
  setPaused(false);

  updateHUD();
  startLoop();

  if(!player.tutorialDone){
    tutorialStart();
  }
}

function enterTutorial(){
  runtime.mode = MODE.TUTORIAL;
  setPaused(false);
  hideAllOverlays();

  setBG("bg-sea");
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_PUZZLE });
  tutorialShowCoach(true);
  tutorialSetStep(0);
  startLoop();
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

  let pack = refreshDailyIfNeeded();
  pack = await syncDailyPackFromCloud(pack);
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

async function openDailySelect(){
  let pack = refreshDailyIfNeeded();
  pack = await syncDailyPackFromCloud(pack);

  const cleared1 = !!pack.cleared[1];
  const cleared2 = !!pack.cleared[2];
  const cleared3 = !!pack.cleared[3];

  // 2단계는 1단계 클리어해야 열림, 3단계는 2단계 클리어해야 열림
  const unlocked2 = cleared1;
  const unlocked3 = cleared2;

  dailySelectDesc && (dailySelectDesc.textContent =
    `${pack.date} · 진행 ${Number(cleared1)+Number(cleared2)+Number(cleared3)}/3`
  );

  const setBtnState = (btn, level, cleared, unlocked) => {
    if(!btn) return;

    // 초기화
    btn.classList.remove("disabledBtn");
    btn.dataset.state = "";

    if(cleared){
      // ✅ 완료: 재도전 가능(보상 없음)
      btn.textContent = `${level}단계 · 완료 ✅ (재도전)`;
      btn.dataset.state = "replay";
      return;
    }

    if(!unlocked){
      // ✅ 잠김: 보이되 클릭 불가
      btn.textContent = `${level}단계 · 잠김 🔒`;
      btn.classList.add("disabledBtn");
      btn.dataset.state = "locked";
      return;
    }

    // ✅ 진행 가능
    btn.textContent = `${level}단계`;
    btn.dataset.state = "open";
  };

  setBtnState(btnDaily1, 1, cleared1, true);
  setBtnState(btnDaily2, 2, cleared2, unlocked2);
  setBtnState(btnDaily3, 3, cleared3, unlocked3);

  show(dailySelectOverlay);
}

const leaderboardState = {
  mode: "stage",
  loading: false,
};

function renderLeaderboardList(el, rows, scoreKey){
  if(!el) return;
  const myId = Cloud.user?.id || "";
  if(!rows?.length){
    el.innerHTML = `<li><span>기록 없음</span><span>-</span></li>`;
    return;
  }
  el.innerHTML = rows.map((row)=>{
    const uid = row.user_id || "";
    const name = row.display_name || `Guest-${String(uid).slice(0,8)}`;
    const rank = row.rank ?? "-";
    const score = row[scoreKey] ?? "-";
    const meCls = uid === myId ? "me" : "";
    return `<li class=\"${meCls}\"><span>#${rank} ${name}</span><span>${score}</span></li>`;
  }).join("");
}

function setLeaderboardTab(mode){
  leaderboardState.mode = mode;
  if(btnLeaderboardStage) btnLeaderboardStage.classList.toggle("ghostBtn", mode !== "stage");
  if(btnLeaderboardDaily) btnLeaderboardDaily.classList.toggle("ghostBtn", mode !== "daily");
}

async function loadLeaderboard(mode){
  const adapter = cloudAdapter();
  setLeaderboardTab(mode);

  if(!Cloud.enabled || !adapter){
    if(leaderboardMeta) leaderboardMeta.textContent = "Supabase 미설정: 리더보드를 사용할 수 없어요.";
    renderLeaderboardList(leaderboardTopList, [], "highest_stage");
    renderLeaderboardList(leaderboardAroundList, [], "highest_stage");
    return;
  }

  leaderboardState.loading = true;
  if(leaderboardMeta){
    leaderboardMeta.textContent = mode === "stage" ? "스테이지 순위 로딩 중..." : "일일 순위 로딩 중...";
  }
  try{
    if(mode === "stage"){
      const topRes = await adapter.getStageLeaderboardTop(50);
      const aroundRes = await adapter.getStageLeaderboardAroundMe(Cloud.user?.id, 10);
      renderLeaderboardList(leaderboardTopList, topRes?.rows || [], "highest_stage");
      renderLeaderboardList(leaderboardAroundList, aroundRes?.rows || [], "highest_stage");
      if(leaderboardMeta) leaderboardMeta.textContent = "스테이지 TOP 50 / 내 주변 ±10";
    }else{
      const dateKey = ymdLocal();
      const topRes = await adapter.getDailyLeaderboardTop(dateKey, 50);
      const aroundRes = await adapter.getDailyLeaderboardAroundMe(dateKey, Cloud.user?.id, 10);
      renderLeaderboardList(leaderboardTopList, topRes?.rows || [], "cleared_levels");
      renderLeaderboardList(leaderboardAroundList, aroundRes?.rows || [], "cleared_levels");
      if(leaderboardMeta) leaderboardMeta.textContent = `${dateKey} · 일일 TOP 50 / 내 주변 ±10`;
    }
  }catch(e){
    console.warn('[Leaderboard] load failed', e);
    if(leaderboardMeta) leaderboardMeta.textContent = "리더보드 로딩 실패";
  }finally{
    leaderboardState.loading = false;
  }
}

async function openLeaderboard(){
  show(leaderboardOverlay);
  setPaused(true);
  await loadLeaderboard(leaderboardState.mode || "stage");
}


// ---- Buttons ----
btnNavHome && (btnNavHome.onclick = ()=>enterHome());

// ✅ 게임은 1부터 시작: 홈의 플레이 버튼은 1단계로 진입 수정 : 플레이어 스테이지로 시작 
btnStage && (btnStage.onclick = ()=>enterStageMode(player.progressStage));

btnDaily && (btnDaily.onclick = ()=>openDailySelect());

btnDaily1 && (btnDaily1.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(1); });
btnDaily2 && (btnDaily2.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(2); });
btnDaily3 && (btnDaily3.onclick = ()=>{ hide(dailySelectOverlay); enterDailyMode(3); });
btnCloseDailySelect && (btnCloseDailySelect.onclick = ()=>hide(dailySelectOverlay));

btnNavShop && (btnNavShop.onclick = ()=>{
  updateShopMoney();
  show(shopOverlay);
});
btnCloseShop && (btnCloseShop.onclick = ()=>hide(shopOverlay));
btnNavEvent && (btnNavEvent.onclick = ()=>openLeaderboard());
btnLeaderboardStage && (btnLeaderboardStage.onclick = ()=>loadLeaderboard("stage"));
btnLeaderboardDaily && (btnLeaderboardDaily.onclick = ()=>loadLeaderboard("daily"));
btnCloseLeaderboard && (btnCloseLeaderboard.onclick = ()=>{
  hide(leaderboardOverlay);
  setPaused(false);
});

btnSetting && (btnSetting.onclick = ()=>{
  if(gearDesc){
    gearDesc.textContent =
      runtime.mode === MODE.DAILY
        ? `일일 도전 ${runtime.dailyLevel}/3`
        : (runtime.mode === MODE.STAGE ? `스테이지 LEVEL ${runtime.currentStage ?? 1}` : `홈`);
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
    // 다음은 진행 단계로
    const nextStage = (runtime.currentStage ?? 1) + 1;
    enterStageMode(nextStage);
  }else{
    enterHome();
    openDailySelect();
  }
});

// ---- Settings ----
btnSound && (btnSound.onclick = async ()=>{
  player.soundOn = !player.soundOn;
  savePlayerLocal();
  cloudPushDebounced();
  btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`;
  try{
    if(player.soundOn) await bgm?.play?.();
    else bgm?.pause?.();
  }catch{}
});
btnVibe && (btnVibe.onclick = ()=>{
  player.vibeOn = !player.vibeOn;
  savePlayerLocal();
  cloudPushDebounced();
  btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`;
  toast(player.vibeOn ? "진동 ON" : "진동 OFF");
  vibrate(25);
});
btnLang && (btnLang.onclick = ()=>{
  const order = ["ko","en","ja"];
  const i = order.indexOf(player.lang);
  player.lang = order[(i+1) % order.length];
  savePlayerLocal();
  cloudPushDebounced();
  const label = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
  btnLang.textContent = `언어: ${label}`;
  toast(`언어 변경: ${label}`);
});

// ---- Tutorial ----
btnTutorial && (btnTutorial.onclick = ()=>{
  tutorialStart();
});
btnTutorialClose && (btnTutorialClose.onclick = ()=>{
  hide(tutorialOverlay);
  setPaused(false);
});
btnTutorialSkip && (btnTutorialSkip.onclick = ()=>tutorialSkip());
btnTutorialAction && (btnTutorialAction.onclick = ()=>{
  const step = tutorialCurrentStep();
  if(step?.type === "finish") tutorialFinish();
  else if(step?.requiresAction) tutorialNext();
});

// ---- Profile / Sync ----
function authTypeLabel(){
  if(!Cloud.enabled || !Cloud.user) return "로컬";
  return Cloud.user.is_anonymous ? "게스트" : "구글";
}

function refreshProfileOverlay(){
  const uid = Cloud.user?.id || getUserId();
  const hasSupabase = !!cloudAdapter()?.hasConfig?.();
  const usingSupabase = hasSupabase && !!Cloud.enabled;
  const isGuest = !!Cloud.user?.is_anonymous;
  if(btnSetUserId) btnSetUserId.textContent = hasSupabase ? "Google 로그인" : "Supabase 연결 필요";
  if(btnUseGuest) btnUseGuest.textContent = usingSupabase ? "로그아웃(게스트 전환)" : "게스트 사용";
  if(profileDesc){
    profileDesc.textContent =
      `현재 계정: ${uid}\n` +
      `로그인 타입: ${authTypeLabel()}\n` +
      (hasSupabase
        ? (isGuest
            ? `- 현재 게스트 계정입니다.\n- Google 로그인 시 계정 기반으로 클라우드 저장됩니다.`
            : `- Google 계정 기준으로 클라우드 저장/동기화 중입니다.`)
        : `- Supabase 미설정: 로컬 저장만 사용 중`);
  }
}

btnProfile && (btnProfile.onclick = async ()=>{
  refreshProfileOverlay();
  show(profileOverlay);
  setPaused(true);

  // 열 때도 한번 pull
  await cloudPull();
  updateHUD();
  refreshProfileOverlay();
});
btnCloseProfile && (btnCloseProfile.onclick = ()=>{
  hide(profileOverlay);
  setPaused(false);
});
btnUseGuest && (btnUseGuest.onclick = async ()=>{
  if(Cloud.enabled){
    try{
      const adapter = cloudAdapter();
      const res = await adapter?.signOutToGuest?.();
      if(res?.ok && res?.user?.id){
        Cloud.user = res.user;
        setUserId(res.user.id);
        await cloudPull();
        updateHUD();
        refreshProfileOverlay();
        openInfo("게스트 전환", `게스트 계정으로 전환했어요.\n${res.user.id}`);
        return;
      }
      openInfo("실패", `게스트 전환 실패\n${res?.error || ""}`);
      return;
    }catch(e){
      console.warn('[Cloud] guest switch failed', e);
      openInfo("실패", "게스트 전환에 실패했어요.");
      return;
    }
  }
  setUserId(ROOT.guest);
  refreshProfileOverlay();
  openInfo("게스트", "게스트 프로필로 전환했어요.");
});
btnSetUserId && (btnSetUserId.onclick = async ()=>{
  const adapter = cloudAdapter();
  if(!adapter?.hasConfig?.()){
    openInfo("Supabase 필요", "Google 로그인을 사용하려면 Supabase URL/Anon Key 설정이 필요해요.");
    return;
  }
  markOAuthMergePending();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const res = await adapter.signInWithGoogle(redirectTo);
  if(!res?.ok){
    clearOAuthMergePending();
    openInfo("Google 로그인 실패", res?.error || "로그인을 시작하지 못했어요.");
  }
});

// ---- Shop: hint purchase ----
const SHOP = {
  hint1Cost: 200,
  hint5Cost: 900,
};
function buyHint(count){
  const cost = (count === 1) ? SHOP.hint1Cost : SHOP.hint5Cost;
  if(player.gold < cost){
    toast("코인이 부족해요");
    return;
  }
  player.gold -= cost;
  player.hint += count;
  savePlayerLocal();
  cloudPushDebounced();
  updateHUD();
  toast(`힌트 +${count}`);
}
btnBuyHint1 && (btnBuyHint1.onclick = ()=>buyHint(1));
btnBuyHint5 && (btnBuyHint5.onclick = ()=>buyHint(5));

// ---- Splash tap-to-start ----
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

// ---- Boot ----
async function boot(){
  await cloudInitIfPossible();
  cloudBindAuthListener();

  enterSplash();
  show(loadingOverlay);

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

  btnSound && (btnSound.textContent = `BGM: ${player.soundOn ? "ON" : "OFF"}`);
  btnVibe && (btnVibe.textContent = `진동: ${player.vibeOn ? "ON" : "OFF"}`);
  if(btnLang){
    const langLabel = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
    btnLang.textContent = `언어: ${langLabel}`;
  }
  try{ if(player.soundOn) await bgm?.play?.(); }catch{}

  // OAuth 복귀 직후에는 1회 로컬 진행도를 클라우드로 시드
  await cloudMaybeMergeLocalAfterOAuth();

  // 클라우드 켜져 있으면 시작 시 pull 한번
  await cloudPull();
  updateHUD();

  // 세션 복원(있으면)
  let session = loadSession();
  if(
    session &&
    session.mode === MODE.STAGE &&
    Number(session.stage ?? 1) < Number(player.progressStage || 1)
  ){
    // If another device already progressed further, drop stale local stage session.
    clearSession();
    session = null;
  }
  if(session && session.puzzle && session.mode){
    enableTapToStart();
    const restoreAfterTap = async ()=>{
      if(session.mode === MODE.STAGE){
        await enterStageMode(session.stage ?? 1);
        loadPuzzleToRuntime({
          mode: MODE.STAGE,
          stage: session.stage ?? 1,
          puzzle: session.puzzle,
          restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
        });
        draw(); startLoop();
      }else if(session.mode === MODE.DAILY){
        const pack = getOrCreateDailyPack();
        if(session.dailyDate !== pack.date){
          clearSession();
          enterHome();
          return;
        }
        await enterDailyMode(session.dailyLevel ?? 1);
        loadPuzzleToRuntime({
          mode: MODE.DAILY,
          dailyDate: pack.date,
          dailyLevel: session.dailyLevel ?? 1,
          puzzle: session.puzzle,
          restoreState: { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
        });
        draw(); startLoop();
      }
      window.removeEventListener('pe_after_tap', restoreAfterTap);
    };
    window.addEventListener('pe_after_tap', restoreAfterTap);

    const origEnterHome = enterHome;
    enterHome = function(){
      origEnterHome();
      window.dispatchEvent(new Event('pe_after_tap'));
    };
    return;
  }

  enableTapToStart();
}
boot();

// ---- HUD loop ----
function startHudLoop(){
  startLoop();
}
startHudLoop();
