import { getSupabaseClient, hasSupabaseConfig } from "./supabase-client.js";

function accountRedirectUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export { hasSupabaseConfig };

export async function getAccountSession() {
  if (!hasSupabaseConfig()) return null;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInAccount(email, password) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw error;
  return data;
}

export async function signUpAccount({ displayName, email, password }) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: accountRedirectUrl()
    }
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: accountRedirectUrl() }
  );
  if (error) throw error;
}

export async function updateAccountPassword(password) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOutAccount() {
  if (!hasSupabaseConfig()) return;
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function watchAccountAuth(listener) {
  if (!hasSupabaseConfig()) return () => {};
  const supabase = await getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    listener(event, session);
  });
  return () => data.subscription.unsubscribe();
}
