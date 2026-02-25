(function () {
  const CFG = {
    enabled: false,
    platform: "web",
    floating: {
      clearInterstitialEvery: 8,
      interstitialSessionCap: 1,
      interstitialDailyCap: 3,
      interstitialCooldownMs: 8 * 60 * 1000,
    },
    interstitialAdUnitId: "",
    rewardedAdUnitId: "",
    nonPersonalizedOnly: true,
    testMode: true,
  };

  let initialized = false;
  let sessionInterstitialCount = 0;

  function nowMs() {
    return Date.now();
  }

  function getDayKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function loadJSON(key, fallback) {
    try {
      const t = localStorage.getItem(key);
      return t ? JSON.parse(t) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function loadState() {
    return loadJSON("pe_ad_state", {
      clearCount: 0,
      interstitialDaily: {},
      lastInterstitialAt: 0,
    });
  }

  function saveState(s) {
    saveJSON("pe_ad_state", s);
  }

  async function ensureInit() {
    if (initialized) return { ok: true };
    initialized = true;
    return { ok: true };
  }

  function setConfig(partial) {
    if (!partial || typeof partial !== "object") return;
    Object.assign(CFG, partial);
    if (partial.floating && typeof partial.floating === "object") {
      CFG.floating = { ...CFG.floating, ...partial.floating };
    }
  }

  function getSegment() {
    return "floating";
  }

  function shouldShowInterstitialOnClear() {
    const seg = getSegment();
    if (seg !== "floating") return false;
    if (!CFG.enabled) return false;

    const st = loadState();
    const day = getDayKey();
    const dailyCount = Number(st.interstitialDaily?.[day] || 0);

    if (sessionInterstitialCount >= CFG.floating.interstitialSessionCap) return false;
    if (dailyCount >= CFG.floating.interstitialDailyCap) return false;
    if (nowMs() - Number(st.lastInterstitialAt || 0) < CFG.floating.interstitialCooldownMs) return false;

    st.clearCount = Number(st.clearCount || 0) + 1;
    saveState(st);

    return st.clearCount % CFG.floating.clearInterstitialEvery === 0;
  }

  async function showInterstitial(context = "clear") {
    if (!CFG.enabled) return { ok: false, skipped: true, reason: "disabled" };
    await ensureInit();

    // AdMob SDK hook point. Replace with real SDK integration.
    // Example: Capacitor AdMob Interstitial prepare/show.
    const st = loadState();
    const day = getDayKey();
    st.interstitialDaily[day] = Number(st.interstitialDaily[day] || 0) + 1;
    st.lastInterstitialAt = nowMs();
    saveState(st);
    sessionInterstitialCount += 1;

    console.log("[Ads] interstitial shown", { context, segment: getSegment() });
    return { ok: true, shown: true };
  }

  async function showRewarded(placement = "rewarded") {
    if (!CFG.enabled) return { ok: false, skipped: true, reason: "disabled" };
    await ensureInit();

    // AdMob SDK hook point. Replace with real rewarded ad integration.
    // Return rewarded=true only when SDK callback confirms reward.
    console.log("[Ads] rewarded shown", { placement, segment: getSegment() });
    return { ok: true, rewarded: true };
  }

  window.PE_ADS = {
    setConfig,
    ensureInit,
    getSegment,
    shouldShowInterstitialOnClear,
    showInterstitial,
    showRewarded,
  };
})();
