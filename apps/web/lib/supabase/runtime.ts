const DEMO_AUTH_BYPASS_FLAG = "true";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isUnconfiguredProtectedRouteBypassEnabled() {
  return (
    !isSupabaseConfigured() &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH_BYPASS === DEMO_AUTH_BYPASS_FLAG
  );
}
