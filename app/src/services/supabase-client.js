let clientPromise;

function publishableKey() {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;
}

export function hasSupabaseConfig() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    publishableKey()
  );
}

export async function getSupabaseClient() {
  if (!hasSupabaseConfig()) return null;

  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(
        import.meta.env.VITE_SUPABASE_URL,
        publishableKey(),
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    );
  }

  return clientPromise;
}
