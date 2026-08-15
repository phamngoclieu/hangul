import { getSupabaseClient, hasSupabaseConfig } from "./supabase-client.js";

const PROFILE_KEY = "sejongGreen.profiles.v1";
const SHARED_KEY = "sejongGreen.shared.v1";
const DEVICE_KEY = "sejongGreen.deviceId.v1";
const SYNC_SCHEMA = "sejong-green-sync-v2";

let activeSync;

function parse(value, fallback) {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
}

function id() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function defaultProgress() {
  return {
    srs: {}, quizHistory: [], listening: {}, shadow: {}, writing: {},
    flashNotes: {}, writingNotes: {}, reviewAgain: {}, reviewHard: {},
    lastLesson: 1, streak: 0, lastActive: "", sessions: 0
  };
}

function normalizeProfile(profile, user, displayName) {
  const source = profile && typeof profile === "object" ? profile : {};
  return {
    id: `account:${user.id}`,
    accountId: user.id,
    name: String(displayName || source.name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Học viên").slice(0, 64),
    createdAt: source.createdAt || new Date().toISOString(),
    settings: {
      voiceURI: "",
      rate: 0.9,
      language: "vi",
      ...(source.settings || {})
    },
    progress: {
      ...defaultProgress(),
      ...(source.progress || {}),
      flashNotes: { ...(source.progress?.flashNotes || {}) },
      writingNotes: { ...(source.progress?.writingNotes || {}) },
      reviewAgain: { ...(source.progress?.reviewAgain || {}) },
      reviewHard: { ...(source.progress?.reviewHard || {}) }
    }
  };
}

function putAccountProfile(storage, profile) {
  const profiles = parse(storage.local.getItem(PROFILE_KEY), []);
  const kept = profiles.filter(item => item.accountId !== profile.accountId && item.id !== profile.id);
  storage.local.setItem(PROFILE_KEY, JSON.stringify([...kept, profile]));
}

function localPayload(storage, user, deviceId) {
  const profiles = parse(storage.local.getItem(PROFILE_KEY), []);
  const profile = profiles.find(item => item.accountId === user.id);
  if (!profile) return null;
  return {
    schema: SYNC_SCHEMA,
    profile: normalizeProfile(profile, user),
    shared: parse(storage.local.getItem(SHARED_KEY), { vocabulary: null, reports: [] }),
    sync: { deviceId, savedAt: new Date().toISOString() }
  };
}

function applyPayload(storage, payload, user, displayName, session) {
  if (!payload?.profile) return null;
  session.applyingRemote = true;
  try {
    const profile = normalizeProfile(payload.profile, user, displayName);
    putAccountProfile(storage, profile);
    if (payload.shared && typeof payload.shared === "object") {
      storage.local.setItem(SHARED_KEY, JSON.stringify(payload.shared));
    }
    return profile;
  } finally {
    session.applyingRemote = false;
  }
}

async function upsertRemote(session) {
  const payload = localPayload(session.storage, session.user, session.deviceId);
  if (!payload) return;
  session.onStatus?.("saving");
  const profile = payload.profile;
  const [profileResult, stateResult] = await Promise.all([
    session.supabase.from("learner_profiles").upsert({
      user_id: session.user.id,
      display_name: profile.name,
      preferred_language: profile.settings.language || "vi"
    }, { onConflict: "user_id" }),
    session.supabase.from("learner_state").upsert({
      user_id: session.user.id,
      payload
    }, { onConflict: "user_id" })
  ]);
  if (profileResult.error) throw profileResult.error;
  if (stateResult.error) throw stateResult.error;
  session.onStatus?.("synced");
}

function queuePush(session) {
  clearTimeout(session.writeTimer);
  session.writeTimer = setTimeout(async () => {
    if (session.stopped) return;
    if (session.pushing) {
      session.pushAgain = true;
      return;
    }
    session.pushing = true;
    try {
      await upsertRemote(session);
    } catch (error) {
      console.warn("Remote sync failed:", error);
      session.onStatus?.(navigator.onLine ? "error" : "offline");
    } finally {
      session.pushing = false;
      if (session.pushAgain) {
        session.pushAgain = false;
        queuePush(session);
      }
    }
  }, 650);
}

async function pullRemote(session, notify = true) {
  const { data, error } = await session.supabase
    .from("learner_state")
    .select("payload, updated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  if (data.payload.sync?.deviceId === session.deviceId && notify) return null;
  const profile = applyPayload(session.storage, data.payload, session.user, null, session);
  if (profile && notify) session.onRemoteChange?.({ profileId: profile.id });
  session.onStatus?.("synced");
  return profile;
}

export async function startRemoteSync(storage, options = {}) {
  await stopRemoteSync({ flush: false });
  if (!hasSupabaseConfig()) return { enabled: false, reason: "supabase-not-configured" };
  if (!options.user) return { enabled: false, reason: "supabase-user-not-signed-in" };

  const supabase = await getSupabaseClient();
  const deviceId = storage.local.getItem(DEVICE_KEY) || id();
  storage.local.setItem(DEVICE_KEY, deviceId);
  const session = {
    storage,
    supabase,
    user: options.user,
    deviceId,
    onStatus: options.onStatus,
    onRemoteChange: options.onRemoteChange,
    applyingRemote: false,
    pushing: false,
    pushAgain: false,
    stopped: false
  };
  activeSync = session;
  session.onStatus?.("connecting");

  const [remoteProfileResult, remoteStateResult] = await Promise.all([
    supabase.from("learner_profiles").select("display_name, preferred_language").eq("user_id", options.user.id).maybeSingle(),
    supabase.from("learner_state").select("payload, updated_at").eq("user_id", options.user.id).maybeSingle()
  ]);
  if (remoteProfileResult.error) throw remoteProfileResult.error;
  if (remoteStateResult.error) throw remoteStateResult.error;

  let profile;
  if (remoteStateResult.data?.payload?.profile) {
    profile = applyPayload(
      storage,
      remoteStateResult.data.payload,
      options.user,
      remoteProfileResult.data?.display_name,
      session
    );
  } else {
    const profiles = parse(storage.local.getItem(PROFILE_KEY), []);
    const preferred = profiles.find(item => item.id === options.preferredProfileId) ||
      profiles.find(item => item.accountId === options.user.id);
    profile = normalizeProfile(preferred, options.user, remoteProfileResult.data?.display_name);
    session.applyingRemote = true;
    try { putAccountProfile(storage, profile); } finally { session.applyingRemote = false; }
    await upsertRemote(session);
  }

  session.stopStorage = storage.onWrite(event => {
    if (session.applyingRemote || event.scope !== "local") return;
    if (event.key === PROFILE_KEY || event.key === SHARED_KEY) queuePush(session);
  });

  session.channel = supabase
    .channel(`learner-state-${options.user.id}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "learner_state",
      filter: `user_id=eq.${options.user.id}`
    }, change => {
      const payload = change.new?.payload;
      if (!payload || payload.sync?.deviceId === session.deviceId) return;
      const updated = applyPayload(storage, payload, options.user, null, session);
      if (updated) session.onRemoteChange?.({ profileId: updated.id });
      session.onStatus?.("synced");
    })
    .subscribe();

  session.handleOnline = () => {
    session.onStatus?.("connecting");
    pullRemote(session).catch(error => {
      console.warn("Remote refresh failed:", error);
      session.onStatus?.("error");
    });
  };
  session.handleOffline = () => session.onStatus?.("offline");
  window.addEventListener("online", session.handleOnline);
  window.addEventListener("offline", session.handleOffline);
  session.pollTimer = setInterval(() => {
    if (!document.hidden && navigator.onLine) pullRemote(session).catch(() => {});
  }, 45000);

  session.onStatus?.(navigator.onLine ? "synced" : "offline");
  return { enabled: true, userId: options.user.id, profileId: profile.id };
}

export async function stopRemoteSync({ flush = true } = {}) {
  const session = activeSync;
  activeSync = null;
  if (!session) return;
  session.stopped = true;
  clearTimeout(session.writeTimer);
  clearInterval(session.pollTimer);
  session.stopStorage?.();
  window.removeEventListener("online", session.handleOnline);
  window.removeEventListener("offline", session.handleOffline);
  if (flush) {
    try { await upsertRemote(session); } catch (error) { console.warn("Final sync failed:", error); }
  }
  if (session.channel) await session.supabase.removeChannel(session.channel);
}
