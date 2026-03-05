(function () {
  const TEST_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";
  const TEST_REWARDED_AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";

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
    rewardedAdUnitIds: {},
    nonPersonalizedOnly: true,
    testMode: false,
    immersiveMode: true,
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

  function getCapacitor() {
    return window.Capacitor || null;
  }

  function getNativePlatform() {
    try {
      const cap = getCapacitor();
      if (!cap) return "web";
      if (typeof cap.isNativePlatform === "function" && !cap.isNativePlatform()) return "web";
      const platform = String(cap.getPlatform?.() || "").toLowerCase();
      if (platform === "ios" || platform === "android") return platform;
      return "web";
    } catch {
      return "web";
    }
  }

  function isNativePlatform() {
    return getNativePlatform() !== "web";
  }

  function isIOSNative() {
    return getNativePlatform() === "ios";
  }

  function getAdMobPlugin() {
    try {
      return getCapacitor()?.Plugins?.AdMob || null;
    } catch {
      return null;
    }
  }

  function normalizeTrackingStatus(rawStatus) {
    const raw =
      rawStatus && typeof rawStatus === "object" && "status" in rawStatus
        ? rawStatus.status
        : rawStatus;
    if (typeof raw === "number") {
      if (raw === 0) return "notDetermined";
      if (raw === 1) return "restricted";
      if (raw === 2) return "denied";
      if (raw === 3) return "authorized";
    }
    const key = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s-]/g, "");
    if (!key) return "unknown";
    if (key === "notdetermined" || key === "0") return "notDetermined";
    if (key === "restricted" || key === "1") return "restricted";
    if (key === "denied" || key === "2") return "denied";
    if (key === "authorized" || key === "3") return "authorized";
    return "unknown";
  }

  function resolveAdUnitId(type, placement = "") {
    const configured =
      type === "interstitial"
        ? String(CFG.interstitialAdUnitId || "").trim()
        : String(CFG.rewardedAdUnitId || "").trim();
    if (type === "rewarded") {
      const key = String(placement || "").trim();
      if (key) {
        const byPlacement = String(CFG.rewardedAdUnitIds?.[key] || "").trim();
        if (byPlacement) return byPlacement;
      }
    }
    if (configured) return configured;

    if (type === "rewarded") return TEST_REWARDED_AD_UNIT_ID;
    if (CFG.testMode) return TEST_INTERSTITIAL_AD_UNIT_ID;
    return "";
  }

  function createAdOptions(adId) {
    return {
      adId,
      isTesting: !!CFG.testMode,
      npa: !!CFG.nonPersonalizedOnly,
      immersiveMode: !!CFG.immersiveMode,
    };
  }

  async function ensureTrackingConsentIfNeeded(adMob) {
    if (!isIOSNative()) return;
    if (!adMob) return;
    try {
      let status = "unknown";
      if (typeof adMob.trackingAuthorizationStatus === "function") {
        const statusRes = await adMob.trackingAuthorizationStatus();
        status = normalizeTrackingStatus(statusRes);
      }
      if (status !== "notDetermined" && status !== "unknown") return;
      if (typeof adMob.requestTrackingAuthorization === "function") {
        await adMob.requestTrackingAuthorization();
      }
    } catch (e) {
      console.warn("[Ads] ATT request skipped", e?.message || e);
    }
  }

  async function requestTrackingPermission() {
    if (!isIOSNative()) return { ok: false, reason: "not_ios", status: "unknown" };
    const adMob = getAdMobPlugin();
    if (!adMob) return { ok: false, reason: "plugin_missing", status: "unknown" };
    try {
      const statusBefore =
        typeof adMob.trackingAuthorizationStatus === "function"
          ? normalizeTrackingStatus(await adMob.trackingAuthorizationStatus())
          : "unknown";
      if (typeof adMob.requestTrackingAuthorization !== "function") {
        return { ok: false, reason: "request_api_missing", status: statusBefore };
      }
      const reqRes = await adMob.requestTrackingAuthorization();
      const statusAfter = normalizeTrackingStatus(reqRes);
      if (statusAfter !== "unknown") return { ok: true, status: statusAfter };
      const statusFinal =
        typeof adMob.trackingAuthorizationStatus === "function"
          ? normalizeTrackingStatus(await adMob.trackingAuthorizationStatus())
          : "unknown";
      return { ok: true, status: statusFinal, before: statusBefore };
    } catch (error) {
      console.warn("[Ads] requestTrackingPermission failed", error);
      return { ok: false, reason: "request_failed", status: "unknown", error };
    }
  }

  async function ensureInit() {
    if (initialized) return { ok: true };
    if (!CFG.enabled) return { ok: false, reason: "disabled" };

    if (!isNativePlatform()) {
      initialized = true;
      return { ok: true, mode: "web_stub" };
    }

    const adMob = getAdMobPlugin();
    if (!adMob?.initialize) return { ok: false, reason: "plugin_missing" };

    try {
      await ensureTrackingConsentIfNeeded(adMob);
      await adMob.initialize({
        initializeForTesting: !!CFG.testMode,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: "Teen",
      });
      initialized = true;
      return { ok: true, mode: "native" };
    } catch (error) {
      console.warn("[Ads] initialize failed", error);
      return { ok: false, reason: "init_failed", error };
    }
  }

  function setConfig(partial) {
    if (!partial || typeof partial !== "object") return;
    Object.assign(CFG, partial);
    if (partial.floating && typeof partial.floating === "object") {
      CFG.floating = { ...CFG.floating, ...partial.floating };
    }
    if (partial.rewardedAdUnitIds && typeof partial.rewardedAdUnitIds === "object") {
      CFG.rewardedAdUnitIds = { ...CFG.rewardedAdUnitIds, ...partial.rewardedAdUnitIds };
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
    const init = await ensureInit();
    if (!init.ok) return { ok: false, skipped: true, reason: init.reason || "init_failed" };

    const adId = resolveAdUnitId("interstitial");
    if (!adId) return { ok: false, skipped: true, reason: "missing_interstitial_ad_unit" };

    if (isNativePlatform()) {
      const adMob = getAdMobPlugin();
      if (!adMob?.prepareInterstitial || !adMob?.showInterstitial) {
        return { ok: false, skipped: true, reason: "plugin_missing" };
      }
      try {
        await adMob.prepareInterstitial(createAdOptions(adId));
        await adMob.showInterstitial();
      } catch (error) {
        console.warn("[Ads] interstitial failed", error);
        return { ok: false, skipped: true, reason: "interstitial_failed", error };
      }
    }

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
    const init = await ensureInit();
    if (!init.ok) return { ok: false, rewarded: false, reason: init.reason || "init_failed" };

    const adId = resolveAdUnitId("rewarded", placement);
    if (!adId) return { ok: false, rewarded: false, reason: "missing_rewarded_ad_unit" };

    if (isNativePlatform()) {
      const adMob = getAdMobPlugin();
      if (!adMob?.prepareRewardVideoAd || !adMob?.showRewardVideoAd) {
        return { ok: false, rewarded: false, reason: "plugin_missing" };
      }
      try {
        await adMob.prepareRewardVideoAd(createAdOptions(adId));
        const rewardItem = await adMob.showRewardVideoAd();
        return {
          ok: true,
          rewarded: true,
          rewardItem: rewardItem || null,
        };
      } catch (error) {
        console.warn("[Ads] rewarded failed", error);
        return { ok: false, rewarded: false, reason: "rewarded_failed", error };
      }
    }

    console.log("[Ads] rewarded shown (web stub)", { placement, segment: getSegment() });
    return { ok: true, rewarded: true };
  }

  window.PE_ADS = {
    setConfig,
    ensureInit,
    requestTrackingPermission,
    getSegment,
    shouldShowInterstitialOnClear,
    showInterstitial,
    showRewarded,
  };
})();
