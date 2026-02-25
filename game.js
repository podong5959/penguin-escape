// PENGUIN ESCAPE v5.2 (Full exchange)
// Fixes requested:
// 1) Home layout: big buttons lower + text centered + nav lower + hide center HOME pill
// 2) Game: board truly centered + bottom icons fill + start from level1 logic + clear popup delay + hide time-decay text
// 3) Cross-device save + leaderboard: Supabase anonymous auth + Postgres sync
// 4) Shop: gold-based hint cost + daily free/ad reward + gold packs
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
const logoSplash = $('logoSplash');

const homeLayer = $('homeLayer');
const gameLayer = $('gameLayer');

const topBar = $('topBar');
const goldPill = $('goldPill');
const goldText = $('goldText');
const btnJam = $('btnJam');
const jamText = $('jamText');
const btnGoldPlus = $('goldPlus');
const modeText = $('modeText');
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
const undoCnt = $('undoCnt');
const bottomBar = $('bottomBar');

let goldDisplayValue = null;
let goldAnimTarget = null;
let goldAnimId = 0;

const toastWrap = $('toast');
const toastText = $('toastText');

const tutorialCoach = $('tutorialCoach');
const tutorialCoachTitle = $('tutorialCoachTitle');
const tutorialCoachDesc = $('tutorialCoachDesc');
const tutorialVisual = $('tutorialVisual');
const btnTutorialPrev = $('btnTutorialPrev');
const btnTutorialSkip = $('btnTutorialSkip');
const btnTutorialAction = $('btnTutorialAction');
const tutorialFocus = $('tutorialFocus');

const privacyCover = $('privacyCover');
const loadingOverlay = $('loadingOverlay');

const gearOverlay = $('gearOverlay');
const gearDesc = $('gearDesc');
const btnSound = $('btnSound');
const btnVibe = $('btnVibe');
const selLang = $('selLang');
const btnPrivacyNotice = $('btnPrivacyNotice');
const btnTutorial = $('btnTutorial');
const btnProfile = $('btnProfile');
const btnGoHome = $('btnGoHome');
const btnCloseGear = $('btnCloseGear');

const shopOverlay = $('shopOverlay');
const btnCloseShop = $('btnCloseShop');
const shopGoldText = $('shopGoldText');
const shopDesc = $('shopDesc');
const btnShopDailyGold = $('btnShopDailyGold');
const btnBuyGold1000 = $('btnBuyGold1000');
const btnBuyGold2000 = $('btnBuyGold2000');
const btnBuyGold3000 = $('btnBuyGold3000');
const btnBuyGold5000 = $('btnBuyGold5000');

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
const profileNicknameValue = $('profileNicknameValue');
const btnEditNickname = $('btnEditNickname');
const btnSetUserId = $('btnSetUserId');
const btnUseGuest = $('btnUseGuest');
const btnCloseProfile = $('btnCloseProfile');
const nicknameEditOverlay = $('nicknameEditOverlay');
const nicknameEditInput = $('nicknameEditInput');
const btnNicknameEditSave = $('btnNicknameEditSave');
const btnCloseNicknameEdit = $('btnCloseNicknameEdit');
const accountLinkOverlay = $('accountLinkOverlay');
const btnLinkGoogle = $('btnLinkGoogle');
const btnCloseAccountLink = $('btnCloseAccountLink');
const loginGateOverlay = $('loginGateOverlay');
const loginGateDesc = $('loginGateDesc');
const loginGateNicknameInput = $('loginGateNicknameInput');
const btnLoginGateSaveNickname = $('btnLoginGateSaveNickname');
const btnLoginGateLinkAccount = $('btnLoginGateLinkAccount');

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
const tutorialClearOverlay = $('tutorialClearOverlay');
const tutorialClearDesc = $('tutorialClearDesc');
const btnTutorialClearNext = $('btnTutorialClearNext');

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
function bindBtn(el, handler, delayMs=90){
  if(!el) return;
  el.onclick = (e)=>{
    if(e?.preventDefault) e.preventDefault();
    setTimeout(()=>handler(e), delayMs);
  };
}
async function withTimeout(promise, ms, label){
  let t;
  try{
    return await Promise.race([
      promise,
      new Promise((_, rej)=>{
        t = setTimeout(()=>rej(new Error(`timeout:${label}`)), ms);
      })
    ]);
  }finally{
    if(t) clearTimeout(t);
  }
}

async function playLogoSplash(){
  if(!logoSplash) return;
  logoSplash.style.display = "flex";
  requestAnimationFrame(()=>logoSplash.classList.add("show"));
  await sleep(250); // fade in
  await sleep(2000); // hold
  logoSplash.classList.remove("show");
  await sleep(250); // fade out
  logoSplash.style.display = "none";
}

function toast(msg){
  if(!toastWrap || !toastText) return;
  if(toast.disabled) return;
  const s = String(msg || "");
  // Only show the "can't move" toast to keep UX clean
  if(!/못\\s*움직여|움직일\\s*수\\s*없어/.test(s)) return;
  toastText.textContent = s;
  toastWrap.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toastWrap.classList.remove('show'), 1400);
}
toast.disabled = false;

function openInfo(title, desc){
  if(infoTitle) infoTitle.textContent = title || "안내";
  if(infoDesc) infoDesc.textContent = desc || "";
  show(infoOverlay);
}
bindBtn(btnInfoOk, () =>hide(infoOverlay));

// ✅ 일일도전 날짜: 모든 디바이스 공통 KST(UTC+9) 기준
function ymdLocal(){
  const shifted = new Date(Date.now() + (9 * 60 * 60000));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth()+1).padStart(2,'0');
  const dd = String(shifted.getUTCDate()).padStart(2,'0');
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
const CACHE_VERSION = 55;
const ASSET_VERSION = "20260210_05";
const DAILY_PACK_VERSION = 3;
const PUZZLE_SEED_VERSION = 3;
const ROOT = { userId: "pe_user_id", guest: "guest" };
const OAUTH_MERGE_PENDING_KEY = "pe_oauth_merge_pending";
const ACCOUNT_LINK_REWARD_KEY = "pe_account_link_reward_claimed";
const ACCOUNT_LINK_PROMPT_STAGE = 20;
const ACCOUNT_LINK_REWARD_GOLD = 300;
const AD_HINT_REWARD_GOLD = 100;

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
  shopDailyGoldClaimDate: "shop_daily_gold_claim_date",
  loginGateSeen: "login_gate_seen",
  accountLinkPromptSeen: "account_link_prompt_seen",
  tutorialDone: "tutorial_done",
  tutorialRewardClaimed: "tutorial_reward_claimed",
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
  hint: 0,

  tutorialDone: loadInt(SAVE.tutorialDone, 0) === 1,
  tutorialRewardClaimed: loadInt(SAVE.tutorialRewardClaimed, 0) === 1,
  soundOn: loadInt(SAVE.sound, 1) === 1,
  vibeOn: loadInt(SAVE.vibe, 1) === 1,
  lang: (()=>{ try{ return localStorage.getItem(nsKey(SAVE.lang)) || "ko"; }catch{ return "ko"; }})(),
};

function savePlayerLocal(){
  saveInt(SAVE.gold, player.gold);
  saveInt(SAVE.gem, player.gem);
  saveInt(SAVE.progressStage, player.progressStage);
  removeKey(SAVE.hint);
  removeKey(SAVE.ingameHintGoldBuys);
  saveInt(SAVE.tutorialDone, player.tutorialDone ? 1 : 0);
  saveInt(SAVE.tutorialRewardClaimed, player.tutorialRewardClaimed ? 1 : 0);
  saveInt(SAVE.sound, player.soundOn ? 1 : 0);
  saveInt(SAVE.vibe, player.vibeOn ? 1 : 0);
  try{ localStorage.setItem(nsKey(SAVE.lang), player.lang); }catch{}
}

function hasSeenLoginGate(){
  return loadInt(SAVE.loginGateSeen, 0) === 1;
}
function markLoginGateSeen(){
  saveInt(SAVE.loginGateSeen, 1);
}
function hasSeenAccountLinkPrompt(){
  return loadInt(SAVE.accountLinkPromptSeen, 0) === 1;
}
function markAccountLinkPromptSeen(){
  saveInt(SAVE.accountLinkPromptSeen, 1);
}
function hasClaimedAccountLinkReward(){
  try{ return localStorage.getItem(ACCOUNT_LINK_REWARD_KEY) === "1"; }catch{ return false; }
}
function markAccountLinkRewardClaimed(){
  try{ localStorage.setItem(ACCOUNT_LINK_REWARD_KEY, "1"); }catch{}
}
function getShopDailyGoldClaimDate(){
  try{ return localStorage.getItem(nsKey(SAVE.shopDailyGoldClaimDate)) || ""; }catch{ return ""; }
}
function setShopDailyGoldClaimDate(dateKey){
  try{ localStorage.setItem(nsKey(SAVE.shopDailyGoldClaimDate), dateKey); }catch{}
}

// ---- Supabase Sync ----
const Cloud = {
  enabled: false,
  pushTimer: null,
  ready: false,
  user: null,
  profileName: "",
  profileLoaded: false,
  authUnsub: null,
  pulling: false,
};

function cloudAdapter(){
  return window.PE_SUPABASE || null;
}

function adsAdapter(){
  return window.PE_ADS || null;
}

async function adsInit(){
  const ads = adsAdapter();
  if(!ads) return;
  ads.setConfig?.({
    enabled: true,
    platform: "web",
    testMode: true,
    nonPersonalizedOnly: true,
  });
  try{ await ads.ensureInit?.(); }catch{}
}

async function maybeShowInterstitialOnClear(){
  const ads = adsAdapter();
  if(!ads) return false;
  if(!ads.shouldShowInterstitialOnClear?.()) return false;
  const res = await ads.showInterstitial?.("stage_clear");
  return !!res?.ok;
}

async function tryRewardedAd(placement){
  const ads = adsAdapter();
  if(!ads) return { ok:false, rewarded:false, reason:"adapter_missing" };
  const res = await ads.showRewarded?.(placement);
  return {
    ok: !!res?.ok,
    rewarded: !!res?.rewarded,
    reason: res?.reason || null,
  };
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
    Cloud.profileLoaded = false;
    Cloud.profileName = "";
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
    const prevUser = Cloud.user;
    Cloud.user = user || null;
    Cloud.enabled = !!user;
    Cloud.ready = true;
    Cloud.profileLoaded = false;
    Cloud.profileName = "";
    if(user?.id){
      setUserId(user.id);
      await cloudMaybeMergeLocalAfterOAuth();
      await cloudPull();
      await maybeAwardAccountLinkReward(prevUser, user);
      updateHUD();
      if(runtime.mode === MODE.HOME){
        await maybeShowInitialLoginGate();
      }
    }
  });
}

async function maybeAwardAccountLinkReward(prevUser, nextUser){
  const wasGuest = !!prevUser?.is_anonymous;
  const isLinked = !!nextUser && !nextUser.is_anonymous;
  if(!wasGuest || !isLinked) return false;
  if(hasClaimedAccountLinkReward()) return false;

  player.gold += ACCOUNT_LINK_REWARD_GOLD;
  savePlayerLocal();
  cloudPushDebounced();
  markAccountLinkRewardClaimed();
  updateHUD();
  openInfo("계정연동 보상", `Google 계정 연동 완료!\n보상 ${ACCOUNT_LINK_REWARD_GOLD} 코인을 받았어요.`);
  return true;
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
        hint: 0,
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
        hint: 0,
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
  hintUsedThisMove: false,
  clearReward: null,
  paused:false,
};

const DIRS = [{x: 1, y: 0}, {x:-1, y: 0}, {x: 0, y: 1}, {x: 0, y:-1}];
const DIR_NAME_KO = ["오른쪽", "왼쪽", "아래", "위"];

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
const TUTORIAL_STAGE_PUZZLES = {
  stage1: {
    // 한 번에 골인
    W: 5,
    blocks: [[3,2]],
    penguins: [
      [0,2], // hero
      [4,4],
      [0,0],
      [4,0],
    ],
  },
  stage2: {
    // 펭귄 상호작용으로 멈추고 골인
    W: 5,
    blocks: [],
    penguins: [
      [0,2], // hero
      [3,2], // stopper penguin
      [4,4],
      [0,4],
    ],
  },
  stage3: {
    // 그냥 지나가면 클리어 안 되고, 스토퍼를 만들어야 클리어
    W: 5,
    blocks: [[4,2], [3,3]],
    penguins: [
      [1,2], // hero
      [3,0], // move down to become stopper at (3,2)
      [0,2], // left-side stopper to recover hero safely
      [4,4],
    ],
  },
};

const TUTORIAL = {
  active: false,
  step: 0,
  stepArmed: false,
  cardModal: false,
  blockedToastAt: 0,
  blockedReason: "",
  allowClear: false,
  steps: [
    {
      id: "intro_goal",
      title: "튜토리얼",
      desc: "주인공 펭귄이 골인지점에 도달하면 스테이지 클리어예요.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "다음",
      visual: "hero_goal",
    },
    {
      id: "intro_pass_goal",
      title: "튜토리얼",
      desc: "골인지점은 지나가면 안 돼요.\n정확히 골인지점에서 멈춰야 합니다.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "다음",
      visual: "pass_demo",
    },
    {
      id: "intro_clear_exact",
      title: "튜토리얼",
      desc: "이렇게 장애물을 스토퍼로 써서 골인지점에 정확히 도달해야 클리어예요.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "다음",
      visual: "clear_exact",
    },
    {
      id: "intro_fall",
      title: "튜토리얼",
      desc: "맵 끝으로 나가면 바다로 빠져서 실패하게 됩니다.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "다음",
      visual: "fall_demo",
    },
    {
      id: "intro_collision",
      title: "튜토리얼",
      desc: "펭귄끼리 부딪히면 상호작용되어 멈춥니다.\n이걸 스토퍼로 활용할 수 있어요.",
      type: "confirm",
      requiresAction: true,
      actionLabel: "체험 시작",
      visual: "collide_demo",
    },
    {
      id: "stage1_play",
      title: "체험 1/3",
      desc: "주인공을 골인지점으로 보내세요.",
      type: "clear",
      allowAnyMove: true,
      visual: "clear_exact",
      showClearPopup: true,
      clearDesc: "체험 1/3 클리어!\n다음 체험으로 이동합니다.",
      clearNextLabel: "다음",
      onStart: ()=>{
        loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_STAGE_PUZZLES.stage1 });
      },
    },
    {
      id: "stage2_play",
      title: "체험 2/3",
      desc: "주인공을 오른쪽으로 밀어 펭귄과 부딪혀 멈춘 뒤 클리어하세요.",
      type: "clear",
      allowAnyMove: true,
      visual: "collide_demo",
      showClearPopup: true,
      clearDesc: "체험 2/3 클리어!\n마지막 체험으로 이동합니다.",
      clearNextLabel: "다음",
      onStart: ()=>{
        loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_STAGE_PUZZLES.stage2 });
      },
    },
    {
      id: "stage3_play",
      title: "체험 3/3",
      desc: "스토퍼를 만든 뒤 주인공을 골인지점에 정확히 멈추세요.",
      type: "clear",
      allowAnyMove: true,
      visual: "pass_demo",
      onStart: ()=>{
        loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_STAGE_PUZZLES.stage3 });
        runtime.hintPenguinIndex = 1;
        runtime.hintActive = true;
        runtime.hintUsedThisMove = false;
        draw();
      },
    },
    {
      id: "done",
      title: "완료!",
      desc: "튜토리얼 완료 보상: 200 골드\n최초 1회만 지급됩니다.",
      type: "finish",
      actionLabel: "보상 받기",
      hideVisual: true,
    }
  ],
};

