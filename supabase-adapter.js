(function () {
  const SUPABASE_URL =
    window.PE_SUPABASE_URL ||
    window.VITE_SUPABASE_URL ||
    window.__PE_ENV__?.VITE_SUPABASE_URL ||
    "";
  const SUPABASE_ANON_KEY =
    window.PE_SUPABASE_ANON_KEY ||
    window.VITE_SUPABASE_ANON_KEY ||
    window.__PE_ENV__?.VITE_SUPABASE_ANON_KEY ||
    "";

  let client = null;
  let cachedUser = null;
  let warnedMissingConfig = false;

  function hasConfig() {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
  }

  function getClient() {
    if (!hasConfig()) {
      if (!warnedMissingConfig) {
        warnedMissingConfig = true;
        console.warn("[Supabase] Missing config: PE_SUPABASE_URL / PE_SUPABASE_ANON_KEY");
      }
      return null;
    }
    if (!window.supabase?.createClient) {
      console.warn("[Supabase] supabase-js is not loaded");
      return null;
    }
    if (!client) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    return client;
  }

  function userIdHash(userId) {
    const s = String(userId || "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function guestNameFromUserId(userId) {
    if (!userId) return "BRAVE-PENGUIN-101";
    const adjectives = [
      "BRAVE","SWIFT","CALM","SMART","BOLD","HAPPY","SHARP","MELLOW",
      "NIMBLE","FRESH","COSMIC","SILENT","MIGHTY","CRISP","GENTLE","WITTY",
    ];
    const nouns = [
      "PENGUIN","APPLE","RIVER","ROCKET","TIGER","NOVA","FOREST","WAVE",
      "OTTER","FALCON","DRAGON","PLANET","MANGO","CLOUD","STONE","COMET",
    ];
    const h = userIdHash(userId);
    const adjective = adjectives[h % adjectives.length];
    const noun = nouns[(h >>> 8) % nouns.length];
    const number = String((h % 900) + 100);
    return `${adjective}-${noun}-${number}`;
  }

  function toDateKey(dateKey) {
    const s = String(dateKey || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function isFunctionMissingError(error) {
    const msg = String(error?.message || "").toLowerCase();
    return msg.includes("does not exist") || (msg.includes("function") && msg.includes("not found"));
  }

  function asPositiveSeconds(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n);
  }

  function normalizeChallengeRow(raw, fallbackRank) {
    const row = raw || {};
    const elapsed =
      row.best_clear_sec ??
      row.elapsed_sec ??
      row.elapsedSec ??
      row.best_sec ??
      row.clear_sec ??
      row.best_time_sec ??
      row.time_sec ??
      row.seconds ??
      null;
    return {
      rank: Number(row.rank ?? fallbackRank ?? 0) || 0,
      user_id: row.user_id || row.userId || null,
      display_name: row.display_name || row.displayName || null,
      best_clear_sec: asPositiveSeconds(elapsed),
      elapsed_sec: asPositiveSeconds(elapsed),
    };
  }

  async function tryRpcVariants(sb, variants) {
    let lastError = null;
    for (const v of variants) {
      try {
        const { data, error } = await sb.rpc(v.fn, v.args || {});
        if (!error) return { data: data || [], error: null, fn: v.fn };
        lastError = error;
      } catch (e) {
        lastError = e;
      }
    }
    return { data: [], error: lastError || new Error("rpc_failed"), fn: null };
  }

  async function ensureProfile(user) {
    const sb = getClient();
    if (!sb || !user?.id) return;
    const metaName =
      String(user.user_metadata?.name || user.user_metadata?.full_name || "").trim().slice(0, 24) || null;
    const row = {
      id: user.id,
      display_name: metaName || guestNameFromUserId(user.id),
    };
    const { error } = await sb.from("profiles").upsert(row, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) {
      console.warn("[Supabase] ensureProfile upsert failed:", error.message);
    }
  }

  async function ensureAuth(options) {
    const allowAnonymous = options?.allowAnonymous !== false;
    const sb = getClient();
    if (!sb) {
      return { user: null, session: null, error: "supabase_not_configured" };
    }

    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError) {
      return { user: null, session: null, error: sessionError.message };
    }

    if (sessionData?.session?.user) {
      cachedUser = sessionData.session.user;
      await ensureProfile(cachedUser);
      return { user: cachedUser, session: sessionData.session, error: null };
    }

    if (!allowAnonymous) {
      return { user: null, session: null, error: "no_session" };
    }

    const { data, error } = await sb.auth.signInAnonymously();
    if (error) {
      return { user: null, session: null, error: error.message };
    }

    cachedUser = data?.user || null;
    await ensureProfile(cachedUser);
    return { user: cachedUser, session: data?.session || null, error: null };
  }

  async function getCurrentUser() {
    if (cachedUser) return cachedUser;
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    cachedUser = data?.user || null;
    return cachedUser;
  }

  async function signInWithGoogle(redirectTo) {
    const sb = getClient();
    if (!sb) return { ok: false, error: "supabase_not_configured" };
    const rt = redirectTo || `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: rt,
        queryParams: { prompt: "select_account" },
      },
    });
    return { ok: !error, error: error?.message || null, data: data || null };
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return { ok: false, error: "supabase_not_configured" };
    const { error } = await sb.auth.signOut();
    cachedUser = null;
    return { ok: !error, error: error?.message || null };
  }

  async function signOutToGuest() {
    const sb = getClient();
    if (!sb) return { ok: false, user: null, session: null, error: "supabase_not_configured" };
    await sb.auth.signOut();
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) return { ok: false, user: null, session: null, error: error.message };
    cachedUser = data?.user || null;
    await ensureProfile(cachedUser);
    return { ok: true, user: cachedUser, session: data?.session || null, error: null };
  }

  function onAuthStateChange(handler) {
    const sb = getClient();
    if (!sb || typeof handler !== "function") return () => {};
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user || null;
      handler(session?.user || null, session || null);
    });
    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }

  async function loadProgress() {
    const auth = await ensureAuth();
    if (!auth.user) return { user: null, progress: null, error: auth.error || "auth_failed" };

    const sb = getClient();
    const { data, error } = await sb
      .from("progress")
      .select("user_id, highest_stage, gold, gem, hint, updated_at")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) return { user: auth.user, progress: null, error: error.message };

    if (data) {
      return {
        user: auth.user,
        progress: {
          highestStage: Number(data.highest_stage) || 1,
          gold: Number(data.gold) || 0,
          gem: Number(data.gem) || 0,
          hint: Number(data.hint) || 0,
          updatedAt: data.updated_at || null,
        },
        error: null,
      };
    }

    const seed = {
      user_id: auth.user.id,
      highest_stage: 1,
      gold: 0,
      gem: 0,
      hint: 0,
    };
    const { error: insertError } = await sb.from("progress").upsert(seed, { onConflict: "user_id" });
    if (insertError) return { user: auth.user, progress: null, error: insertError.message };

    return {
      user: auth.user,
      progress: {
        highestStage: 1,
        gold: 0,
        gem: 0,
        hint: 0,
        updatedAt: null,
      },
      error: null,
    };
  }

  async function saveProgress(payload) {
    const auth = await ensureAuth();
    if (!auth.user) return { ok: false, error: auth.error || "auth_failed" };

    const sb = getClient();
    const row = {
      user_id: auth.user.id,
      highest_stage: Math.max(1, Number(payload?.highestStage || 1)),
      gold: Math.max(0, Number(payload?.gold || 0)),
      gem: Math.max(0, Number(payload?.gem || 0)),
      hint: Math.max(0, Number(payload?.hint || 0)),
    };

    const { error } = await sb.from("progress").upsert(row, { onConflict: "user_id" });
    return { ok: !error, error: error?.message || null };
  }

  async function submitStageClear(stageNumber) {
    const auth = await ensureAuth();
    if (!auth.user) return { ok: false, error: auth.error || "auth_failed" };

    const sb = getClient();
    const safeStage = Math.max(1, Number(stageNumber || 1));

    const { data: cur, error: curError } = await sb
      .from("progress")
      .select("highest_stage")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (curError) return { ok: false, error: curError.message };

    const nextHighest = Math.max(safeStage, Number(cur?.highest_stage || 1));
    const { error } = await sb
      .from("progress")
      .upsert({ user_id: auth.user.id, highest_stage: nextHighest }, { onConflict: "user_id" });

    return { ok: !error, highestStage: nextHighest, error: error?.message || null };
  }

  async function loadDailyStatus(dateKey) {
    const auth = await ensureAuth();
    if (!auth.user) return { user: null, dateKey: null, rows: [], byLevel: {}, error: auth.error || "auth_failed" };

    const dk = toDateKey(dateKey);
    if (!dk) return { user: auth.user, dateKey: null, rows: [], byLevel: {}, error: "invalid_date_key" };

    const sb = getClient();
    const { data, error } = await sb
      .from("daily_status")
      .select("daily_level, clear_count, first_cleared_at, updated_at")
      .eq("user_id", auth.user.id)
      .eq("date_key", dk)
      .order("daily_level", { ascending: true });

    if (error) return { user: auth.user, dateKey: dk, rows: [], byLevel: {}, error: error.message };

    const rows = (data || []).map((r) => ({
      level: Number(r.daily_level),
      clearCount: Number(r.clear_count) || 0,
      firstClearedAt: r.first_cleared_at || null,
      updatedAt: r.updated_at || null,
    }));

    const byLevel = {};
    for (const row of rows) byLevel[row.level] = row;

    return { user: auth.user, dateKey: dk, rows, byLevel, error: null };
  }

  async function submitDailyClear(dateKey, level, elapsedSec) {
    const auth = await ensureAuth();
    if (!auth.user) return { ok: false, error: auth.error || "auth_failed" };

    const dk = toDateKey(dateKey);
    const lv = Math.max(1, Math.min(3, Number(level || 1)));
    const safeElapsedSec = asPositiveSeconds(elapsedSec);
    if (!dk) return { ok: false, error: "invalid_date_key" };

    const sb = getClient();
    const submitVariants = [
      {
        fn: "daily_challenge_submit_clear",
        args: { p_date_key: dk, p_daily_level: lv, p_elapsed_sec: safeElapsedSec },
      },
      {
        fn: "daily_challenge_submit_clear",
        args: { p_date_key: dk, p_level: lv, p_elapsed_sec: safeElapsedSec },
      },
      {
        fn: "submit_daily_challenge_clear",
        args: { p_date_key: dk, p_daily_level: lv, p_elapsed_sec: safeElapsedSec },
      },
      {
        fn: "submit_daily_challenge_clear",
        args: { p_date_key: dk, p_level: lv, p_elapsed_sec: safeElapsedSec },
      },
    ];
    const submitRpc = await tryRpcVariants(sb, submitVariants);
    if (!submitRpc.error) return { ok: true, data: submitRpc.data || null, error: null };
    if (!isFunctionMissingError(submitRpc.error)) {
      return { ok: false, error: submitRpc.error?.message || String(submitRpc.error) };
    }

    const { data: cur, error: curError } = await sb
      .from("daily_status")
      .select("clear_count, first_cleared_at")
      .eq("user_id", auth.user.id)
      .eq("date_key", dk)
      .eq("daily_level", lv)
      .maybeSingle();

    if (curError) return { ok: false, error: curError.message };

    const row = {
      user_id: auth.user.id,
      date_key: dk,
      daily_level: lv,
      clear_count: cur ? (Number(cur.clear_count) || 0) + 1 : 1,
      first_cleared_at: cur?.first_cleared_at || new Date().toISOString(),
    };

    const { error } = await sb.from("daily_status").upsert(row, { onConflict: "user_id,date_key,daily_level" });
    return { ok: !error, error: error?.message || null };
  }

  async function getStageLeaderboardTop(limit) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const sb = getClient();
    const { data, error } = await sb.rpc("stage_leaderboard_top", {
      p_limit: Math.max(1, Math.min(200, Number(limit || 50))),
    });
    return { rows: data || [], error: error?.message || null };
  }

  async function getStageLeaderboardAroundMe(userId, range) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const sb = getClient();
    const targetUserId = userId || auth.user.id;
    const { data, error } = await sb.rpc("stage_leaderboard_around_me", {
      p_user_id: targetUserId,
      p_range: Math.max(1, Math.min(50, Number(range || 10))),
    });
    return { rows: data || [], error: error?.message || null };
  }

  async function getStageLeaderboardAll() {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const sb = getClient();
    const { data, error } = await sb.rpc("stage_leaderboard_all");
    return { rows: data || [], error: error?.message || null };
  }

  async function getDailyLeaderboardTop(dateKey, limit) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const dk = toDateKey(dateKey);
    if (!dk) return { rows: [], error: "invalid_date_key" };
    const sb = getClient();
    const { data, error } = await sb.rpc("daily_leaderboard_top", {
      p_date_key: dk,
      p_limit: Math.max(1, Math.min(200, Number(limit || 50))),
    });
    return { rows: data || [], error: error?.message || null };
  }

  async function getDailyLeaderboardAll(dateKey) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const dk = toDateKey(dateKey);
    if (!dk) return { rows: [], error: "invalid_date_key" };
    const sb = getClient();
    const { data, error } = await sb.rpc("daily_leaderboard_all", {
      p_date_key: dk,
    });
    return { rows: data || [], error: error?.message || null };
  }

  async function getDailyLeaderboardAroundMe(dateKey, userId, range) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const dk = toDateKey(dateKey);
    if (!dk) return { rows: [], error: "invalid_date_key" };
    const sb = getClient();
    const targetUserId = userId || auth.user.id;
    const { data, error } = await sb.rpc("daily_leaderboard_around_me", {
      p_date_key: dk,
      p_user_id: targetUserId,
      p_range: Math.max(1, Math.min(50, Number(range || 10))),
    });
    return { rows: data || [], error: error?.message || null };
  }

  async function getDailyChallengeLeaderboardTop(dateKey, level, limit) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const dk = toDateKey(dateKey);
    if (!dk) return { rows: [], error: "invalid_date_key" };
    const lv = Math.max(1, Math.min(3, Number(level || 1)));
    const safeLimit = Math.max(1, Math.min(200, Number(limit || 50)));
    const sb = getClient();

    const topVariants = [
      {
        fn: "daily_challenge_leaderboard_top",
        args: { p_date_key: dk, p_daily_level: lv, p_limit: safeLimit },
      },
      {
        fn: "daily_challenge_leaderboard_top",
        args: { p_date_key: dk, p_level: lv, p_limit: safeLimit },
      },
      {
        fn: "daily_challenge_top",
        args: { p_date_key: dk, p_daily_level: lv, p_limit: safeLimit },
      },
      {
        fn: "daily_challenge_top",
        args: { p_date_key: dk, p_level: lv, p_limit: safeLimit },
      },
    ];
    const topRpc = await tryRpcVariants(sb, topVariants);
    if (!topRpc.error) {
      const rows = (topRpc.data || []).map((row, idx) => normalizeChallengeRow(row, idx + 1));
      return { rows, error: null };
    }
    if (!isFunctionMissingError(topRpc.error)) {
      return { rows: [], error: topRpc.error?.message || String(topRpc.error) };
    }

    const fallback = await getDailyLeaderboardTop(dk, safeLimit);
    if (fallback?.error) return { rows: [], error: fallback.error };
    const rows = (fallback.rows || []).map((row, idx) => normalizeChallengeRow(row, row.rank ?? (idx + 1)));
    return { rows, error: null };
  }

  async function getDailyChallengeLeaderboardAroundMe(dateKey, level, userId, range) {
    const auth = await ensureAuth();
    if (!auth.user) return { rows: [], error: auth.error || "auth_failed" };
    const dk = toDateKey(dateKey);
    if (!dk) return { rows: [], error: "invalid_date_key" };
    const lv = Math.max(1, Math.min(3, Number(level || 1)));
    const targetUserId = userId || auth.user.id;
    const safeRange = Math.max(1, Math.min(50, Number(range || 10)));
    const sb = getClient();

    const aroundVariants = [
      {
        fn: "daily_challenge_leaderboard_around_me",
        args: { p_date_key: dk, p_daily_level: lv, p_user_id: targetUserId, p_range: safeRange },
      },
      {
        fn: "daily_challenge_leaderboard_around_me",
        args: { p_date_key: dk, p_level: lv, p_user_id: targetUserId, p_range: safeRange },
      },
      {
        fn: "daily_challenge_around_me",
        args: { p_date_key: dk, p_daily_level: lv, p_user_id: targetUserId, p_range: safeRange },
      },
      {
        fn: "daily_challenge_around_me",
        args: { p_date_key: dk, p_level: lv, p_user_id: targetUserId, p_range: safeRange },
      },
    ];
    const aroundRpc = await tryRpcVariants(sb, aroundVariants);
    if (!aroundRpc.error) {
      const rows = (aroundRpc.data || []).map((row, idx) => normalizeChallengeRow(row, idx + 1));
      return { rows, error: null };
    }
    if (!isFunctionMissingError(aroundRpc.error)) {
      return { rows: [], error: aroundRpc.error?.message || String(aroundRpc.error) };
    }

    const fallback = await getDailyLeaderboardAroundMe(dk, targetUserId, safeRange);
    if (fallback?.error) return { rows: [], error: fallback.error };
    const rows = (fallback.rows || []).map((row, idx) => normalizeChallengeRow(row, row.rank ?? (idx + 1)));
    return { rows, error: null };
  }

  async function getMyProfile() {
    const auth = await ensureAuth();
    if (!auth.user) return { profile: null, error: auth.error || "auth_failed" };
    const sb = getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("id, display_name, created_at, updated_at")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) return { profile: null, error: error.message };
    return { profile: data || null, error: null };
  }

  async function updateDisplayName(displayName) {
    const auth = await ensureAuth();
    if (!auth.user) return { ok: false, error: auth.error || "auth_failed" };
    const sb = getClient();
    const name = String(displayName || "").trim().slice(0, 24);
    const row = {
      id: auth.user.id,
      display_name: name || guestNameFromUserId(auth.user.id),
    };
    const { error } = await sb.from("profiles").upsert(row, { onConflict: "id" });
    return {
      ok: !error,
      error: error?.message || null,
      code: error?.code || null,
      details: error?.details || null,
      hint: error?.hint || null,
      displayName: row.display_name,
    };
  }

  window.PE_SUPABASE = {
    hasConfig,
    getClient,
    ensureAuth,
    loadProgress,
    saveProgress,
    submitStageClear,
    loadDailyStatus,
    submitDailyClear,
    getStageLeaderboardTop,
    getStageLeaderboardAroundMe,
    getStageLeaderboardAll,
    getDailyLeaderboardTop,
    getDailyLeaderboardAroundMe,
    getDailyLeaderboardAll,
    getDailyChallengeLeaderboardTop,
    getDailyChallengeLeaderboardAroundMe,
    getMyProfile,
    updateDisplayName,
    getCurrentUser,
    signInWithGoogle,
    signOut,
    signOutToGuest,
    onAuthStateChange,
  };
})();
