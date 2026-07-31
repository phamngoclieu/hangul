import { getSupabaseClient, hasSupabaseConfig } from "./supabase-client.js";

const SYNCED_KEYS = new Set([
  "sejongGreen.profiles.v1",
  "sejongGreen.shared.v1"
]);

let stopListening;

export async function startRemoteSync(storage) {
  if (!hasSupabaseConfig()) {
    return { enabled: false, reason: "supabase-not-configured" };
  }

  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { enabled: false, reason: "supabase-user-not-signed-in" };
  }

  const { data, error } = await supabase
    .from("learner_state")
    .select("payload")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data?.payload) {
    for (const [key, value] of Object.entries(data.payload)) {
      if (SYNCED_KEYS.has(key) && value != null) {
        storage.local.setItem(key, JSON.stringify(value));
      }
    }
  }

  stopListening?.();
  let writeTimer;
  stopListening = storage.onWrite(event => {
    if (event.scope !== "local" || !SYNCED_KEYS.has(event.key)) return;

    clearTimeout(writeTimer);
    writeTimer = setTimeout(async () => {
      const payload = {};
      for (const key of SYNCED_KEYS) {
        const value = storage.local.getItem(key);
        if (!value) continue;
        try {
          payload[key] = JSON.parse(value);
        } catch {
          payload[key] = value;
        }
      }

      const { error: upsertError } = await supabase
        .from("learner_state")
        .upsert({
          user_id: user.id,
          payload,
          updated_at: new Date().toISOString()
        });

      if (upsertError) console.warn("Remote sync failed:", upsertError);
    }, 700);
  });

  return { enabled: true, userId: user.id };
}