function tutorialCurrentStep(){
  return TUTORIAL.steps[TUTORIAL.step] || null;
}
function tutorialShowCoach(showIt){
  if(!tutorialCoach) return;
  tutorialCoach.classList.toggle("show", !!showIt);
  if(!showIt) stopTutorialVisualAnim();
}
function tutorialPulse(el, on){
  if(!el) return;
  el.classList.toggle("pulse", !!on);
}
let tutorialFocusedEl = null;
function refreshTutorialFocusLayer(){
  if(!tutorialFocus) return;
  const showSpotlight = !!tutorialFocusedEl && !TUTORIAL.cardModal;
  const showLayer = !!TUTORIAL.cardModal || showSpotlight;
  tutorialFocus.classList.toggle("show", showLayer);
  tutorialFocus.classList.toggle("cardOnly", !!TUTORIAL.cardModal);
  if(bottomBar) bottomBar.classList.toggle("tutorialFocusRaise", showSpotlight);
}
function getTutorialFocusVars(){
  const rect = tutorialFocusedEl.getBoundingClientRect();
  const vv = window.visualViewport;
  const offsetLeft = vv?.offsetLeft || 0;
  const offsetTop = vv?.offsetTop || 0;
  const cx = rect.left + rect.width/2 - offsetLeft;
  const cy = rect.top + rect.height/2 - offsetTop;
  const r = Math.max(rect.width, rect.height) * 0.65;
  return { cx, cy, r };
}
function applyTutorialFocusVars(vars){
  tutorialFocus.style.setProperty('--focus-x', `${vars.cx}px`);
  tutorialFocus.style.setProperty('--focus-y', `${vars.cy}px`);
  tutorialFocus.style.setProperty('--focus-r', `${vars.r}px`);
}
function updateTutorialFocusMask(zoomIn=false){
  if(!tutorialFocus || !tutorialFocusedEl || TUTORIAL.cardModal) return;
  const vars = getTutorialFocusVars();
  if(zoomIn){
    applyTutorialFocusVars({ cx: vars.cx, cy: vars.cy, r: vars.r * 1.7 });
    requestAnimationFrame(()=>applyTutorialFocusVars(vars));
  }else{
    applyTutorialFocusVars(vars);
  }
}
function tutorialSetCardModal(on){
  TUTORIAL.cardModal = !!on;
  if(TUTORIAL.cardModal){
    if(tutorialFocusedEl) tutorialFocusedEl.classList.remove("tutorialFocusTarget");
    refreshTutorialFocusLayer();
    return;
  }
  if(tutorialFocusedEl) tutorialFocusedEl.classList.add("tutorialFocusTarget");
  refreshTutorialFocusLayer();
  if(tutorialFocusedEl){
    updateTutorialFocusMask(true);
    requestAnimationFrame(()=>updateTutorialFocusMask());
  }
}
function playMoveSfx(){
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
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }catch{}
}
function tutorialFocusOn(el){
  if(tutorialFocusedEl) tutorialFocusedEl.classList.remove("tutorialFocusTarget");
  tutorialFocusedEl = el || null;
  if(tutorialFocusedEl && !TUTORIAL.cardModal) tutorialFocusedEl.classList.add("tutorialFocusTarget");
  refreshTutorialFocusLayer();
  if(tutorialFocusedEl && !TUTORIAL.cardModal){
    updateTutorialFocusMask(true);
    requestAnimationFrame(()=>updateTutorialFocusMask());
    requestAnimationFrame(()=>updateTutorialFocusMask());
  }
}
let tutorialVisualAnimRaf = 0;
function stopTutorialVisualAnim(){
  if(tutorialVisualAnimRaf){
    cancelAnimationFrame(tutorialVisualAnimRaf);
    tutorialVisualAnimRaf = 0;
  }
}
function tutorialVisualMarkup(step){
  return `
    <canvas class="tvCanvas" aria-hidden="true"></canvas>
  `;
}
function drawImageCoverTo(targetCtx, img, x, y, w, h){
  if(!targetCtx || !img) return false;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if(iw <= 0 || ih <= 0) return false;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  targetCtx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  return true;
}
function drawTutorialMiniTile(ctx, x, y, s, pulse=0){
  const r = s * 0.16;
  const tileImg = ASSETS.board.ice.img;
  ctx.save();
  roundRect(ctx, x, y, s, s, r);
  ctx.clip();
  if(tileImg){
    ctx.globalAlpha = 0.58;
    drawImageCoverTo(ctx, tileImg, x, y, s, s);
    ctx.globalAlpha = 1;
    const sheen = ctx.createLinearGradient(x, y, x, y + s);
    sheen.addColorStop(0, "rgba(228,244,255,0.28)");
    sheen.addColorStop(1, "rgba(190,226,246,0.14)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, s, s);
  }else{
    const g = ctx.createLinearGradient(x, y, x, y + s);
    g.addColorStop(0, "rgba(222,243,255,0.98)");
    g.addColorStop(1, "rgba(181,225,247,0.98)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(118,194,232,0.84)";
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  roundRect(ctx, x, y, s, s, r);
  ctx.stroke();

  if(pulse > 0){
    ctx.fillStyle = `rgba(255,228,92,${(0.22 + pulse * 0.42).toFixed(3)})`;
    roundRect(ctx, x + s*0.08, y + s*0.08, s*0.84, s*0.84, r*0.75);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,248,182,${(0.35 + pulse * 0.5).toFixed(3)})`;
    ctx.lineWidth = Math.max(1.2, s * 0.03);
    roundRect(ctx, x + s*0.08, y + s*0.08, s*0.84, s*0.84, r*0.75);
    ctx.stroke();
  }
}
function drawTutorialMiniGoal(ctx, x, y, s){
  const img = ASSETS.piece.goal.img;
  if(img && drawImageCoverTo(ctx, img, x, y, s, s)){
    return;
  }
  const cx = x + s * 0.5;
  const cy = y + s * 0.52;
  const bodyW = s * 0.42;
  const bodyH = s * 0.24;
  ctx.fillStyle = "rgba(255,183,72,.96)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - bodyW * 0.52, cy);
  ctx.lineTo(cx - bodyW * 0.83, cy - bodyH * 0.34);
  ctx.lineTo(cx - bodyW * 0.83, cy + bodyH * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(34,52,78,.88)";
  ctx.beginPath();
  ctx.arc(cx + bodyW * 0.2, cy - bodyH * 0.08, Math.max(1.2, s * 0.035), 0, Math.PI * 2);
  ctx.fill();
}
function drawTutorialMiniRock(ctx, x, y, s){
  const img = ASSETS.piece.rock.img;
  if(img && drawImageCoverTo(ctx, img, x, y, s, s)){
    return;
  }
  ctx.fillStyle = "rgba(12,16,22,.82)";
  roundRect(ctx, x + s*0.16, y + s*0.16, s*0.68, s*0.68, s*0.16);
  ctx.fill();
}
function tutorialFrameAt(def, elapsedMs){
  const frames = def?.frames || [5];
  const durations = def?.durations || [120];
  const total = durations.reduce((a,b)=>a + (b || 0), 0) || 1;
  let t = elapsedMs % total;
  for(let i=0;i<frames.length;i++){
    t -= (durations[i] || 0);
    if(t <= 0) return frames[i];
  }
  return frames[frames.length - 1];
}
function drawTutorialMiniPenguin(ctx, {
  x, y, size, isHero=false, sheet=1, frame=5, flipX=false, alpha=1
}){
  const img = getPenguinSheetImage(isHero, sheet) || penguinFallbackImageByIndex(isHero ? 0 : 1);
  if(!img) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + size/2, y + size/2);
  ctx.scale(flipX ? -1 : 1, 1);
  const d = size * 0.96;
  if(img === ASSETS.piece.peng0.img || img === ASSETS.piece.peng1.img || img === ASSETS.piece.peng2.img || img === ASSETS.piece.peng3.img){
    ctx.drawImage(img, -d/2, -d/2, d, d);
  }else{
    const r = frameRectByNumber(img, frame);
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, -d/2, -d/2, d, d);
  }
  ctx.restore();
}
function drawTutorialFinger(ctx, x, y, t, dir="right"){
  const phase = (t % 1800) / 1800;
  let tx = x;
  let ty = y;
  let alpha = 1;
  if(dir === "right"){
    const p = phase < 0.4 ? phase / 0.4 : 1;
    tx += 64 * p;
    alpha = phase > 0.65 ? Math.max(0, 1 - (phase - 0.65) / 0.35) : 1;
  }else if(dir === "down"){
    const p = phase < 0.4 ? phase / 0.4 : 1;
    ty += 56 * p;
    alpha = phase > 0.65 ? Math.max(0, 1 - (phase - 0.65) / 0.35) : 1;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.strokeStyle = "rgba(255,255,255,.88)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tx, ty, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function tutorialVisualScenario(step){
  const key = step?.visual || "hero_goal";
  if(key === "pass_demo"){
    return {
      key,
      heroStart: 0,
      goal: 2,
      rocks: [4],
      others: [],
      moveDir: 1,
      caption: "골인지점을 지나치면 실패",
    };
  }
  if(key === "clear_exact"){
    return {
      key,
      heroStart: 0,
      goal: 2,
      rocks: [3],
      others: [],
      moveDir: 1,
      caption: "정확히 골인지점에서 멈추면 클리어",
    };
  }
  if(key === "fall_demo"){
    return {
      key,
      heroStart: 0,
      goal: null,
      rocks: [],
      others: [],
      moveDir: 1,
      caption: "맵 밖으로 나가면 실패",
    };
  }
  if(key === "collide_demo"){
    return {
      key,
      heroStart: 0,
      goal: null,
      rocks: [],
      others: [4],
      moveDir: 1,
      caption: "펭귄과 부딪히면 멈춤",
    };
  }
  return {
    key: "hero_goal",
    heroStart: 0,
    goal: 2,
    rocks: [],
    others: [],
    moveDir: 0,
    caption: "주인공과 골인지점을 먼저 확인하세요",
  };
}
function runTutorialMiniSimulation(scene){
  const W = 5;
  const from = clamp(Number(scene.heroStart) || 0, 0, W - 1);
  const dir = scene.moveDir >= 0 ? 1 : -1;
  let x = from;
  let passedGoal = false;
  const rockSet = new Set(scene.rocks || []);
  const otherSet = new Set(scene.others || []);
  const goal = Number.isInteger(scene.goal) ? scene.goal : null;

  while(true){
    const nx = x + dir;
    if(nx < 0 || nx >= W){
      if(goal != null && ((dir > 0 && x < goal) || (dir < 0 && x > goal))){
        passedGoal = true;
      }
      return {
        from,
        to: x,
        edge: x,
        outX: nx,
        type: "fall",
        passedGoal,
        moveCells: Math.abs(x - from),
        blockedCell: null,
      };
    }

    if(goal != null && ((dir > 0 && x < goal && goal <= nx) || (dir < 0 && x > goal && goal >= nx))){
      passedGoal = true;
    }
    if(rockSet.has(nx)){
      return {
        from,
        to: x,
        edge: x,
        outX: x,
        type: "rock_stop",
        passedGoal,
        moveCells: Math.abs(x - from),
        blockedCell: nx,
      };
    }
    if(otherSet.has(nx)){
      return {
        from,
        to: x,
        edge: x,
        outX: x,
        type: "penguin_stop",
        passedGoal,
        moveCells: Math.abs(x - from),
        blockedCell: nx,
      };
    }
    x = nx;
  }
}
function tutorialMiniOutcome(scene, result){
  if(result.type === "fall"){
    return { text: "결과: 아웃 실패", color: "rgba(255,130,130,.98)" };
  }
  if(scene.goal != null && result.to === scene.goal){
    return { text: "결과: 정확 도달, 클리어", color: "rgba(136,246,176,.98)" };
  }
  if(scene.goal != null && result.passedGoal){
    return { text: "결과: 골을 지나쳐 실패", color: "rgba(255,188,132,.98)" };
  }
  if(result.type === "penguin_stop"){
    return { text: "결과: 펭귄 충돌로 정지", color: "rgba(148,212,255,.98)" };
  }
  return { text: "결과: 정지", color: "rgba(230,238,246,.92)" };
}
function drawTutorialArrow(ctx, x0, y0, x1, y1){
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const head = 9;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.84)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(angle - Math.PI / 7), y1 - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(x1 - head * Math.cos(angle + Math.PI / 7), y1 - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function renderTutorialVisualCanvas(step, canvas, elapsedMs){
  const ctx = canvas.getContext("2d");
  if(!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(280, Math.floor(rect.width * dpr));
  const h = Math.max(120, Math.floor(rect.height * dpr));
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w;
    canvas.height = h;
  }
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.scale(dpr, dpr);
  const cw = w / dpr;
  const ch = h / dpr;
  const heroLeftBias = clamp(cw * 0.02, 4, 8);
  const boardRightShift = clamp(cw * 0.012, 2, 5);
  const scene = tutorialVisualScenario(step);
  const result = runTutorialMiniSimulation(scene);

  if(scene.key === "hero_goal"){
    const size = Math.min(ch * 0.66, 78);
    const centerY = ch * 0.5;
    const trackW = Math.min(cw - 28, 340);
    const trackX = Math.max(2, (cw - trackW) * 0.5 - heroLeftBias);
    const heroX = trackX;
    const goalX = trackX + trackW - size;
    const arrowPad = Math.max(12, Math.min(22, size * 0.32));
    drawTutorialMiniPenguin(ctx, {
      x: heroX,
      y: centerY - size * 0.5,
      size,
      isHero: true,
      sheet: 1,
      frame: 5,
    });
    drawTutorialMiniGoal(ctx, goalX, centerY - size * 0.5, size);
    drawTutorialArrow(ctx, heroX + size + arrowPad, centerY, goalX - arrowPad, centerY);
    ctx.restore();
    return;
  }

  const boardW = Math.min(cw - 24, 340);
  const cell = boardW / 5;
  const boardX = Math.max(2, (cw - boardW) * 0.5 + boardRightShift);
  const boardY = ch * 0.44 - cell * 0.5;
  const idleMs = 520;
  const swipeMs = 240;
  const slideCells = Math.max(0, result.moveCells || 0);
  const slideMs = result.type === "fall"
    ? (slideCells > 0 ? clamp(140 + slideCells * 95, 300, 1200) : 0)
    : clamp(140 + Math.max(1, slideCells) * 95, 320, 980);
  const splashMs = result.type === "fall" ? 320 : 0;
  const settleMs = 860;
  const cycleMs = idleMs + swipeMs + slideMs + splashMs + settleMs;
  const phase = elapsedMs % Math.max(1, cycleMs);
  const phaseSwipeStart = idleMs;
  const phaseSlideStart = phaseSwipeStart + swipeMs;
  const phaseSlideEnd = phaseSlideStart + slideMs;
  const phaseSplashEnd = phaseSlideEnd + splashMs;

  let heroX = scene.heroStart ?? 0;
  let heroY = 0;
  let heroAlpha = 1;
  let heroSheet = 1;
  let heroFrame = 5;
  let otherSheet = 1;
  let otherFrame = 5;

  if(phase < phaseSwipeStart){
    heroFrame = 5;
  }else if(phase < phaseSlideStart){
    heroSheet = PENG_ANIM_DEF.dragStart.sheet;
    heroFrame = tutorialFrameAt(PENG_ANIM_DEF.dragStart, phase - phaseSwipeStart);
  }else if(phase < phaseSlideEnd){
    const k = slideMs > 0 ? clamp((phase - phaseSlideStart) / slideMs, 0, 1) : 1;
    const e = 1 - Math.pow(1 - k, 3);
    heroX = (scene.heroStart ?? 0) + (result.to - (scene.heroStart ?? 0)) * e;
    heroSheet = PENG_ANIM_DEF.slideX.sheet;
    heroFrame = tutorialFrameAt(PENG_ANIM_DEF.slideX, phase - phaseSlideStart);
  }else if(result.type === "fall" && phase < phaseSplashEnd){
    const k = splashMs > 0 ? clamp((phase - phaseSlideEnd) / splashMs, 0, 1) : 1;
    const e = 1 - Math.pow(1 - k, 2.2);
    const outX = result.outX + 0.12;
    heroX = result.edge + (outX - result.edge) * e;
    heroY = 0.74 * e;
    heroAlpha = 1 - 0.35 * e;
    heroSheet = PENG_ANIM_DEF.fallOut.sheet;
    heroFrame = tutorialFrameAt(PENG_ANIM_DEF.fallOut, phase - phaseSlideEnd);
  }else{
    const holdElapsed = Math.max(0, phase - phaseSplashEnd);
    if(result.type === "fall"){
      heroX = result.outX + 0.12;
      heroY = 0.74;
      heroSheet = PENG_ANIM_DEF.fallOut.sheet;
      heroFrame = tutorialFrameAt(PENG_ANIM_DEF.fallOut, holdElapsed);
      heroAlpha = 0.65;
    }else if(scene.goal != null && result.to === scene.goal){
      heroX = result.to;
      heroSheet = PENG_ANIM_DEF.clearHero.sheet;
      heroFrame = tutorialFrameAt(PENG_ANIM_DEF.clearHero, holdElapsed);
    }else if(result.type === "rock_stop" || result.type === "penguin_stop"){
      heroX = result.to;
      heroSheet = PENG_ANIM_DEF.collision1.sheet;
      heroFrame = tutorialFrameAt(PENG_ANIM_DEF.collision1, holdElapsed);
      if(result.type === "penguin_stop"){
        otherSheet = PENG_ANIM_DEF.collision2.sheet;
        otherFrame = tutorialFrameAt(PENG_ANIM_DEF.collision2, holdElapsed);
      }
    }else{
      heroX = result.to;
      heroSheet = 1;
      heroFrame = 5;
    }
  }

  for(let i=0;i<5;i++){
    drawTutorialMiniTile(ctx, boardX + i * cell, boardY, cell - 3, 0);
  }

  if(Number.isInteger(scene.goal)){
    drawTutorialMiniGoal(ctx, boardX + scene.goal * cell, boardY, cell - 3);
  }
  for(const r of scene.rocks || []){
    drawTutorialMiniRock(ctx, boardX + r * cell, boardY, cell - 3);
  }
  for(const p of scene.others || []){
    drawTutorialMiniPenguin(ctx, {
      x: boardX + p * cell + 4,
      y: boardY + 4,
      size: cell - 11,
      isHero: false,
      sheet: otherSheet,
      frame: otherFrame,
      flipX: true,
    });
  }

  const fingerStartAt = phaseSwipeStart * 0.58;
  const fingerEndAt = phaseSlideStart + Math.max(140, slideMs * 0.32);
  if(phase >= fingerStartAt && phase < fingerEndAt){
    drawTutorialFinger(ctx, boardX + cell * 0.23, boardY + cell * 0.86, phase - fingerStartAt, "right");
  }

  drawTutorialMiniPenguin(ctx, {
    x: boardX + heroX * cell + 4,
    y: boardY + heroY * cell + 4,
    size: cell - 11,
    isHero: true,
    sheet: heroSheet,
    frame: heroFrame,
    alpha: heroAlpha,
  });

  ctx.restore();
}
function startTutorialVisualAnim(step){
  if(!tutorialVisual) return;
  stopTutorialVisualAnim();
  const canvas = tutorialVisual.querySelector(".tvCanvas");
  if(!canvas) return;
  let started = 0;
  const tick = (ts)=>{
    if(!started) started = ts;
    renderTutorialVisualCanvas(step, canvas, ts - started);
    tutorialVisualAnimRaf = requestAnimationFrame(tick);
  };
  tutorialVisualAnimRaf = requestAnimationFrame(tick);
}
function tutorialUpdateCoach(){
  const step = tutorialCurrentStep();
  if(!step) return;
  const needsArm = !!step.armWithAction && !TUTORIAL.stepArmed;
  const coachVisible = step.type === "finish" || step.requiresAction || needsArm;
  if(tutorialCoachTitle) tutorialCoachTitle.textContent = step.title || "튜토리얼";
  if(tutorialCoachDesc) tutorialCoachDesc.textContent = step.desc || "";
  if(tutorialVisual){
    const hideVisual = !!step?.hideVisual;
    tutorialVisual.style.display = hideVisual ? "none" : "block";
    if(hideVisual){
      stopTutorialVisualAnim();
      tutorialVisual.innerHTML = "";
    }else{
      const visualClass = step?.visual || "default";
      tutorialVisual.className = `tutorialVisual canvasMode ${visualClass}`;
      tutorialVisual.innerHTML = tutorialVisualMarkup(step);
      if(coachVisible) startTutorialVisualAnim(step);
      else stopTutorialVisualAnim();
    }
  }
  if(btnTutorialAction){
    const showAction = coachVisible;
    btnTutorialAction.style.display = showAction ? "block" : "none";
    if(showAction){
      if(step.type === "finish"){
        btnTutorialAction.textContent = step.actionLabel || "홈으로";
      }else if(needsArm){
        btnTutorialAction.textContent = step.actionLabel || "다음";
      }else{
        btnTutorialAction.textContent = step.actionLabel || "다음";
      }
    }
  }
  if(btnTutorialPrev){
    const showPrev = coachVisible && step.type !== "finish";
    const canPrev = TUTORIAL.step > 0;
    btnTutorialPrev.style.display = showPrev ? "block" : "none";
    btnTutorialPrev.disabled = !canPrev;
    btnTutorialPrev.classList.toggle("disabledBtn", !canPrev);
  }
  if(btnTutorialSkip){
    const showSkip = step.type !== "finish";
    btnTutorialSkip.style.display = showSkip ? "inline-flex" : "none";
  }
  tutorialPulse(btnUndo, !coachVisible && step.type === "undo" && TUTORIAL.stepArmed);
  tutorialPulse(btnHint, !coachVisible && step.type === "hint" && TUTORIAL.stepArmed);
  tutorialShowCoach(coachVisible);
  tutorialSetCardModal(coachVisible);
  if(coachVisible){
    tutorialFocusOn(null);
    return;
  }
  if(step.type === "undo") tutorialFocusOn(btnUndo);
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
  TUTORIAL.stepArmed = !step?.armWithAction;
  TUTORIAL.cardModal = false;
  TUTORIAL.blockedReason = "";
  TUTORIAL.allowClear = step?.type === "clear";
  step?.onStart?.();
  tutorialUpdateCoach();
  draw();
}
function tutorialNext(){
  if(TUTORIAL.step >= TUTORIAL.steps.length-1) return;
  tutorialSetStep(TUTORIAL.step + 1);
}
function tutorialPrev(){
  if(TUTORIAL.step <= 0) return;
  tutorialSetStep(TUTORIAL.step - 1);
}
function tutorialFinish({ completed = false } = {}){
  TUTORIAL.active = false;
  TUTORIAL.allowClear = false;
  TUTORIAL.cardModal = false;
  tutorialShowCoach(false);
  tutorialSetCardModal(false);
  tutorialFocusOn(null);
  tutorialPulse(btnUndo, false);
  tutorialPulse(btnHint, false);
  let rewardGranted = 0;
  if(completed && !player.tutorialRewardClaimed){
    rewardGranted = 200;
    player.gold += rewardGranted;
    player.tutorialRewardClaimed = true;
  }
  player.tutorialDone = true;
  savePlayerLocal();
  cloudPushDebounced();
  clearSession();
  enterHome();
  if(rewardGranted > 0) toast(`튜토리얼 완료 보상 +${rewardGranted} 골드`);
  else toast("튜토리얼 완료!");
}
function tutorialSkip(){
  tutorialFinish({ completed: false });
}
function tutorialStart(){
  TUTORIAL.active = true;
  TUTORIAL.step = 0;
  TUTORIAL.stepArmed = false;
  TUTORIAL.cardModal = false;
  TUTORIAL.blockedToastAt = 0;
  TUTORIAL.blockedReason = "";
  TUTORIAL.allowClear = false;
  tutorialFocusOn(null);
  hideAllOverlays();
  setPaused(false);
  enterTutorial();
}
function dirNameByVector(dir){
  if(!dir) return "";
  if(dir.x === 1 && dir.y === 0) return "오른쪽";
  if(dir.x === -1 && dir.y === 0) return "왼쪽";
  if(dir.x === 0 && dir.y === 1) return "아래";
  if(dir.x === 0 && dir.y === -1) return "위";
  return "";
}
function tutorialAllowMove(index, dir){
  const step = tutorialCurrentStep();
  TUTORIAL.blockedReason = "";
  if(!step){
    TUTORIAL.blockedReason = "튜토리얼 안내를 따라 진행해 주세요";
    return false;
  }
  if(step.armWithAction && !TUTORIAL.stepArmed){
    TUTORIAL.blockedReason = "먼저 안내 카드의 버튼을 눌러 주세요";
    return false;
  }
  if(step.id === "stage3_play"){
    const expectedByMove = [1, 0];
    const expectedPenguin = expectedByMove[Math.min(runtime.moves, expectedByMove.length - 1)];
    if(index !== expectedPenguin){
      const msg = "그 펭귄이 아니에요! 어떤 펭귄을 움직여야하는지 알려드릴게요!";
      TUTORIAL.blockedReason = msg;
      TUTORIAL.blockedToastAt = nowMs();
      toast(msg);
      loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_STAGE_PUZZLES.stage3 });
      runtime.hintPenguinIndex = 1;
      runtime.hintActive = true;
      runtime.hintUsedThisMove = false;
      draw();
      return false;
    }
  }
  if(step.type === "clear" && step.allowAnyMove) return true;
  if(step.type !== "move" && step.type !== "fall_off"){
    TUTORIAL.blockedReason = "안내 카드의 버튼을 눌러 다음 단계로 진행해 주세요";
    return false;
  }
  if(index !== step.penguin){
    TUTORIAL.blockedReason =
      step.penguin === 0
        ? "지금은 주인공(왕관 표시)을 움직여 주세요"
        : "지금은 안내된 펭귄을 움직여 주세요";
    return false;
  }
  if(!step.dir) return true;
  if(!dir || dir.x !== step.dir.x || dir.y !== step.dir.y){
    const dirName = dirNameByVector(step.dir);
    TUTORIAL.blockedReason = dirName
      ? `지금은 ${dirName}쪽으로 밀어 주세요`
      : "안내된 방향으로 밀어 주세요";
    return false;
  }
  return true;
}
function tutorialBlocked(){
  const t = nowMs();
  if(t - TUTORIAL.blockedToastAt > 700){
    TUTORIAL.blockedToastAt = t;
    toast(TUTORIAL.blockedReason || "지금은 안내대로 해주세요");
  }
}
function openTutorialClearOverlay(step){
  if(!tutorialClearOverlay) return;
  if(tutorialClearDesc) tutorialClearDesc.textContent = step?.clearDesc || "클리어 성공!";
  if(btnTutorialClearNext){
    btnTutorialClearNext.textContent = step?.clearNextLabel || "다음";
  }
  show(tutorialClearOverlay);
  setPaused(true);
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
  if(step.type !== "move") return;
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

// ---- Difficulty ----
const DAILY_ROTATION_TABLE = {
  A: [5, 6, 7],
  B: [5, 8, 9],
  C: [5, 8, 10],
};

function difficultySpecFromTarget(targetDifficulty){
  const d = clamp(Math.round(Number(targetDifficulty) || 1), 1, 10);
  const min = clamp(d + 1, 2, 11);
  const max = clamp(min + 1, 3, 12);
  return { W: 5, min, max };
}

function stageDifficultyProfile(stage){
  const safeStage = Math.max(1, Number(stage) || 1);
  if(safeStage <= 20){
    return { options: [1, 2, 3], weights: [50, 30, 20] };
  }

  // After onboarding, alternate steeper and gentler rise sections.
  const anchors = [
    { stage: 21, center: 2.2, sigma: 1.20 },
    { stage: 220, center: 5.2, sigma: 1.10 },  // steep
    { stage: 620, center: 6.0, sigma: 1.45 },  // gentle
    { stage: 1100, center: 7.4, sigma: 1.15 }, // steep
    { stage: 2300, center: 8.0, sigma: 1.60 }, // gentle
    { stage: 4200, center: 8.6, sigma: 1.25 }, // steep
    { stage: 9999, center: 8.9, sigma: 1.85 }, // gentle tail
  ];

  let left = anchors[0];
  let right = anchors[anchors.length - 1];
  for(let i=0; i<anchors.length - 1; i++){
    const a = anchors[i];
    const b = anchors[i + 1];
    if(safeStage >= a.stage && safeStage <= b.stage){
      left = a;
      right = b;
      break;
    }
  }
  const span = Math.max(1, right.stage - left.stage);
  const t = clamp((safeStage - left.stage) / span, 0, 1);
  const center = left.center + (right.center - left.center) * t;
  const sigma = left.sigma + (right.sigma - left.sigma) * t;
  const options = [];
  const weights = [];

  const baseWeight = 4;
  for(let d=1; d<=10; d++){
    const dist = d - center;
    const bell = Math.exp(-(dist * dist) / (2 * sigma * sigma));
    const w = baseWeight + Math.round(bell * 1000);
    options.push(d);
    weights.push(Math.max(0, w));
  }
  return { options, weights };
}

function pickWeightedOption(seedStr, options, weights){
  if(!Array.isArray(options) || !options.length) return null;
  const total = weights.reduce((acc, v)=>acc + Math.max(0, Number(v) || 0), 0);
  if(total <= 0) return options[0];
  const rng = makeRng(seedStr);
  let roll = rng.int(1, total);
  for(let i=0; i<options.length; i++){
    const w = Math.max(0, Number(weights[i]) || 0);
    roll -= w;
    if(roll <= 0) return options[i];
  }
  return options[options.length - 1];
}

function stageTargetDifficulty(stage){
  const safeStage = Math.max(1, Number(stage) || 1);
  const plan = stageDifficultyProfile(safeStage);
  const picked = pickWeightedOption(
    `stage-target:v${PUZZLE_SEED_VERSION}:stage:${safeStage}`,
    plan.options,
    plan.weights
  );

  // Keep stage 1~100 free from 7+ spikes.
  if(safeStage <= 100){
    return Math.min(6, Number(picked) || 6);
  }

  // Keep one guaranteed "spike" slot per 10 stages after stage 100.
  if(safeStage > 100){
    const blockIndex = Math.floor((safeStage - 101) / 10);
    const spikeOffset = fnv1a(`stage-seven-spike:v${PUZZLE_SEED_VERSION}:block:${blockIndex}`) % 10;
    const inBlockOffset = (safeStage - 101) % 10;
    if(inBlockOffset === spikeOffset){
      return Math.max(7, Number(picked) || 7);
    }
  }
  return picked;
}

function stageSpec(stage){
  return difficultySpecFromTarget(stageTargetDifficulty(stage));
}

function dailyRotationCode(dateKey = ymdLocal()){
  const m = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return "A";
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  const dayIndex = Math.floor(Date.UTC(y, mon - 1, d) / 86400000);
  const list = ["A", "B", "C"];
  return list[((dayIndex % 3) + 3) % 3];
}

function dailyTargetDifficulty(level, dateKey = ymdLocal()){
  const lv = clamp(Math.round(Number(level) || 1), 1, 3);
  const code = dailyRotationCode(dateKey);
  const row = DAILY_ROTATION_TABLE[code] || DAILY_ROTATION_TABLE.A;
  return row[lv - 1];
}

function dailySpec(level, dateKey = ymdLocal()){
  return difficultySpecFromTarget(dailyTargetDifficulty(level, dateKey));
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
    // hero03 asset is missing; fall back to hero04 to avoid 404
    hero03: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_04.png" },
    hero04: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_04.png" },
    hero05: { img:null, src:"./asset/images/penguin/penguin_hero_sheet_05.png" },
    // Support user's typed naming too.
    heroTypo01: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_01.png" },
    heroTypo02: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_02.png" },
    heroTypo03: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_03.png" },
    heroTypo04: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_04.png" },
    heroTypo05: { img:null, src:"./asset/images/penguin/pengguin_hero_sheet_05.png" },
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
  const flat = [];
  for(const group of Object.values(ASSETS)){
    for(const item of Object.values(group)) flat.push(item);
  }
  for(const it of flat){
    const r = await loadImageWithTimeout(it.src, 3500);
    it.img = r.ok ? r.img : null;
  }
}

// ---- HUD ----
function setBG(cls){
  if(!bg) return;
  bg.className = "";
  bg.classList.add(cls);
}
function setSplashVisible(active){
  if(splashLogo) splashLogo.style.display = active ? "block" : "none";
  if(splashHint) splashHint.classList.toggle("show", !!active);
}
function setStagePill(text){
  if(stagePillText) stagePillText.textContent = text;
}
function clampStageLabel(){
  if(stageLabel) stageLabel.textContent = `LEVEL ${player.progressStage}`;
}
function updateShopMoney(){
  if(shopGoldText) shopGoldText.textContent = formatCount(player.gold);
}
function setGoldTextImmediate(val){
  goldDisplayValue = val;
  if(goldText) goldText.textContent = formatCount(val);
}
function animateGoldTextTo(target){
  if(!goldText) return;
  if(goldAnimTarget === target) return;
  const startVal = goldDisplayValue ?? target;
  const diff = target - startVal;
  if(diff === 0){
    setGoldTextImmediate(target);
    return;
  }
  goldAnimTarget = target;
  const startTime = performance.now();
  const duration = 420;
  const animId = ++goldAnimId;
  const tick = (t)=>{
    if(animId !== goldAnimId) return;
    const p = Math.min(1, (t - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(startVal + diff * eased);
    goldDisplayValue = val;
    goldText.textContent = formatCount(val);
    if(p < 1){
      requestAnimationFrame(tick);
    }else{
      goldAnimTarget = null;
    }
  };
  requestAnimationFrame(tick);
}
function updateUndoButtonState(){
  if(!btnUndo) return;
  let disabled = false;
  if(!TUTORIAL.active){
    disabled = runtime.paused || runtime.busy || runtime.gameOver || runtime.cleared || runtime.history.length === 0;
  }
  btnUndo.classList.toggle("disabled", disabled);
  btnUndo.setAttribute("aria-disabled", disabled ? "true" : "false");
  if(disabled){
    btnUndo.setAttribute("tabindex", "-1");
  }else{
    btnUndo.removeAttribute("tabindex");
  }
}
function updateHintButtonState(){
  if(!btnHint) return;
  let disabled = false;
  let locked = false;
  if(!TUTORIAL.active){
    locked = runtime.mode === MODE.DAILY;
    disabled = runtime.paused || runtime.busy || runtime.gameOver || runtime.cleared;
  }
  btnHint.classList.toggle("disabled", disabled);
  btnHint.classList.toggle("locked", !disabled && locked);
  btnHint.setAttribute("aria-disabled", disabled ? "true" : "false");
  if(disabled){
    btnHint.setAttribute("tabindex", "-1");
  }else{
    btnHint.removeAttribute("tabindex");
  }
}
function updateHUD(){
  if(goldText){
    if(goldDisplayValue == null) goldDisplayValue = player.gold;
    if(player.gold < goldDisplayValue){
      animateGoldTextTo(player.gold);
    }else if(player.gold !== goldDisplayValue){
      setGoldTextImmediate(player.gold);
    }else{
      goldText.textContent = formatCount(player.gold);
    }
  }
  if(jamText) jamText.textContent = formatCount(player.gem);
  undoCnt && (undoCnt.textContent = "∞");
  clampStageLabel();
  updateShopMoney();
  updateUndoButtonState();
  updateHintButtonState();

  if(runtime.mode === MODE.HOME || runtime.mode === MODE.TUTORIAL){
    // ✅ 홈/튜토리얼에서는 가운데 pill 자체가 안 보여야 함
    if(stagePill) stagePill.style.display = "none";
  }else{
    if(stagePill) stagePill.style.display = "flex";
    if(runtime.mode === MODE.STAGE){
      if(modeText) modeText.textContent = "STAGE";
      setStagePill(`LEVEL ${runtime.currentStage ?? 1}`);
    }else if(runtime.mode === MODE.DAILY){
      if(modeText) modeText.textContent = "CHALLENGE";
      setStagePill(`LEVEL ${runtime.dailyLevel ?? 1}`);
    }else{
      setStagePill("");
    }
  }
  if(btnJam){
    btnJam.style.display = runtime.mode === MODE.HOME ? "block" : "none";
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

let optimalHintCache = { sig:null, path:null, states:null, index:null };
function buildOptimalHintCache(puzzle){
  const sig = puzzleSignature(puzzle);
  if(optimalHintCache.sig === sig) return optimalHintCache;
  const res = solveBFS(puzzle, null, 140);
  if(!res.solvable || !res.path || res.path.length === 0){
    optimalHintCache = { sig, path:null, states:null, index:null };
    return optimalHintCache;
  }
  const W = puzzle.W;
  const blocksStatic = puzzle.blocks.map(([x,y])=>({x,y}));
  let cur = puzzle.penguins.map(([x,y])=>({x,y}));
  const states = [cur];
  for(const mv of res.path){
    const r = slideOnce(cur, W, blocksStatic, mv.penguin, DIRS2[mv.dir]);
    if(!r || r.fellOff) break;
    cur = r.nextPosArr;
    states.push(cur);
  }
  const index = new Map();
  for(let i=0;i<states.length;i++){
    index.set(stateKey(states[i]), i);
  }
  optimalHintCache = { sig, path: res.path, states, index };
  return optimalHintCache;
}

function generatePuzzleDeterministic(spec, seedStr, options={}){
  const W = spec.W;
  const home = { x: Math.floor(W/2), y: Math.floor(W/2) };
  const rng = makeRng(seedStr);

  const blockMin = (W===5) ? 1 : 4;
  const blockMax = (W===5) ? 4 : 9;

  const MAX_TRIES = Number.isFinite(options.maxTries) ? options.maxTries : 5000;

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

function weightedEffectiveMoves(path){
  if(!Array.isArray(path) || !path.length) return 0;
  let prevPenguin = -1;
  let total = 0;
  for(const mv of path){
    const samePenguin = mv?.penguin === prevPenguin;
    total += samePenguin ? 0.5 : 1;
    prevPenguin = mv?.penguin;
  }
  return total;
}

function effectiveMovesFloor(moveCount){
  const safe = Math.max(0, Number(moveCount) || 0);
  if(safe <= 0) return 0;
  return 1 + Math.max(0, safe - 1) * 0.5;
}

function buildStatesAlongPath(puzzle, path){
  const W = puzzle.W;
  const blocksStatic = puzzle.blocks.map(([x,y])=>({x,y}));
  let cur = puzzle.penguins.map(([x,y])=>({x,y}));
  const states = [cur];
  for(const mv of (path || [])){
    const r = slideOnce(cur, W, blocksStatic, mv.penguin, DIRS2[mv.dir]);
    if(!r || r.fellOff) break;
    cur = r.nextPosArr;
    states.push(cur);
  }
  return states;
}

function collectGoalRockUsage(puzzle, solveRes, states){
  const W = puzzle.W;
  const home = { x: Math.floor(W/2), y: Math.floor(W/2) };
  const blockSet = new Set(puzzle.blocks.map(([x,y])=>`${x},${y}`));
  const around = [[1,0],[-1,0],[0,1],[0,-1]];
  const adjacentRockKeys = [];
  for(const [dx,dy] of around){
    const nx = home.x + dx;
    const ny = home.y + dy;
    if(!inBoundsStage(W, nx, ny)) continue;
    const key = `${nx},${ny}`;
    if(blockSet.has(key)) adjacentRockKeys.push(key);
  }

  const assistRockKeys = new Set();
  const path = solveRes?.path || [];
  for(let i=0; i<path.length; i++){
    const mv = path[i];
    if(mv?.penguin !== 0) continue;
    const fromHero = states?.[i]?.[0];
    const toHero = states?.[i + 1]?.[0];
    if(!fromHero || !toHero) continue;
    if(toHero.x !== home.x || toHero.y !== home.y) continue;
    const dx = Math.sign(toHero.x - fromHero.x);
    const dy = Math.sign(toHero.y - fromHero.y);
    if(dx === 0 && dy === 0) continue;
    const sx = home.x + dx;
    const sy = home.y + dy;
    const stopperKey = `${sx},${sy}`;
    if(blockSet.has(stopperKey)) assistRockKeys.add(stopperKey);
  }

  const goalAssist = assistRockKeys.size;
  const goalFake = Math.max(0, adjacentRockKeys.length - goalAssist);
  return { goalAssist, goalFake, goalAdjacentRockCount: adjacentRockKeys.length };
}

function collectDecoyScore(puzzle, solveRes, states, spec){
  const W = puzzle.W;
  const blocksStatic = puzzle.blocks.map(([x,y])=>({x,y}));
  const path = solveRes?.path || [];
  const maxDepth = Math.max(60, Number(spec?.max || 0) + 40);
  const distCache = new Map();

  const distToGoal = (posArr)=>{
    const key = stateKey(posArr);
    if(distCache.has(key)) return distCache.get(key);
    const override = posArr.map((p)=>[p.x, p.y]);
    const res = solveBFS(puzzle, override, maxDepth);
    const d = res?.solvable ? Number(res.minMoves || 0) : Infinity;
    distCache.set(key, d);
    return d;
  };

  let ratioSum = 0;
  let ratioCount = 0;
  let penaltySum = 0;
  let penaltyCount = 0;

  for(let i=0; i<path.length; i++){
    const cur = states?.[i];
    if(!cur) continue;

    const legal = [];
    for(let p=0; p<cur.length; p++){
      for(let di=0; di<DIRS2.length; di++){
        const r = slideOnce(cur, W, blocksStatic, p, DIRS2[di]);
        if(!r || r.fellOff) continue;
        legal.push({ penguin:p, dir:di, nextPosArr:r.nextPosArr });
      }
    }
    if(!legal.length) continue;

    ratioCount += 1;
    const optimal = path[i];
    const currentDist = Math.max(0, path.length - i);
    let decoyCount = 0;

    for(const mv of legal){
      if(mv.penguin === optimal.penguin && mv.dir === optimal.dir) continue;
      decoyCount += 1;

      const nextDist = distToGoal(mv.nextPosArr);
      let penalty = 1;
      if(Number.isFinite(nextDist)){
        const expectedBest = Math.max(0, currentDist - 1);
        const extraSteps = Math.max(0, nextDist - expectedBest);
        penalty = clamp(extraSteps / 4, 0, 1);
      }
      penaltySum += penalty;
      penaltyCount += 1;
    }
    ratioSum += decoyCount / legal.length;
  }

  const decoyRatio = ratioCount ? (ratioSum / ratioCount) : 0;
  const decoyPenalty = penaltyCount ? (penaltySum / penaltyCount) : 0;
  const decoyScore = clamp(0.5 * decoyRatio + 0.5 * decoyPenalty, 0, 1);
  return { decoyRatio, decoyPenalty, decoyScore };
}

function evaluateDifficultyProfileD10(puzzle, solveRes, spec){
  if(!solveRes?.solvable) return null;
  const path = solveRes.path || [];
  const minMoves = Number(solveRes.minMoves || 0);
  const states = buildStatesAlongPath(puzzle, path);
  const effectiveMoves = weightedEffectiveMoves(path);
  const goal = collectGoalRockUsage(puzzle, solveRes, states);
  const decoy = collectDecoyScore(puzzle, solveRes, states, spec);

  // Use absolute scales so D1~D10 are separable across different specs.
  const effFloor = effectiveMovesFloor(spec?.min ?? 2);
  const effCeil = effectiveMovesFloor(12);
  const normEffectiveMoves = clamp((effectiveMoves - effFloor) / Math.max(0.5, effCeil - effFloor), 0, 1);
  const normMoveDepth = clamp((minMoves - 2) / 10, 0, 1);
  const normGoalFake = clamp(goal.goalFake / 4, 0, 1);
  const normGoalAssist = clamp(goal.goalAssist / 4, 0, 1);
  const normDecoy = clamp(decoy.decoyScore, 0, 1);

  const composite = clamp(
    0.62 * normMoveDepth +
    0.18 * normEffectiveMoves +
    0.12 * normDecoy +
    0.07 * normGoalFake -
    0.06 * normGoalAssist,
    0,
    1
  );
  const diff10 = clamp(Math.round(1 + 9 * composite), 1, 10);

  return {
    minMoves,
    effectiveMoves,
    goalAssist: goal.goalAssist,
    goalFake: goal.goalFake,
    decoyRatio: decoy.decoyRatio,
    decoyPenalty: decoy.decoyPenalty,
    decoyScore: decoy.decoyScore,
    composite,
    diff10,
  };
}

function pickDailyCandidateByLevel(candidates, level, dateKey){
  if(!candidates.length) return null;
  const target = dailyTargetDifficulty(level, dateKey);
  const targetComposite = (target - 1) / 9;
  const sorted = candidates.slice().sort((a,b)=>{
    const da = Math.abs((a.diff10 ?? 0) - target);
    const db = Math.abs((b.diff10 ?? 0) - target);
    if(da !== db) return da - db;
    if(level === 1 && a.composite !== b.composite) return a.composite - b.composite;
    if(level === 3 && a.composite !== b.composite) return b.composite - a.composite;
    const ta = Math.abs((a.composite ?? 0) - targetComposite);
    const tb = Math.abs((b.composite ?? 0) - targetComposite);
    if(ta !== tb) return ta - tb;
    if(a.minMoves !== b.minMoves) return a.minMoves - b.minMoves;
    return a.variant - b.variant;
  });
  return sorted[0];
}

function generateDailyPuzzleDeterministic(level, spec, dateKey){
  const sampleCount = 14;
  const candidates = [];
  for(let variant=0; variant<sampleCount; variant++){
    const seed = `daily:v${PUZZLE_SEED_VERSION}:${dateKey}:level:${level}:variant:${variant}:W${spec.W}:min${spec.min}:max${spec.max}`;
    const puzzle = generatePuzzleDeterministic(spec, seed, { maxTries: 1400 });
    const res = solveBFS(puzzle, null, spec.max + 25);
    if(!res?.solvable) continue;
    if(res.minMoves < spec.min || res.minMoves > spec.max) continue;
    const profile = evaluateDifficultyProfileD10(puzzle, res, spec);
    if(!profile) continue;
    candidates.push({
      puzzle,
      composite: profile.composite,
      diff10: profile.diff10,
      minMoves: profile.minMoves,
      variant,
    });
  }
  const picked = pickDailyCandidateByLevel(candidates, level, dateKey);
  if(picked?.puzzle) return picked.puzzle;
  return generatePuzzleDeterministic(
    spec,
    `daily:v${PUZZLE_SEED_VERSION}:${dateKey}:level:${level}:fallback:W${spec.W}:min${spec.min}:max${spec.max}`
  );
}

function pickStageCandidateByStage(candidates, stage){
  if(!candidates.length) return null;
  const target = stageTargetDifficulty(stage);
  const targetComposite = (target - 1) / 9;
  const sorted = candidates.slice().sort((a,b)=>{
    const da = Math.abs((a.diff10 ?? 0) - target);
    const db = Math.abs((b.diff10 ?? 0) - target);
    if(da !== db) return da - db;
    const ta = Math.abs((a.composite ?? 0) - targetComposite);
    const tb = Math.abs((b.composite ?? 0) - targetComposite);
    if(ta !== tb) return ta - tb;
    if(a.minMoves !== b.minMoves) return a.minMoves - b.minMoves;
    return a.variant - b.variant;
  });
  return sorted[0];
}

function generateStagePuzzleDeterministic(stage, spec){
  const sampleCount = 8;
  const candidates = [];
  for(let variant=0; variant<sampleCount; variant++){
    const seed = `stage:v${PUZZLE_SEED_VERSION}:${stage}:variant:${variant}:W${spec.W}:min${spec.min}:max${spec.max}`;
    const puzzle = generatePuzzleDeterministic(spec, seed, { maxTries: 1400 });
    const res = solveBFS(puzzle, null, spec.max + 25);
    if(!res?.solvable) continue;
    if(res.minMoves < spec.min || res.minMoves > spec.max) continue;
    const profile = evaluateDifficultyProfileD10(puzzle, res, spec);
    if(!profile) continue;
    candidates.push({
      puzzle,
      composite: profile.composite,
      diff10: profile.diff10,
      minMoves: profile.minMoves,
      variant,
    });
  }
  const picked = pickStageCandidateByStage(candidates, stage);
  if(picked?.puzzle) return picked.puzzle;
  return generatePuzzleDeterministic(
    spec,
    `stage:v${PUZZLE_SEED_VERSION}:${stage}:fallback:W${spec.W}:min${spec.min}:max${spec.max}`
  );
}

function estimateDifficulty10ForCurrentPuzzle(){
  if(!runtime.puzzle) return null;
  const puzzle = runtime.puzzle;
  const solveRes = solveBFS(puzzle, null, 180);
  if(!solveRes?.solvable) return null;

  let spec = null;
  if(runtime.mode === MODE.DAILY){
    const level = runtime.dailyLevel ?? 1;
    spec = dailySpec(level, runtime.dailyDate || ymdLocal());
  }else if(runtime.mode === MODE.STAGE){
    const stage = runtime.currentStage ?? 1;
    spec = stageSpec(stage);
  }else{
    const baseMoves = Math.max(1, Number(solveRes.minMoves || 1));
    spec = { W: puzzle.W, min: baseMoves, max: baseMoves + 4 };
  }
  const profile = evaluateDifficultyProfileD10(puzzle, solveRes, spec);
  return profile?.diff10 ?? null;
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
  const puzzle = generateStagePuzzleDeterministic(stage, spec);
  setStagePuzzleToCache(stage, puzzle);
  return puzzle;
}
function getOrCreateDailyPack(){
  const today = ymdLocal();
  const pack = loadJSON(SAVE.daily, null);
  if(
    pack &&
    pack.version === DAILY_PACK_VERSION &&
    pack.date === today &&
    pack.levels &&
    pack.cleared
  ) return pack;

  const levels = [1,2,3].map(level=>{
    const spec = dailySpec(level, today);
    const puzzle = generateDailyPuzzleDeterministic(level, spec, today);
    return { level, puzzle };
  });
  const next = { version: DAILY_PACK_VERSION, date: today, levels, cleared: {1:false,2:false,3:false} };
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
function puzzleSignature(puzzle){
  if(!puzzle) return "";
  return JSON.stringify({
    W: Number(puzzle.W) || 0,
    blocks: Array.isArray(puzzle.blocks) ? puzzle.blocks : [],
    penguins: Array.isArray(puzzle.penguins) ? puzzle.penguins : [],
  });
}
function isSamePuzzle(a, b){
  return puzzleSignature(a) === puzzleSignature(b);
}

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
  runtime.hintUsedThisMove = false;
  runtime.clearReward = null;

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
  updateUndoButtonState();
}
function setRuntimePositions(posArr){
  for(let i=0;i<runtime.penguins.length;i++){
    runtime.penguins[i].x = posArr[i].x;
    runtime.penguins[i].y = posArr[i].y;
    delete runtime.penguins[i]._rx;
    delete runtime.penguins[i]._ry;
    setPenguinAnim(i, "stop");
  }
}
function restoreToHistoryIndex(idx){
  const s = runtime.history[idx];
  if(!s) return false;
  setRuntimePositions(s.penguins);
  runtime.moves = s.moves;
  runtime.history = runtime.history.slice(0, idx);
  runtime.hintActive = false;
  runtime.hintPenguinIndex = null;
  runtime.hintUsedThisMove = false;
  saveSession();
  updateUndoButtonState();
  return true;
}
function restoreToInitialState(){
  if(!runtime.puzzle) return false;
  const start = runtime.puzzle.penguins.map(([x,y])=>({x,y}));
  setRuntimePositions(start);
  runtime.moves = 0;
  runtime.history = [];
  runtime.hintActive = false;
  runtime.hintPenguinIndex = null;
  runtime.hintUsedThisMove = false;
  saveSession();
  updateUndoButtonState();
  return true;
}
function rewindToHistoryIndex(idx, { stepMs=60, onDone } = {}){
  const history = runtime.history;
  if(!history || history.length === 0) return false;
  if(idx < 0 || idx >= history.length) return false;
  if(runtime.busy) return false;

  runtime.busy = true;
  updateUndoButtonState();
  updateHintButtonState();

  let i = history.length - 1;
  const step = ()=>{
    const s = history[i];
    if(!s){
      finish();
      return;
    }
    setRuntimePositions(s.penguins);
    runtime.moves = s.moves;
    draw();

    if(i <= idx){
      finish();
      return;
    }
    i -= 1;
    setTimeout(()=>requestAnimationFrame(step), stepMs);
  };
  const finish = ()=>{
    runtime.history = history.slice(0, idx);
    runtime.hintActive = false;
    runtime.hintPenguinIndex = null;
    runtime.hintUsedThisMove = false;
    runtime.busy = false;
    saveSession();
    updateUndoButtonState();
    updateHintButtonState();
    onDone?.();
  };

  requestAnimationFrame(step);
  return true;
}
function rewindToInitial({ stepMs=60, onDone } = {}){
  if(runtime.history.length > 0){
    return rewindToHistoryIndex(0, { stepMs, onDone });
  }
  const ok = restoreToInitialState();
  onDone?.();
  return ok;
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
  runtime.hintActive = false;
  runtime.hintPenguinIndex = null;
  runtime.hintUsedThisMove = false;
  updateUndoButtonState();
  saveSession();
  return true;
}

// ---- animation ----
const PENG_SHEET_ROWS = 4;
const PENG_SHEET_COLS = 4;
const PENG_FRAME_COUNT = PENG_SHEET_ROWS * PENG_SHEET_COLS;
const PENG_FRAME_INSET_PX = 1;

const PENG_ANIM_DEF = {
  idle: {
    sheet: 1,
    frames: [5],
    durations: [99999],
    loop: false,
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
    // Use fewer frames but keep total time close to collision1 for matched impact feel.
    frames: [9, 10, 12, 10, 9],
    durations: [95, 95, 105, 95, 95],
    loop: false,
    next: "stop",
  },
  clearHero: {
    sheet: 5,
    // Hero clear motion (sheet 5): #12 > #1 > #2 > #3
    frames: [12, 1, 2, 3],
    durations: [130, 120, 120, 150],
    loop: false,
    next: "stop",
    drawScale: 0.92,
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
  const cellW = iw / PENG_SHEET_COLS;
  const cellH = ih / PENG_SHEET_ROWS;
  // Inset source rect a bit to avoid bleeding from neighboring atlas cells.
  const inset = Math.min(PENG_FRAME_INSET_PX, cellW * 0.08, cellH * 0.08);
  const sx = col * cellW + inset;
  const sy = row * cellH + inset;
  const sw = Math.max(1, cellW - inset * 2);
  const sh = Math.max(1, cellH - inset * 2);
  return { sx, sy, sw, sh };
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
    const step = TUTORIAL.active ? tutorialCurrentStep() : null;
    const tutorialOutDemo = !!(TUTORIAL.active && step?.type === "fall_off");
    if(tutorialOutDemo){
      runtime.gameOver = false;
    }else{
      runtime.gameOver = true;
      saveSession();
      vibrate([30, 40, 30, 50, 120]);
      setTimeout(()=>show(failOverlay), 220);
    }
    runtime.busy = false;
    updateUndoButtonState();
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
      runtime.hintUsedThisMove = false;

      if(index===0 && p.x===runtime.home.x && p.y===runtime.home.y){
        if(TUTORIAL.active){
          if(TUTORIAL.allowClear){
            playClearSfx();
            const step = tutorialCurrentStep();
            if(step?.showClearPopup){
              openTutorialClearOverlay(step);
            }else{
              toast("클리어!");
              tutorialNext();
            }
          }
        }else{
          runtime.cleared = true;
          setPenguinAnim(0, "clearHero");
          onClear(500);
        }
      }
      saveSession();

      runtime.busy=false;
      updateUndoButtonState();
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
      updateUndoButtonState();
      playMoveSfx();
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
    toast("움직일 수 없어");
    draw();
    return;
  }

  playMoveSfx();
  snapshot();
  runtime.busy = true;
  updateUndoButtonState();
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

// ---- undo/hint ----
function useUndo(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(!step || step.type !== "undo"){
      TUTORIAL.blockedReason = "지금은 UNDO 단계가 아니에요";
      tutorialBlocked();
      return;
    }
    if(step.armWithAction && !TUTORIAL.stepArmed){
      TUTORIAL.blockedReason = "먼저 안내 카드의 버튼을 눌러 주세요";
      tutorialBlocked();
      return;
    }
  }
  if(runtime.history.length === 0){ toast("되돌릴 수 없어요"); return; }
  playBoop();
  vibrate(18);
  const idx = runtime.history.length - 1;
  rewindToHistoryIndex(idx, {
    stepMs: 50,
    onDone: ()=>{
      draw();
      if(TUTORIAL.active) tutorialNext();
    }
  });
}

async function useHint(){
  if(runtime.paused) return;
  if(runtime.gameOver || runtime.cleared || runtime.busy) return;
  if(TUTORIAL.active){
    const step = tutorialCurrentStep();
    if(!step || step.type !== "hint"){
      TUTORIAL.blockedReason = "지금은 HINT 단계가 아니에요";
      tutorialBlocked();
      return;
    }
    if(step.armWithAction && !TUTORIAL.stepArmed){
      TUTORIAL.blockedReason = "먼저 안내 카드의 버튼을 눌러 주세요";
      tutorialBlocked();
      return;
    }
  }

  if(runtime.mode === MODE.DAILY && !TUTORIAL.active){
    toast("일일도전에서는 힌트를 사용할 수 없어요");
    return;
  }

  const hintCost = 100;
  const cache = buildOptimalHintCache(runtime.puzzle);
  if(!cache.path || !cache.index){
    toast("힌트를 만들 수 없어요");
    return;
  }

  const curKey = stateKey(runtime.penguins);
  let planType = "current";
  let stepIdx = cache.index.get(curKey);
  let histIndex = -1;

  if(stepIdx == null){
    planType = "history";
    for(let i=runtime.history.length-1;i>=0;i--){
      const k = stateKey(runtime.history[i].penguins);
      const idx = cache.index.get(k);
      if(idx != null){
        stepIdx = idx;
        histIndex = i;
        break;
      }
    }
    if(histIndex === -1){
      planType = "reset";
      stepIdx = 0;
    }
  }

  if(planType === "current" && runtime.hintUsedThisMove && !TUTORIAL.active){
    toast("한 수에 힌트는 한번만 사용할 수 있어요");
    return;
  }

  if(stepIdx == null || stepIdx >= cache.path.length){
    toast("힌트를 만들 수 없어요");
    return;
  }

  let hintByAd = false;
  if(!TUTORIAL.active && runtime.mode === MODE.STAGE && player.gold < hintCost){
    const ad = await tryRewardedAd("hint_unlock");
    if(ad.rewarded){
      hintByAd = true;
      openInfo("힌트 광고 보상", "광고 시청 완료! 이번 힌트는 무료로 사용할 수 있어요.");
    }else{
      openShopOverlay("골드가 부족해요. 상점에서 골드를 획득하거나 힌트 광고를 시청해보세요.");
      return;
    }
  }

  if(planType === "history" && histIndex >= 0){
    rewindToHistoryIndex(histIndex, {
      stepMs: 50,
      onDone: ()=>{
        runtime.hintPenguinIndex = cache.path[stepIdx].penguin;
        runtime.hintActive = true;
        runtime.hintUsedThisMove = true;
        draw();
        if(TUTORIAL.active) tutorialNext();
      }
    });
  }else if(planType === "reset"){
    rewindToInitial({
      stepMs: 50,
      onDone: ()=>{
        runtime.hintPenguinIndex = cache.path[stepIdx].penguin;
        runtime.hintActive = true;
        runtime.hintUsedThisMove = true;
        draw();
        if(TUTORIAL.active) tutorialNext();
      }
    });
  }

  if(!TUTORIAL.active && runtime.mode === MODE.STAGE && !hintByAd){
    player.gold = Math.max(0, player.gold - hintCost);
    savePlayerLocal();
    cloudPushDebounced();
    updateHUD();
    toast(`힌트 사용 -${hintCost} 골드`);
  }else if(hintByAd){
    toast("광고 힌트 사용");
  }

  if(planType === "current"){
    runtime.hintPenguinIndex = cache.path[stepIdx].penguin;
    runtime.hintActive = true;
    runtime.hintUsedThisMove = true;
    draw();
    if(TUTORIAL.active) tutorialNext();
  }
}

function restartCurrent(){
  if(TUTORIAL.active){
    tutorialBlocked();
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
function onClear(delayMs=0){
  playClearSfx();
  // ✅ 클리어 팝업도 딜레이
  setTimeout(async ()=>{
    if(runtime.mode === MODE.STAGE){
      const reward = 12;
      const prevProgressStage = player.progressStage;
      runtime.clearReward = { gold: reward, gem: 0, boostable: true, source: "stage" };

      player.gold += reward;
      player.progressStage = Math.max(player.progressStage, (runtime.currentStage ?? 1) + 1);

      savePlayerLocal();
      await cloudSubmitStageClear(player.progressStage);
      cloudPushDebounced();

      clearSession();

      if(clearDesc) clearDesc.textContent = `스테이지 보상: ${reward} 코인`;
      show(clearOverlay);
      updateHUD();
      if(
        prevProgressStage <= ACCOUNT_LINK_PROMPT_STAGE &&
        player.progressStage > ACCOUNT_LINK_PROMPT_STAGE &&
        !hasSeenAccountLinkPrompt()
      ){
        toast("LEVEL 20+ 달성! 클리어 후 계정연동을 진행해보세요.");
      }
      return;
    }

    if(runtime.mode === MODE.DAILY){
      const level = runtime.dailyLevel ?? 1;
      const pack = getOrCreateDailyPack();
      const alreadyCleared = !!pack?.cleared?.[level];

      if(!alreadyCleared){
        const rw = dailyReward(level);
        runtime.clearReward = { gold: rw.gold, gem: rw.gem, boostable: true, source: "daily_first_clear" };
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
        runtime.clearReward = { gold: 0, gem: 0, boostable: false, source: "daily_reclear" };
        await cloudSubmitDailyClear(pack.date, level);
        clearSession();
        if(clearDesc) clearDesc.textContent =
          `일일 도전 ${level}단계 재도전 클리어!\n보상은 1회만 지급됩니다.`;
      }
      show(clearOverlay);
      updateHUD();
      return;
    }
  }, Math.max(0, Number(delayMs) || 0));
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
const PENGUIN_DRAW_Y_OFFSET = -0.12;
const PENGUIN_SHADOW_Y_OFFSET = 0.30;
const PENGUIN_SHADOW_RX = 0.27;
const PENGUIN_SHADOW_RY = 0.12;
const HERO_CLEAR_FRONT_SCALE = 1.10;
const HERO_CLEAR_FRONT_LIFT = -0.04;

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
  const t = nowMs();
  const hintTilePulse = runtime.hintActive ? (0.5 + 0.5*Math.sin(t/140)) : 0;
  const hintTargetPeng = runtime.hintActive
    ? runtime.penguins?.[runtime.hintPenguinIndex ?? -1]
    : null;
  const hintTargetCell = hintTargetPeng
    ? {
        x: Math.round(hintTargetPeng._rx ?? hintTargetPeng.x),
        y: Math.round(hintTargetPeng._ry ?? hintTargetPeng.y),
      }
    : null;
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
      if(hintTargetCell && x === hintTargetCell.x && y === hintTargetCell.y){
        const alpha = 0.22 + hintTilePulse * 0.26;
        const s = Math.min(b.w, b.h);
        const pad = s * 0.07;
        const rr = s * 0.12;
        ctx.save();
        if(BOARD_TILT_DEG !== 0){
          quadPath(q);
          ctx.clip();
        }
        ctx.fillStyle = `rgba(255,228,92,${alpha.toFixed(3)})`;
        roundRect(ctx, b.x + pad, b.y + pad, b.w - pad*2, b.h - pad*2, rr);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,245,170,${(0.35 + hintTilePulse * 0.45).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, s * 0.025);
        roundRect(ctx, b.x + pad, b.y + pad, b.w - pad*2, b.h - pad*2, rr);
        ctx.stroke();
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

  const heroClearFront = runtime.penguins?.[0]?._anim?.name === "clearHero";
  const drawPenguin = (i, opts={})=>{
    const p = runtime.penguins[i];
    if(!p) return;
    const rx = (p._rx ?? p.x);
    const ry = (p._ry ?? p.y);
    const c = proj.cellCenter(rx, ry);
    const s = c.s;
    const noShadow = !!opts.noShadow;
    const extraScale = Number.isFinite(opts.extraScale) ? opts.extraScale : 1;
    const extraLift = Number.isFinite(opts.extraLift) ? opts.extraLift : 0;

    if(!noShadow){
      ctx.fillStyle = "rgba(0,0,0,0.20)";
      ctx.beginPath();
      ctx.ellipse(
        c.x,
        c.y + s * PENGUIN_SHADOW_Y_OFFSET,
        s * PENGUIN_SHADOW_RX,
        s * PENGUIN_SHADOW_RY,
        0,
        0,
        Math.PI*2
      );
      ctx.fill();
    }

    const src = getPenguinDrawSource(i, t);
    if(src?.image){
      const scale = (i === 0) ? 1.02 : 0.97;
      const stateScale = Number.isFinite(src.drawScale) ? src.drawScale : 1;
      const w = s * scale * stateScale * extraScale;
      const h = s * scale * stateScale * extraScale;
      const drawY = s * (PENGUIN_DRAW_Y_OFFSET + extraLift);
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
      return;
    }
    ctx.fillStyle = (i===0) ? "rgba(255,255,255,0.92)" : "rgba(210,230,255,0.92)";
    roundRect(ctx, c.x - s*0.28, c.y - s*0.32, s*0.56, s*0.64, s*0.2);
    ctx.fill();
  };

  for(let i=0;i<runtime.penguins.length;i++){
    if(heroClearFront && i===0) continue;
    drawPenguin(i);
  }
  if(heroClearFront){
    // Draw hero clear animation last so it never tucks behind tiles/objects.
    drawPenguin(0, {
      noShadow: true,
      extraScale: HERO_CLEAR_FRONT_SCALE,
      extraLift: HERO_CLEAR_FRONT_LIFT,
    });
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
        const dir = step.dir || {x:0, y:0};
        const dx = Math.sign(dir.x || 0);
        const dy = Math.sign(dir.y || 0);
        const len = s * 0.85;
        const tail = { x: c.x - dx * len * 0.35, y: c.y - dy * len * 0.35 };
        const head = { x: c.x + dx * len * 0.65, y: c.y + dy * len * 0.65 };
        const headSize = s * 0.22;
        const perp = { x: -dy, y: dx };

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.lineCap = "round";
        ctx.lineWidth = Math.max(3, s * 0.11);
        ctx.strokeStyle = "rgba(255,190,80,0.98)";
        ctx.fillStyle = "rgba(255,190,80,0.98)";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = Math.max(4, s * 0.18);

        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(head.x - dx * headSize - perp.x * headSize * 0.7, head.y - dy * headSize - perp.y * headSize * 0.7);
        ctx.lineTo(head.x - dx * headSize + perp.x * headSize * 0.7, head.y - dy * headSize + perp.y * headSize * 0.7);
        ctx.closePath();
        ctx.fill();
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
  hide(dailySelectOverlay); hide(tutorialOverlay); hide(tutorialClearOverlay); hide(profileOverlay); hide(nicknameEditOverlay); hide(accountLinkOverlay); hide(infoOverlay); hide(leaderboardOverlay); hide(loginGateOverlay);
  TUTORIAL.cardModal = false;
  tutorialShowCoach(false);
  tutorialSetCardModal(false);
  tutorialFocusOn(null);
}
function enterHomeSafe(){ enterHome(); }

function enterSplash(){
  runtime.mode = MODE.SPLASH;

  // ✅ 스플래시 배경: home 이미지 + 강블러
  setBG("bg-home");
  setSplashVisible(true);
  show(bgBlur);

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
  setSplashVisible(false);
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "block");
  gameLayer && (gameLayer.style.display = "none");

  // ✅ 홈에서도 골드는 보이되, 가운데 pill은 숨김
  topBar && (topBar.style.display = "flex");

  hideAllOverlays();
  setPaused(false);

  updateHUD();
  startLoop();

  if(!player.tutorialDone){ tutorialStart(); return; }
  maybeShowInitialLoginGate();
}

function enterTutorial(){
  runtime.mode = MODE.TUTORIAL;
  setPaused(false);
  hideAllOverlays();

  setBG("bg-sea");
  setSplashVisible(false);
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  loadPuzzleToRuntime({ mode: MODE.TUTORIAL, puzzle: TUTORIAL_STAGE_PUZZLES.stage1 });
  tutorialShowCoach(true);
  tutorialSetStep(0);
  startLoop();
}

async function enterStageMode(stage){
  runtime.mode = MODE.STAGE;
  setPaused(false);
  hideAllOverlays();

  setBG("bg-sea");
  setSplashVisible(false);
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  loadingOverlay?.classList?.remove("boot");
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
  setSplashVisible(false);
  hide(bgBlur);

  homeLayer && (homeLayer.style.display = "none");
  gameLayer && (gameLayer.style.display = "block");
  topBar && (topBar.style.display = "flex");

  loadingOverlay?.classList?.remove("boot");
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
const LEADERBOARD_TOP_LIMIT = 10;
const LEADERBOARD_MY_RANGE = 5;

const ADMIN_DAILY_SOLUTION_TAPS = 7;
const ADMIN_DAILY_TAP_WINDOW_MS = 1300;
const adminDailyTapState = { count: 0, lastMs: 0 };
const ADMIN_GOLD_DIFFICULTY_TAPS = 5;
const ADMIN_GOLD_TAP_WINDOW_MS = 1200;
const adminGoldTapState = { count: 0, lastMs: 0 };

function formatDailyAdminSolutionText(){
  if(runtime.mode !== MODE.DAILY || !runtime.puzzle){
    return "일일 도전 플레이 중에만 확인할 수 있어요.";
  }
  const res = solveBFS(runtime.puzzle, null, 140);
  if(!res?.solvable || !Array.isArray(res.path)){
    return "해답을 찾지 못했어요.";
  }
  const lines = res.path.map((m, idx)=>{
    const who = (m.penguin === 0) ? "주인공" : `펭귄${m.penguin}`;
    const dir = DIR_NAME_KO[m.dir] || "?";
    return `${idx + 1}. ${who} ${dir}`;
  });
  return [
    `${ymdLocal()} · 일일 도전 ${runtime.dailyLevel ?? 1}/3`,
    `최소 ${res.minMoves ?? lines.length}수`,
    "",
    ...lines,
  ].join("\n");
}

function onDailyAdminTap(){
  if(runtime.mode !== MODE.DAILY) return;
  if(runtime.paused) return;
  const now = Date.now();
  if(now - adminDailyTapState.lastMs > ADMIN_DAILY_TAP_WINDOW_MS){
    adminDailyTapState.count = 0;
  }
  adminDailyTapState.lastMs = now;
  adminDailyTapState.count += 1;
  if(adminDailyTapState.count < ADMIN_DAILY_SOLUTION_TAPS) return;
  adminDailyTapState.count = 0;
  openInfo("일일도전 모범답안", formatDailyAdminSolutionText());
  vibrate(20);
}

function onGoldDifficultyTap(){
  if(runtime.mode === MODE.SPLASH || runtime.mode === MODE.HOME) return;
  if(runtime.paused) return;
  const now = Date.now();
  if(now - adminGoldTapState.lastMs > ADMIN_GOLD_TAP_WINDOW_MS){
    adminGoldTapState.count = 0;
  }
  adminGoldTapState.lastMs = now;
  adminGoldTapState.count += 1;
  if(adminGoldTapState.count < ADMIN_GOLD_DIFFICULTY_TAPS) return;
  adminGoldTapState.count = 0;

  const score = estimateDifficulty10ForCurrentPuzzle();
  if(!score){
    openInfo("난이도", "현재 난이도를 계산하지 못했어요.");
    return;
  }
  const modeLabel =
    runtime.mode === MODE.DAILY
      ? `일일 도전 ${runtime.dailyLevel ?? 1}/3`
      : runtime.mode === MODE.STAGE
        ? `스테이지 LEVEL ${runtime.currentStage ?? 1}`
        : "현재 퍼즐";
  openInfo("현재 난이도", `${modeLabel}\n난이도 ${score}/10`);
  vibrate(20);
}

function renderLeaderboardList(el, rows, scoreKey){
  if(!el) return;
  const myId = Cloud.user?.id || "";
  if(!rows?.length){
    el.innerHTML = `<li><span>기록 없음</span><span>-</span></li>`;
    return;
  }
  el.innerHTML = rows.map((row)=>{
    const uid = row.user_id || "";
    const name = row.display_name || guestDisplayNameFromUserId(uid);
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
    if(leaderboardMeta) leaderboardMeta.textContent = "Supabase 미설정: 랭킹을 사용할 수 없어요.";
    renderLeaderboardList(leaderboardTopList, [], "highest_stage");
    renderLeaderboardList(leaderboardAroundList, [], "highest_stage");
    return;
  }

  leaderboardState.loading = true;
  if(leaderboardMeta){
    leaderboardMeta.textContent = mode === "stage" ? "스테이지 랭킹 로딩 중..." : "일일 랭킹 로딩 중...";
  }
  try{
    if(mode === "stage"){
      const topRes = await adapter.getStageLeaderboardTop(LEADERBOARD_TOP_LIMIT);
      const aroundRes = await adapter.getStageLeaderboardAroundMe(Cloud.user?.id, LEADERBOARD_MY_RANGE);
      renderLeaderboardList(leaderboardTopList, topRes?.rows || [], "highest_stage");
      renderLeaderboardList(leaderboardAroundList, aroundRes?.rows || [], "highest_stage");
      if(leaderboardMeta) leaderboardMeta.textContent = "스테이지 랭킹";
    }else{
      const dateKey = ymdLocal();
      const topRes = await adapter.getDailyLeaderboardTop(dateKey, LEADERBOARD_TOP_LIMIT);
      const aroundRes = await adapter.getDailyLeaderboardAroundMe(dateKey, Cloud.user?.id, LEADERBOARD_MY_RANGE);
      renderLeaderboardList(leaderboardTopList, topRes?.rows || [], "cleared_levels");
      renderLeaderboardList(leaderboardAroundList, aroundRes?.rows || [], "cleared_levels");
      if(leaderboardMeta) leaderboardMeta.textContent = `${dateKey} · 일일 랭킹`;
    }
  }catch(e){
    console.warn('[Leaderboard] load failed', e);
    if(leaderboardMeta) leaderboardMeta.textContent = "랭킹 로딩 실패";
  }finally{
    leaderboardState.loading = false;
  }
}

async function openLeaderboard(){
  show(leaderboardOverlay);
  setPaused(true);
  await loadLeaderboard(leaderboardState.mode || "stage");
}

function isShopDailyFreeAvailable(){
  return getShopDailyGoldClaimDate() !== ymdLocal();
}

function refreshShopUI(){
  updateShopMoney();
  const freeAvailable = isShopDailyFreeAvailable();
  if(btnShopDailyGold){
    btnShopDailyGold.textContent = freeAvailable
      ? "골드 +70 무료획득 (1일 1회)"
      : "광고 보고 골드 +70 획득";
    btnShopDailyGold.classList.toggle("ghostBtn", !freeAvailable);
  }
  if(shopDesc){
    shopDesc.textContent = freeAvailable
      ? "오늘 무료 골드 70을 받을 수 있어요."
      : "오늘 무료 획득 완료! 광고를 보고 골드를 계속 획득할 수 있어요.";
  }
}

function openShopOverlay(reasonText=""){
  refreshShopUI();
  show(shopOverlay);
  setPaused(true);
  if(reasonText) toast(reasonText);
}

function grantGold(amount, reason){
  player.gold += Math.max(0, Number(amount) || 0);
  savePlayerLocal();
  cloudPushDebounced();
  updateHUD();
  toast(`${reason} +${amount} 골드`);
}

function claimShopDailyGold(){
  const freeAvailable = isShopDailyFreeAvailable();
  if(freeAvailable){
    setShopDailyGoldClaimDate(ymdLocal());
    grantGold(70, "무료 획득");
    refreshShopUI();
    return;
  }
  const ok = confirm("광고를 시청하고 골드 70을 획득할까요?");
  if(!ok) return;
  grantGold(70, "광고 보상");
}

function buyGoldPack(amount, priceLabel){
  const ok = confirm(`${amount} 골드를 ${priceLabel}에 구매할까요?\n(현재 빌드: 테스트 지급)`);
  if(!ok) return;
  grantGold(amount, "골드 구매");
}


// ---- Buttons ----
stagePill && stagePill.addEventListener("pointerdown", onDailyAdminTap, { passive: true });
goldPill && goldPill.addEventListener("pointerdown", onGoldDifficultyTap, { passive: true });

bindBtn(btnNavHome, () =>enterHome());

// ✅ 게임은 1부터 시작: 홈의 플레이 버튼은 1단계로 진입 수정 : 플레이어 스테이지로 시작 
bindBtn(btnStage, () =>enterStageMode(player.progressStage));

bindBtn(btnDaily, () =>openDailySelect());

bindBtn(btnDaily1, () =>{ hide(dailySelectOverlay); enterDailyMode(1); });
bindBtn(btnDaily2, () =>{ hide(dailySelectOverlay); enterDailyMode(2); });
bindBtn(btnDaily3, () =>{ hide(dailySelectOverlay); enterDailyMode(3); });
bindBtn(btnCloseDailySelect, () =>hide(dailySelectOverlay));

bindBtn(btnNavShop, () =>{
  openShopOverlay();
});
bindBtn(btnCloseShop, () =>{
  hide(shopOverlay);
  setPaused(false);
});
bindBtn(btnNavEvent, () =>openLeaderboard());
bindBtn(btnLeaderboardStage, () =>loadLeaderboard("stage"));
bindBtn(btnLeaderboardDaily, () =>loadLeaderboard("daily"));
bindBtn(btnCloseLeaderboard, () =>{
  hide(leaderboardOverlay);
  setPaused(false);
});
bindBtn(btnGoldPlus, () =>openShopOverlay(), 0);
bindBtn(btnJam, () =>openShopOverlay(), 0);

bindBtn(btnSetting, () =>{
  if(TUTORIAL.active){
    tutorialBlocked();
    return;
  }
  if(gearDesc){
    gearDesc.textContent =
      runtime.mode === MODE.DAILY
        ? `일일 도전 ${runtime.dailyLevel}/3`
        : (runtime.mode === MODE.STAGE ? `스테이지 LEVEL ${runtime.currentStage ?? 1}` : `홈`);
  }
  show(gearOverlay);
  setPaused(true);
});

bindBtn(btnCloseGear, () =>{ hide(gearOverlay); setPaused(false); });

bindBtn(btnGoHome, () =>{
  hide(gearOverlay);
  clearSession();
  enterHome();
});

bindBtn(btnUndo, () =>useUndo(), 0);
bindBtn(btnHint, () =>useHint(), 0);

bindBtn(btnFailHome, () =>{ hide(failOverlay); clearSession(); enterHome(); });
bindBtn(btnFailRetry, () =>{ hide(failOverlay); restartCurrent(); });

function proceedAfterClear(){
  if(runtime.mode === MODE.STAGE){
    const nextStage = (runtime.currentStage ?? 1) + 1;
    enterStageMode(nextStage);
  }else{
    enterHome();
    openDailySelect();
  }
}

function applyClearX2Reward(){
  const rw = runtime.clearReward;
  if(!rw?.boostable) return false;
  const addGold = Number(rw.gold || 0);
  const addGem = Number(rw.gem || 0);
  if(addGold <= 0 && addGem <= 0) return false;
  player.gold += Math.max(0, addGold);
  player.gem += Math.max(0, addGem);
  savePlayerLocal();
  cloudPushDebounced();
  updateHUD();
  openInfo("X2 보상 지급", `추가 보상\n${Math.max(0, addGold)} 코인 / ${Math.max(0, addGem)} 젬`);
  return true;
}

bindBtn(btnClearHome, async () =>{
  hide(clearOverlay);
  await maybeShowInterstitialOnClear();
  if(runtime.mode === MODE.STAGE && showMilestoneAccountLinkPrompt()) return;
  proceedAfterClear();
});

bindBtn(btnClearNext, async () =>{
  hide(clearOverlay);
  const ad = await tryRewardedAd("clear_x2");
  if(ad.rewarded){
    applyClearX2Reward();
  }else{
    openInfo("광고 보상 안내", "광고 시청이 완료되지 않아 기본 보상만 지급됩니다.");
  }
  if(runtime.mode === MODE.STAGE && showMilestoneAccountLinkPrompt()) return;
  proceedAfterClear();
});

// ---- Settings ----
function updateToggle(btn, on){
  if(!btn) return;
  btn.classList.toggle("on", !!on);
  btn.classList.toggle("off", !on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

function syncLangSelect(){
  if(selLang) selLang.value = player.lang || "ko";
}

if(btnSound){
  updateToggle(btnSound, player.soundOn);
  bindBtn(btnSound, async ()=>{
    player.soundOn = !player.soundOn;
    updateToggle(btnSound, player.soundOn);
    savePlayerLocal();
    cloudPushDebounced();
    try{
      if(player.soundOn) await bgm?.play?.();
      else bgm?.pause?.();
    }catch{}
  }, 0);
}
if(btnVibe){
  updateToggle(btnVibe, player.vibeOn);
  bindBtn(btnVibe, ()=>{
    player.vibeOn = !player.vibeOn;
    updateToggle(btnVibe, player.vibeOn);
    savePlayerLocal();
    cloudPushDebounced();
    toast(player.vibeOn ? "진동 ON" : "진동 OFF");
    if(player.vibeOn) vibrate(25);
  }, 0);
}
if(selLang){
  syncLangSelect();
  selLang.addEventListener("change", ()=>{
    player.lang = selLang.value;
    savePlayerLocal();
    cloudPushDebounced();
    const label = player.lang === "ko" ? "한국어" : player.lang === "en" ? "English" : "日本語";
    toast(`언어 변경: ${label}`);
  });
}
if(btnPrivacyNotice){
  bindBtn(btnPrivacyNotice, ()=>{
    window.open("https://podong5959.github.io/penguin-escape/privacy.html", "_blank", "noopener,noreferrer");
  }, 0);
}

// ---- Tutorial ----
bindBtn(btnTutorial, () =>{
  tutorialStart();
});
bindBtn(btnTutorialClose, () =>{
  hide(tutorialOverlay);
  setPaused(false);
});
bindBtn(btnTutorialSkip, () =>tutorialSkip());
bindBtn(btnTutorialPrev, () =>tutorialPrev());
bindBtn(btnTutorialAction, () =>{
  const step = tutorialCurrentStep();
  if(step?.type === "finish") tutorialFinish({ completed: true });
  else if(step?.requiresAction) tutorialNext();
  else if(step?.armWithAction && !TUTORIAL.stepArmed){
    TUTORIAL.stepArmed = true;
    tutorialUpdateCoach();
    toast("좋아요! 바로 진행해보세요.");
  }
});
bindBtn(btnTutorialClearNext, () =>{
  hide(tutorialClearOverlay);
  setPaused(false);
  tutorialNext();
}, 0);

// ---- Profile / Sync ----
function authTypeLabel(){
  if(!Cloud.enabled || !Cloud.user) return "로컬";
  return Cloud.user.is_anonymous ? "게스트" : "구글";
}

function userIdHash(userId){
  const s = String(userId || "");
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function guestDisplayNameFromUserId(userId){
  if(!userId) return "BRAVE-PENGUIN-101";
  const adjectives = [
    "BRAVE","SWIFT","CALM","SMART","BOLD","HAPPY","SHARP","MELLOW",
    "NIMBLE","FRESH","COSMIC","SILENT","MIGHTY","CRISP","GENTLE","WITTY"
  ];
  const nouns = [
    "PENGUIN","APPLE","RIVER","ROCKET","TIGER","NOVA","FOREST","WAVE",
    "OTTER","FALCON","DRAGON","PLANET","MANGO","CLOUD","STONE","COMET"
  ];
  const h = userIdHash(userId);
  const adjective = adjectives[h % adjectives.length];
  const noun = nouns[(h >>> 8) % nouns.length];
  const number = String((h % 900) + 100);
  return `${adjective}-${noun}-${number}`;
}

function normalizeNickname(v){
  return String(v || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function isDefaultDisplayName(name, userId){
  const v = String(name || "").trim();
  if(!v) return true;
  if(v === guestDisplayNameFromUserId(userId)) return true;
  if(/^Guest-[0-9a-f]{8}$/i.test(v)) return true;
  if(/^[A-Z]+-[A-Z]+-\d{3}$/i.test(v)) return true;
  return false;
}

function getKnownDisplayName(){
  const raw = normalizeNickname(Cloud.profileName);
  if(raw) return raw;
  return guestDisplayNameFromUserId(Cloud.user?.id);
}

async function loadMyProfileDisplayName(force=false){
  const adapter = cloudAdapter();
  if(!Cloud.enabled || !Cloud.ready || !Cloud.user || !adapter?.getMyProfile) return null;
  if(!force && Cloud.profileLoaded) return Cloud.profileName || "";
  try{
    const res = await adapter.getMyProfile();
    if(res?.error){
      console.warn("[Cloud] get profile failed:", res.error);
      return null;
    }
    Cloud.profileName = normalizeNickname(res?.profile?.display_name || "");
    Cloud.profileLoaded = true;
    return Cloud.profileName;
  }catch(e){
    console.warn("[Cloud] get profile failed", e);
    return null;
  }
}

function syncNicknameInputs(){
  const displayName = getKnownDisplayName();
  const hasCustomName = !isDefaultDisplayName(displayName, Cloud.user?.id);
  if(nicknameEditInput && document.activeElement !== nicknameEditInput){
    nicknameEditInput.value = hasCustomName ? displayName : "";
  }
  if(loginGateNicknameInput && document.activeElement !== loginGateNicknameInput){
    loginGateNicknameInput.value = "";
  }
}

async function saveNicknameFromInput(inputEl, options={}){
  const adapter = cloudAdapter();
  if(!Cloud.enabled || !Cloud.ready || !Cloud.user || !adapter?.updateDisplayName){
    openInfo("실패", "닉네임 저장을 위해 계정 연결이 필요해요.");
    return false;
  }
  const nickname = normalizeNickname(inputEl?.value);
  if(!nickname){
    openInfo("아이디 입력", "아이디를 입력해주세요.");
    inputEl?.focus?.();
    return false;
  }
  try{
    const res = await adapter.updateDisplayName(nickname);
    if(!res?.ok){
      if(String(res?.code || "") === "23505"){
        openInfo("아이디 중복", "이미 사용 중인 아이디입니다.\n다른 아이디를 입력해주세요.");
        inputEl?.focus?.();
        inputEl?.select?.();
        return false;
      }
      openInfo("실패", `아이디 저장 실패\n${res?.error || ""}`);
      return false;
    }
    Cloud.profileName = normalizeNickname(res?.displayName || nickname);
    Cloud.profileLoaded = true;
    syncNicknameInputs();
    refreshProfileOverlay();
    if(options?.closeLoginGate){
      markLoginGateSeen();
      hide(loginGateOverlay);
      hide(accountLinkOverlay);
      setPaused(false);
    }
    if(options?.closeNicknameEdit){
      hide(nicknameEditOverlay);
    }
    toast("아이디가 저장되었습니다.");
    return true;
  }catch(e){
    console.warn("[Cloud] nickname save failed", e);
    openInfo("실패", "아이디 저장에 실패했어요.");
    return false;
  }
}

function openNicknameEditor(){
  const canEditNickname = !!cloudAdapter()?.hasConfig?.() && !!Cloud.enabled && !!Cloud.user;
  if(!canEditNickname){
    openInfo("안내", "아이디 수정은 계정 연결 후 사용할 수 있어요.");
    return;
  }
  const displayName = getKnownDisplayName();
  if(nicknameEditInput){
    nicknameEditInput.value = isDefaultDisplayName(displayName, Cloud.user?.id) ? "" : displayName;
  }
  show(nicknameEditOverlay);
  setPaused(true);
  setTimeout(()=>{
    nicknameEditInput?.focus?.();
    nicknameEditInput?.select?.();
  }, 0);
}

function refreshProfileOverlay(){
  const hasSupabase = !!cloudAdapter()?.hasConfig?.();
  const usingSupabase = hasSupabase && !!Cloud.enabled;
  const isGuest = !!Cloud.user?.is_anonymous;
  const canEditNickname = usingSupabase && !!Cloud.user;
  const displayName = getKnownDisplayName();
  const hasCustomName = !isDefaultDisplayName(displayName, Cloud.user?.id);
  if(btnSetUserId) btnSetUserId.textContent = hasSupabase ? "계정 연동" : "Supabase 연결 필요";
  if(btnUseGuest) btnUseGuest.textContent = "로그아웃";
  if(profileDesc){
    profileDesc.textContent =
      hasSupabase
        ? (isGuest
            ? `게스트 계정입니다.`
            : `연동 계정입니다.`)
        : `Supabase 미설정: 로컬 저장만 사용 중`;
  }
  const shownNickname = usingSupabase
    ? (hasCustomName ? displayName : guestDisplayNameFromUserId(Cloud.user?.id))
    : "-";
  if(profileNicknameValue) profileNicknameValue.textContent = shownNickname;
  if(btnEditNickname) btnEditNickname.style.display = canEditNickname ? "inline-flex" : "none";

  // 로그인 상태에 따라 버튼 노출 제어
  if(btnSetUserId) btnSetUserId.style.display = (hasSupabase && isGuest) ? "block" : "none";
  if(btnUseGuest) btnUseGuest.style.display = (usingSupabase && !isGuest) ? "block" : "none";
}

async function startGoogleLogin(){
  const adapter = cloudAdapter();
  if(!adapter?.hasConfig?.()){
    openInfo("Supabase 필요", "Google 로그인을 사용하려면 Supabase URL/Anon Key 설정이 필요해요.");
    return false;
  }
  markOAuthMergePending();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const res = await adapter.signInWithGoogle(redirectTo);
  if(!res?.ok){
    clearOAuthMergePending();
    openInfo("Google 로그인 실패", res?.error || "로그인을 시작하지 못했어요.");
    return false;
  }
  return true;
}

async function maybeShowInitialLoginGate(){
  if(!player.tutorialDone) return;
  if(!loginGateOverlay) return;
  if(hasSeenLoginGate()) return;
  if(!Cloud.enabled || !Cloud.user) return;
  if(player.progressStage <= ACCOUNT_LINK_PROMPT_STAGE) return;
  await loadMyProfileDisplayName(true);
  const displayName = getKnownDisplayName();
  const hasCustomName = !isDefaultDisplayName(displayName, Cloud.user?.id);
  const isGuest = !!Cloud.user?.is_anonymous;
  if(hasCustomName && !isGuest){
    markLoginGateSeen();
    return;
  }
  if(loginGateDesc){
    loginGateDesc.textContent = isGuest
      ? "LEVEL 20+ 달성!\n닉네임을 만들고 계정 연동하면 기록이 안전하게 저장돼요."
      : "LEVEL 20+ 달성!\n랭킹에 표시할 닉네임을 입력해주세요.";
  }
  syncNicknameInputs();
  show(loginGateOverlay);
  setPaused(true);
  setTimeout(()=>loginGateNicknameInput?.focus?.(), 0);
}

function shouldShowMilestoneAccountLinkPrompt(){
  if(!player.tutorialDone) return false;
  if(!accountLinkOverlay) return false;
  if(!Cloud.enabled || !Cloud.user) return false;
  if(!Cloud.user.is_anonymous) return false;
  if(player.progressStage <= ACCOUNT_LINK_PROMPT_STAGE) return false;
  if(hasSeenAccountLinkPrompt()) return false;
  return true;
}

function showMilestoneAccountLinkPrompt(){
  if(!shouldShowMilestoneAccountLinkPrompt()) return false;
  markAccountLinkPromptSeen();
  if(loginGateDesc){
    loginGateDesc.textContent = "LEVEL 20+ 달성!\n지금 계정을 연동하면 진행 기록을 안전하게 보관할 수 있어요.";
  }
  show(accountLinkOverlay);
  setPaused(true);
  return true;
}

bindBtn(btnProfile, async () =>{
  await loadMyProfileDisplayName(true);
  refreshProfileOverlay();
  hide(nicknameEditOverlay);
  show(profileOverlay);
  setPaused(true);

  // 열 때도 한번 pull
  await cloudPull();
  await loadMyProfileDisplayName(true);
  updateHUD();
  refreshProfileOverlay();
});
bindBtn(btnCloseProfile, () =>{
  hide(nicknameEditOverlay);
  hide(profileOverlay);
  setPaused(false);
});
bindBtn(btnUseGuest, async () =>{
  if(Cloud.enabled){
    try{
      const adapter = cloudAdapter();
      const res = await adapter?.signOutToGuest?.();
      if(res?.ok){
        Cloud.user = res.user || null;
        Cloud.enabled = !!res.user;
        Cloud.profileLoaded = false;
        Cloud.profileName = "";
        if(res.user?.id) setUserId(res.user.id);
        await cloudPull();
        await loadMyProfileDisplayName(true);
        updateHUD();
        refreshProfileOverlay();
        toast("로그아웃 되었습니다.");
        return;
      }
      openInfo("실패", `로그아웃 실패\n${res?.error || ""}`);
      return;
    }catch(e){
      console.warn('[Cloud] logout failed', e);
      openInfo("실패", "로그아웃에 실패했어요.");
      return;
    }
  }
  refreshProfileOverlay();
  toast("로그아웃 되었습니다.");
});
bindBtn(btnSetUserId, async () =>{
  if(accountLinkOverlay){
    show(accountLinkOverlay);
    return;
  }
  await startGoogleLogin();
});

bindBtn(btnLinkGoogle, async () =>{
  hide(accountLinkOverlay);
  await startGoogleLogin();
});
bindBtn(btnCloseAccountLink, () =>{
  hide(accountLinkOverlay);
});

bindBtn(btnEditNickname, () =>{
  openNicknameEditor();
});
bindBtn(btnNicknameEditSave, async () =>{
  await saveNicknameFromInput(nicknameEditInput, { closeNicknameEdit: true });
});
bindBtn(btnCloseNicknameEdit, () =>{
  hide(nicknameEditOverlay);
});
bindBtn(btnLoginGateSaveNickname, async () =>{
  await saveNicknameFromInput(loginGateNicknameInput, { closeLoginGate: true });
});
bindBtn(btnLoginGateLinkAccount, () =>{
  show(accountLinkOverlay);
});
if(nicknameEditInput){
  nicknameEditInput.addEventListener("keydown", (e)=>{
    if(e.key !== "Enter") return;
    e.preventDefault();
    btnNicknameEditSave?.click?.();
  });
}
if(loginGateNicknameInput){
  loginGateNicknameInput.addEventListener("keydown", (e)=>{
    if(e.key !== "Enter") return;
    e.preventDefault();
    btnLoginGateSaveNickname?.click?.();
  });
}

bindBtn(btnShopDailyGold, () =>claimShopDailyGold());
bindBtn(btnBuyGold1000, () =>buyGoldPack(1000, "₩3,300"));
bindBtn(btnBuyGold2000, () =>buyGoldPack(2000, "₩5,000"));
bindBtn(btnBuyGold3000, () =>buyGoldPack(3000, "₩7,000"));
bindBtn(btnBuyGold5000, () =>buyGoldPack(5000, "₩9,900"));

function waitForTapToStart(){
  return new Promise((resolve)=>{
    let done = false;
    const finish = ()=>{
      if(done) return;
      done = true;
      console.log("[Boot] tap to start");
      cleanup();
      resolve();
    };
    const onTap = ()=>finish();
    const onKey = (e)=>{
      if(e.key === "Enter" || e.key === " "){
        finish();
      }
    };
    const tapTargets = [splashHint, splashLogo, bg, document.body, document.documentElement].filter(Boolean);
    const cleanup = ()=>{
      if(window.__PE_TAP_START === finish) window.__PE_TAP_START = null;
      window.removeEventListener("pointerdown", onTap, true);
      window.removeEventListener("touchstart", onTap, true);
      window.removeEventListener("click", onTap, true);
      window.removeEventListener("mousedown", onTap, true);
      document.removeEventListener("pointerdown", onTap, true);
      document.removeEventListener("mousedown", onTap, true);
      document.removeEventListener("click", onTap, true);
      for(const el of tapTargets){
        el.removeEventListener?.("pointerdown", onTap, true);
        el.removeEventListener?.("mousedown", onTap, true);
        el.removeEventListener?.("click", onTap, true);
      }
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
    };
    window.addEventListener("pointerdown", onTap, { once: true, capture: true });
    window.addEventListener("touchstart", onTap, { once: true, passive: true, capture: true });
    window.addEventListener("click", onTap, { once: true, capture: true });
    window.addEventListener("mousedown", onTap, { once: true, capture: true });
    document.addEventListener("pointerdown", onTap, { once: true, capture: true });
    document.addEventListener("mousedown", onTap, { once: true, capture: true });
    document.addEventListener("click", onTap, { once: true, capture: true });
    for(const el of tapTargets){
      el.addEventListener?.("pointerdown", onTap, { once: true, capture: true });
      el.addEventListener?.("mousedown", onTap, { once: true, capture: true });
      el.addEventListener?.("click", onTap, { once: true, capture: true });
    }
    window.addEventListener("keydown", onKey, { once: true, capture: true });
    window.addEventListener("keyup", onKey, { once: true, capture: true });
    window.__PE_TAP_START = finish;
  });
}

// ---- Boot ----
async function boot(){
  await cloudInitIfPossible();
  await adsInit();
  cloudBindAuthListener();

  const preloadPromise = preloadAssets();
  await playLogoSplash();

  enterSplash();
  loadingOverlay?.classList?.add("boot");
  show(loadingOverlay);

  const HARD_TIMEOUT = 9000;
  const hardTimer = setTimeout(()=>{
    console.warn('[Hard Timeout] preload took too long');
    hide(loadingOverlay);
    toast("로딩이 지연되고 있어요");
  }, HARD_TIMEOUT);

  try{
    await preloadPromise;
  }finally{
    clearTimeout(hardTimer);
  }

  updateToggle(btnSound, player.soundOn);
  updateToggle(btnVibe, player.vibeOn);
  syncLangSelect();
  hide(loadingOverlay);
  loadingOverlay?.classList?.remove("boot");
  const tapPromise = waitForTapToStart();
  await tapPromise;
  try{ if(player.soundOn) bgm?.play?.(); }catch{}

  // OAuth 복귀 직후에는 1회 로컬 진행도를 클라우드로 시드 (네트워크 지연 대비)
  try{
    await withTimeout(cloudMaybeMergeLocalAfterOAuth(), 5000, "cloudMaybeMergeLocalAfterOAuth");
  }catch(e){
    console.warn("[Boot] oauth merge skipped:", e?.message || e);
  }

  // 클라우드 켜져 있으면 시작 시 pull 한번 (지연/정지 대비)
  try{
    await withTimeout(cloudPull(), 5000, "cloudPull");
  }catch(e){
    console.warn("[Boot] cloud pull skipped:", e?.message || e);
  }
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
    if(session.mode === MODE.STAGE){
      const stage = session.stage ?? 1;
      const canonical = getOrCreateStagePuzzle(stage);
      const canRestore = isSamePuzzle(session.puzzle, canonical);
      await enterStageMode(stage);
      loadPuzzleToRuntime({
        mode: MODE.STAGE,
        stage,
        puzzle: canonical,
        restoreState: canRestore
          ? { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
          : null
      });
      if(!canRestore) clearSession();
      draw(); startLoop();
    }else if(session.mode === MODE.DAILY){
      const pack = getOrCreateDailyPack();
      if(session.dailyDate !== pack.date){
        clearSession();
        enterHome();
        return;
      }
      const level = session.dailyLevel ?? 1;
      const found = pack.levels.find(v=>v.level===level);
      if(!found){
        clearSession();
        enterHome();
        return;
      }
      const canRestore = isSamePuzzle(session.puzzle, found.puzzle);
      await enterDailyMode(level);
      loadPuzzleToRuntime({
        mode: MODE.DAILY,
        dailyDate: pack.date,
        dailyLevel: level,
        puzzle: found.puzzle,
        restoreState: canRestore
          ? { penguins: session.penguins, moves: session.moves, elapsedSec: session.elapsedSec }
          : null
      });
      if(!canRestore) clearSession();
      draw(); startLoop();
    }
    return;
  }

  enterHome();
}
boot();

// ---- HUD loop ----
function startHudLoop(){
  startLoop();
}
startHudLoop();
